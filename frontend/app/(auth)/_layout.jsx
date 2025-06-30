import { Slot, router } from 'expo-router';
import { useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { fetchAuthSession } from 'aws-amplify/auth';
import { View, Text } from 'react-native';

export default function AuthLayout() {

    const { authStatus } = useAuthenticator();

    useEffect(() => {
        console.log("(AuthLayout) Auth status:", authStatus);
        if (authStatus === 'authenticated') {
            console.log("Showing authenticated page.")
        } else {
            console.log("Redirecting to root page.")
            router.replace('/'); // Go to the protected root page
        }
    }, [authStatus]);

    return (         
        <>
            <Text>Auth _layout</Text>
            <Slot />
        </> 
    );
}