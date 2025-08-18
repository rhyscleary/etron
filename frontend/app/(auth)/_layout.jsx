import { Slot, router } from 'expo-router';
import { useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { fetchAuthSession, fetchUserAttributes, getCurrentUser } from 'aws-amplify/auth';
import { View, Text } from 'react-native';
import { useVerification } from '../../components/layout/VerificationContext'; // temp until backend

export default function AuthLayout() {

    const { authStatus } = useAuthenticator();
    const { verifyingPassword } = useVerification();// temp until backend

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
        try {
            const userAttributes = await fetchUserAttributes();

            let hasWorkspaceAttribute = userAttributes["custom:has_workspace"];

            // if the attribute doesn't exist set it to false
            if (hasWorkspaceAttribute == null) {
                await setHasWorkspaceAttribute(false);
                return false;
            }
    
            return hasWorkspaceAttribute === "true";
        } catch (error) {
            console.error("Error fetching workspace status:", error);
        }
    }

    useEffect(() => {
        const loadLayout = async () => {
            console.log("(AuthLayout) Auth status:", authStatus);

            if (authStatus === 'authenticated') {
                const workspaceExists = await checkWorkspaceExists();
                if (workspaceExists) {
                    console.log("Showing authenticated page.");
                } else {
                    console.log("User authenticated but no workspace found. Redirecting..");
                    router.replace("/(auth)/workspace-choice");
                }
            } else {
                if (!verifyingPassword) {  // temp until backend
                    console.log("Redirecting to root page.")
                    router.replace('landing');
                } else {
                    console.log("Paused redirect due to verifying password.");
                }
            }
        }
        loadLayout();
     }, [authStatus, verifyingPassword]); // temp until backend

    return (         
        <>
            <Slot />
        </> 
    );
}