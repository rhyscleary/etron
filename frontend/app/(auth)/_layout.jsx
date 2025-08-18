import { Slot, router } from 'expo-router';
import { useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { fetchAuthSession } from 'aws-amplify/auth';
import { View, Text } from 'react-native';
import { useVerification } from '../../contexts/VerificationContext'; // temp until backend

export default function AuthLayout() {

    const { authStatus } = useAuthenticator();
    const { verifyingPassword } = useVerification(); // temp until backend

    useEffect(() => {
        console.log("(AuthLayout) Auth status:", authStatus);
        if (authStatus === 'authenticated') {
            console.log("Showing authenticated page.")
        } else {
            if (!verifyingPassword) {  // temp until backend
                console.log("Redirecting to root page.")
                router.replace('/');
            } else {
                console.log("Paused redirect due to verifying password.");
            }
        }
     }, [authStatus, verifyingPassword]); // temp until backend

    return (         
        <>
            <Slot />
        </> 
    );
}