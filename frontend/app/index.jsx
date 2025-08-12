// Author(s): Noah Bradley

import { Redirect, useRouter, router, Link } from "expo-router";
import { ActivityIndicator, PaperProvider, Text } from 'react-native-paper';
import React, { useEffect, useState } from "react";
import { Button, TextInput, View, Pressable } from 'react-native';

import { Amplify } from 'aws-amplify';
import { withAuthenticator, useAuthenticator } from '@aws-amplify/ui-react-native';

import awsmobile from '../src/aws-exports';
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

    useEffect(() => {
        console.log("(index.jsx). Auth status:", authStatus);
        if (authStatus === 'authenticated') {
            console.log("Redirecting to auth root page.")
            router.replace('/(auth)/profile'); // Go to the protected root page
        } else if (authStatus === "configuring") {
        } else {
            router.replace('landing');
        }
    }, [authStatus]);

    return (
        <>
            <ActivityIndicator size="large" color="#0000ff" />
        </>
    );
}

//export default withAuthenticator(App);
export default App;