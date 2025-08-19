// Author(s): Noah Bradley

import { Redirect, useRouter, router, Link } from "expo-router";
import { ActivityIndicator, PaperProvider, Text } from 'react-native-paper';
import React, { useEffect, useState } from "react";
import { Button, TextInput, View, Pressable } from 'react-native';

import { Amplify } from 'aws-amplify';
import { withAuthenticator, useAuthenticator } from '@aws-amplify/ui-react-native';

// TOOD: make sure all app-wide initialisations are in here

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
    const [target, setTarget] = useState(null);

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

    useEffect(() => {
        console.log("(index.jsx). Auth status:", authStatus);
        if (authStatus === 'authenticated') {
            //if (router.canDismiss()) router.dismissAll();
            console.log("Redirection to auth root page.");
            setTarget("/(auth)/profile")
            //router.replace('/(auth)/profile');
        } else if (authStatus === `configuring`) {

        } else {
            //router.replace('landing');
            setTarget("landing")
        }
    }, [authStatus]);

    if (target) {
        return <Redirect href={target} />;
    }

    return <ActivityIndicator size="large" color="#0000ff" />;

}

//export default withAuthenticator(App);
export default App;