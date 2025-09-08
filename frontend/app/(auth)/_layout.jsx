import { Slot, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { fetchAuthSession, fetchUserAttributes, getCurrentUser, signOut, updateUserAttributes } from 'aws-amplify/auth';
import { View, Text, ActivityIndicator } from 'react-native';
import { useVerification } from '../../contexts/VerificationContext';
import { getWorkspaceId } from '../../storage/workspaceStorage';

export default function AuthLayout() {

    const { authStatus } = useAuthenticator();
    const { verifyingPassword } = useVerification();// temp until backend
   // const [checked, setChecked] = useState(false);

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
        let hasWorkspaceAttribute = null;
        try {
            const userAttributes = await fetchUserAttributes();

            hasWorkspaceAttribute = userAttributes["custom:has_workspace"];

            // if the attribute doesn't exist set it to false
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
            const workspaceId = await getWorkspaceId();
            if (workspaceId) {
                console.log("WorkspaceId received from local storage:", workspaceId);
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

            // if the name attributes don't exist return false
            if (!hasGivenName || !hasFamilyName) {
                return false;
            }
    
            return true;
        } catch (error) {
            console.error("Error fetching user attributes:", error);
            return false;
        }
    }

    useEffect(() => {
        //if (checked) return;

        const loadLayout = async () => {
            console.log("(AuthLayout) Auth status:", authStatus);

            if (authStatus === 'authenticated') {
                const workspaceExists = await checkWorkspaceExists().catch(() => false);
                const personalDetailsExists = await checkPersonalDetailsExists().catch(() => false);

                if (!workspaceExists && !personalDetailsExists) {
                    console.log("User authenticated but no workspace or personal details found. Redirecting..");
                    router.replace("/(auth)/personalise-account");
                } else if (!workspaceExists) {
                    console.log("User authenticated but no workspace found. Redirecting..");
                    router.replace("/(auth)/workspace-choice");
                } else {
                    console.log("Showing authenticated profile page.");
                    router.replace("/(auth)/profile")
                }

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

            //setChecked(true);
        }
        loadLayout();

     }, [authStatus, verifyingPassword]); // temp until backend

     /*if (!checked) {
        return <ActivityIndicator size="large" />
     }*/

    return (         
        <>
            <Slot />
        </> 
    );
}