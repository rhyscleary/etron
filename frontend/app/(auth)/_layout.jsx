import { Slot, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { fetchAuthSession } from 'aws-amplify/auth';
import { View, Text } from 'react-native';
import { useVerification } from '../../contexts/VerificationContext'; // temp until backend

export default function AuthLayout() {

    const { authStatus } = useAuthenticator();
    const { verifyingPassword } = useVerification(); // temp until backend

    useEffect(() => {
        //if (checked) return;

        const loadLayout = async () => {
            console.log("(AuthLayout) Auth status:", authStatus);

            if (authStatus === 'authenticated') {
                const workspaceExists = await checkWorkspaceExists();
                const personalDetailsExists = await checkPersonalDetailsExists();

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