import { Redirect, useRouter, router, Link } from "expo-router";
import { PaperProvider, Text } from 'react-native-paper';
import React, { useEffect, useState } from "react";
import { Button, TextInput, View, Pressable } from 'react-native';

import { withAuthenticator, useAuthenticator } from '@aws-amplify/ui-react-native';
import { Amplify } from 'aws-amplify';
import { Storage } from '@aws-amplify/storage';
import awsmobile from '../src/aws-exports';

Amplify.configure(awsmobile);

function App() {
    const { authStatus } = useAuthenticator();

    useEffect(() => {
        console.log("(Landing page). Auth status:", authStatus);
        if (authStatus === 'authenticated') {
            console.log("Redirecting to auth root page.")
            router.replace('/(auth)/profile'); // Go to the protected root page
        } else if (authStatus === "configuring") {
        } else {
            console.log("Showing base page.")
        }
    }, [authStatus]);

    return (
        <>
            <Text>Base empty page</Text>
        </>
    );
}

export default withAuthenticator(App);