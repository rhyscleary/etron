import { Slot, router } from 'expo-router';
import { useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { fetchUserAttributes, signOut, updateUserAttributes } from 'aws-amplify/auth';
import { useVerification } from '../../components/layout/VerificationContext'; // temp until backend
import { getWorkspaceId, removeWorkspaceInfo } from '../../storage/workspaceStorage';
import { saveUserInfo } from '../../storage/userStorage';
import { saveRole, getRole, getPermissions } from '../../storage/permissionsStorage';
import { apiGet } from '../../utils/api/apiClient';
import endpoints from '../../utils/api/endpoints';
import { unloadProfilePhoto } from '../../utils/profilePhoto';

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
                workspace = await apiGet(
                    endpoints.workspace.core.getByUserId(userId)
                );
            } catch (error) {
                if (error.message.includes("Workspace not found")) {
                    console.log("No workspace yet, resetting attribute.");
                    await removeWorkspaceInfo();
                    await setHasWorkspaceAttribute(false);
                    return false;
                }                
                console.error("Unexpected error fetching workspace:", error);
                return false;
            }
            
            if (workspace?.workspaceId) {
                console.log("WorkspaceId received from server:", workspace.workspaceId);

                // Save user's role details
                try {
                    const userRole = await apiGet(endpoints.workspace.roles.getRoleOfUser(workspace.workspaceId));
                    await saveRole(userRole);
                } catch (error) {
                    console.error("Error saving user's role details into local storage:", error);
                }      

                return true;
            }

            // if user attribute has_workspace === true but not in DynamoDB force sign out
            console.log("Workspace not found, clearing user attribute and local storage");
            // remove it from local storage
            await removeWorkspaceInfo();
            // set attribute to false
            await setHasWorkspaceAttribute(false);
            return false;
        }

        return false;
    }

    const checkPersonalDetailsExists = async () => {
        try {
            const userAttributes = await fetchUserAttributes();

            const hasGivenName = userAttributes["given_name"];
            const hasFamilyName = userAttributes["family_name"];

            // if the name attributes don't exist, return false
            if (!hasGivenName || !hasFamilyName) {
                return false;
            }

            // validate and return given and family name status
            return !!(hasGivenName && hasFamilyName);

        } catch (error) {
            console.error("Error fetching user attributes:", error);
            return false;
        }
    }

    const saveUserInfoIntoStorage = async() => {
        const workspaceId = await getWorkspaceId();
        const userAttributes = await fetchUserAttributes();
        try {
            const userInfo = await apiGet(endpoints.workspace.users.getUser(workspaceId, userAttributes.sub));
            await saveUserInfo(userInfo);  // Saves into local storage
        } catch (error) {
            console.error("Error saving user info into storage:", error);
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
                    await unloadProfilePhoto();
                    console.log("User authenticated but no workspace or personal details found. Redirecting..");
                    router.replace("/(auth)/personalise-account");
                } else if (!workspaceExists) {
                    console.log("User authenticated but no workspace found. Redirecting..");
                    router.replace("/(auth)/workspace-choice");
                } else {
                    saveUserInfoIntoStorage();
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