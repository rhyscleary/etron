import { Redirect, useRouter, router, Link } from "expo-router";
import { PaperProvider, Text } from 'react-native-paper';
import React, { useEffect, useState } from "react";
import { Button, TextInput, View, Pressable } from 'react-native';

import { Amplify } from 'aws-amplify';
import { withAuthenticator, useAuthenticator } from '@aws-amplify/ui-react-native';

import awsmobile from '../src/aws-exports';
Amplify.configure(awsmobile);

import {
    getCurrentUser,
    fetchAuthSession,
    fetchUserAttributes,
    updateUserAttribute,
    confirmUserAttribute
} from 'aws-amplify/auth';

function App() {
    const { authStatus } = useAuthenticator();

    useEffect(() => {
        console.log("(index.jsx). Auth status:", authStatus);
        if (authStatus === 'authenticated') {
            console.log("Redirecting to auth root page.")
            router.replace('(auth)/account-settings'); // Go to the protected root page
        } else if (authStatus === "configuring") {
        } else {
            router.replace('landing');
        }
    }, [authStatus]);

    //router.push('/landing');

    return (
        <>
            <Text>This page shouldn't be seen.</Text>
        </>
    );
}

//export default withAuthenticator(App);
export default App;