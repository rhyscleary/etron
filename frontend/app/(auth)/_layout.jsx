/*import { Stack, Slot, useRouter } from 'expo-router';

export default function RootLayout() {
    const router = useRouter();

    useEffect(() => {
        router.replace('./landing');
        //router.replace('landing');
    }, []);

    
    return <Slot />;
}*/

import { Slot, router } from 'expo-router';
import { useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { fetchAuthSession } from 'aws-amplify/auth';
import { View, Text } from 'react-native';

export default function AuthLayout() {

    const { signOut, authStatus } = useAuthenticator();

    /*useEffect(() => { 
        async function checkSession() { //detect if session is still valid, sign out if not
            try {
                console.log("Checking session validity...");
                const session = await fetchAuthSession({forceRefresh: false}); //do not force a token refresh, this is only to detect if it's expired
                if (!session.tokens?.accessToken) {
                    throw new Error("No access token");
                }
                console.log("Session: valid");
            } catch (error) {
                console.warn("Session: invalid/expired. Signing out.");
                await signOut(); //waits until the signOut properly finishes before continuing
                router.replace('/');
            }
            console.log("---");
        }

        checkSession();
    }, [])*/

    useEffect(() => {
        console.log("(AuthLayout) Auth status:", authStatus);
        if (authStatus === 'unauthenticated') {
            console.log("Redirecting to root page.")
            router.replace('/landing'); // Go to the protected root page
        } else {
            console.log("Showing authenticated page.")
        }
    }, [authStatus]);

    return (         
        <>
            <Text>Auth _layout</Text>
            <Slot />
        </> 
    );
}