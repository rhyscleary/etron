// Author(s): Noah Bradley

import { Redirect, useRouter, router, Link } from "expo-router";
import { ActivityIndicator, PaperProvider, Text } from 'react-native-paper';
import React, { useEffect, useState } from "react";
import { Button, TextInput, View, Pressable } from 'react-native';

import { Amplify } from 'aws-amplify';
import { withAuthenticator, useAuthenticator } from '@aws-amplify/ui-react-native';

import awsmobile from '../src/aws-exports';
import { fetchUserAttributes, updateUserAttributes } from "aws-amplify/auth";
Amplify.configure({
    ...awsmobile,
    oauth: {
        domain: 'etrontest.auth.ap-southeast-2.amazoncognito.com',
        scope: ['email', 'openid', 'profile'],
        redirectSignIn: 'myapp://auth/',
        redirectSignOut: 'myapp://signout/',
        responseType: 'code'
    }
});
console.log('Amplify configured with:', Amplify.getConfig());


function App() {
    const { authStatus } = useAuthenticator();

    const setHasWorkspaceAttribute = async (value) => {
        try {
            await updateUserAttributes({
                userAttributes: {
                    'custom:has_workspace': value
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
        const handleAuth = async () => {
            console.log("(index.jsx). Auth status:", authStatus);
            if (authStatus === 'authenticated') {
                const workspaceExists = await checkWorkspaceExists();
                if (workspaceExists) {
                    console.log("Redirection to auth root page.");
                    router.replace('/(auth)/profile');
                } else {
                    console.log("No workspace, sending to workspace choice");
                    router.replace('/(auth)/workspace-choice');
                }
            } else {
                router.replace('landing');
            }
        };
        handleAuth();
    }, [authStatus]);

    return (
        <>
            <ActivityIndicator size="large" color="#0000ff" />
        </>
    );
}

//export default withAuthenticator(App);
export default App;