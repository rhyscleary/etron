import { Redirect, useRouter } from "expo-router";
import React from "react";

import { Text, Button } from 'react-native';

import { Amplify } from 'aws-amplify';
import { withAuthenticator, useAuthenticator } from '@aws-amplify/ui-react-native';
import '@aws-amplify/ui-react/styles.css';
import awsmobile from '../src/aws-exports';
Amplify.configure(awsmobile);

import { getCurrentUser } from 'aws-amplify/auth';

async function currentAuthenticatedUser() {
    try {
        const { username, userId, signInDetails } = await getCurrentUser();
        console.log(`username: ${username}`);
        console.log(`userId: ${userId}`);
        console.log(`email: ${signInDetails.loginId}`);
        console.log(signInDetails);
    } catch (err) {
        console.log(err);
    }
}

currentAuthenticatedUser();

function App() {
    return ( 
        <>
            <Text>Hello</Text>
        </>
    );
}

export default withAuthenticator(App);