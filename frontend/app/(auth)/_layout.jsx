import { Slot, router } from 'expo-router';
import { useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { fetchAuthSession, fetchUserAttributes, getCurrentUser, signOut, updateUserAttributes } from 'aws-amplify/auth';
import { View, Text, ActivityIndicator } from 'react-native';
import { useVerification } from '../../contexts/VerificationContext';
import { getWorkspaceId, saveWorkspaceInfo } from '../../storage/workspaceStorage';
import { saveUserInfo } from '../../storage/userStorage';
import { saveRole, getRole, getPermissions } from '../../storage/permissionsStorage';
import { apiGet } from '../../utils/api/apiClient';
import endpoints from '../../utils/api/endpoints';

export default function AuthLayout() {
    const { authStatus } = useAuthenticator();
    const { verifyingPassword } = useVerification();

    const setHasWorkspaceAttribute = async (value) => {
        try {
            await updateUserAttributes({
                userAttributes: {
                    'custom:has_workspace': value ? 'true' : 'false'
                }
            });
        } catch (error) {
            console.error("Unable to update user attribute has_workspace:", error);
        }
    }

    const checkWorkspaceExists = async () => {
        console.log("checking if workspace exists");
        let hasWorkspaceAttribute = null;
        try {
            const userAttributes = await fetchUserAttributes();

            hasWorkspaceAttribute = userAttributes["custom:has_workspace"];

            // if the attribute doesn't exist, set it to false
            if (hasWorkspaceAttribute == null) {
                await setHasWorkspaceAttribute(false);
                const refreshed = await fetchUserAttributes();
                hasWorkspaceAttribute = refreshed["custom:has_workspace"];
            }
    
        } catch (error) {
            console.error("Error fetching workspace status:", error);
            return false;
        }

        if (hasWorkspaceAttribute === "true") {
            const userAttributes = await fetchUserAttributes();
            const userId = userAttributes.sub;

            let workspace;
            try {
                const result = await apiGet(endpoints.workspace.core.getByUserId(userId));
                workspace = result.data;
            } catch (error) {
                if (error.message.includes("Workspace not found")) {
                    console.log("No workspace yet, resetting attribute...");
                    await removeWorkspaceInfo();
                    await setHasWorkspaceAttribute(false);
                    return false;
                } else if (error.message.includes("No user found")) {
                    console.log("No user found, rerouting to landing page...")
                    router.replace("/landing.jsx");
                    return false;
                }
                console.error("Error fetching workspace:", error);
                return false;
            }
            
            if (workspace.workspaceId) {
                console.log("WorkspaceId received from server:", workspace.workspaceId);
                return true;
            }

            // if user attribute has_workspace === true but not in local storage force sign out
            console.log("WorkspaceId cannot be fetched from local storage");
            await signOut();
        }

        return false;
    }

    const checkPersonalDetailsExists = async () => {
        try {
            const userAttributes = await fetchUserAttributes();

            const hasGivenName = userAttributes["given_name"];
            const hasFamilyName = userAttributes["family_name"];

            // if the name attributes don't exist, return false
            if (hasGivenName && hasFamilyName) {
                return true;
            }
    
            return false;
        } catch (error) {
            console.error("Error fetching user attributes:", error);
            return false;
        }
    }

    const saveInfoIntoStorage = async() => {
        const workspaceId = await getWorkspaceId();
        const userAttributes = await fetchUserAttributes();
        try {
            const result = await apiGet(endpoints.workspace.users.getUser(workspaceId, userAttributes.sub));
            await saveUserInfo(result.data);  // Saves into local storage
        } catch (error) {
            console.error("Error saving user info into storage:", error);
        }

        try {
            const result = await apiGet(endpoints.workspace.roles.getRoleOfUser(workspaceId));
            await saveRole(result.data);
        } catch (error) {
            console.error("Error saving user's role details into local storage:", error);
        }
        
        try {
            const result = await apiGet(endpoints.workspace.core.getByUserId(userAttributes.sub));
            await saveWorkspaceInfo(result.data);
        } catch (error) {
            console.error("Error saving workspace info into storage:", error);
        }
    }

    const checkAuthStatus = async () => {
        console.log("(AuthLayout) Auth status:", authStatus);

        if (authStatus === 'authenticated') {
            const personalDetailsExists = await checkPersonalDetailsExists().catch(() => false);
            if (!personalDetailsExists) {
                router.replace("/(auth)/personalise-account");
                return;
            }

            const workspaceExists = await checkWorkspaceExists().catch(() => false);
            if (!workspaceExists) {
                router.replace("/(auth)/workspace-choice")
                return;
            }
            
            saveInfoIntoStorage();
            router.replace("/(auth)/dashboard")
        } else if (authStatus === `configuring`) {
            console.log("Auth status configuring...")
        } else {
            if (!verifyingPassword) {  // temp until backend
                console.log("Redirecting to root page.");
                if (router.canDismiss()) router.dismissAll();
                router.replace('/landing');
            } else {
                console.log("Paused redirect due to verifying password.");
            }
        }
    }

    useEffect(() => {
        checkAuthStatus();
    }, [authStatus, verifyingPassword]);


    return (         
        <>
            <Slot />
        </> 
    );
}