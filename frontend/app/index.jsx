import { Redirect, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, Button, TextInput } from 'react-native';

import { Amplify } from 'aws-amplify';
import { withAuthenticator, useAuthenticator } from '@aws-amplify/ui-react-native';

import awsmobile from '../src/aws-exports';
Amplify.configure(awsmobile);

import {
    getCurrentUser,
    fetchAuthSession,
    fetchUserAttributes,
    updateUserAttribute
} from 'aws-amplify/auth';


function SignOutButton() {
    const { signOut } = useAuthenticator();
    return (
        <Button onPress={signOut} title="Sign Out" />
    )
}

async function getAuthenticatedUserDetails() {
    try {
        const { username, userId, signInDetails } = await getCurrentUser();
        console.log(`username: ${username}`);
        console.log(`userId: ${userId}`);
        console.log(`email: ${signInDetails.loginId}`);
        console.log(signInDetails);

        const authSession = await fetchAuthSession();
        console.log("ID Token:", authSession.tokens.idToken);
        console.log("Access Token:", authSession.tokens.accessToken);

        const userAttributes = await fetchUserAttributes();
        console.log("User Attributes:", userAttributes);
    } catch (err) {
        console.log(err);
    }
}

async function handleUpdateUserAttribute(attributeKey, value) {
    try {
        const output = await updateUserAttribute({
            userAttribute: {
                attributeKey,
                value
            }
        });  //sometimes, output needs to be checked via nextStep property for if it needs a confirmation code
        handleUpdateUserAttributeNextSteps(output);
    } catch (error) {
        console.log("Error updating user attribute:", error);
    }
}

function handleUpdateUserAttributeNextSteps(output) {
    const { nextStep } = output;

    switch (nextStep.updateAttributeStep) {
        case 'CONFIRM_ATTRIBUTE_WITH_CODE':  //confirming needs to be done with confirmUserAttribute from https://aws-amplify.github.io/amplify-js/api/functions/aws_amplify.auth.confirmUserAttribute.html
            const codeDeliveryDetails = nextStep.codeDeliveryDetails;
            console.log(`Confirmation code was sent to ${codeDeliveryDetails?.deliveryMedium} at ${codeDeliveryDetails?.destination}`);
            break;
        case 'DONE':
            console.log(`attribute was updated successfully`);
            break;
    }
}

function App() {
    const [newName, setNewName] = useState('');

    const handleNewNameChange = (text) => {
        setNewName(text);
    }

    const changeNameButtonPressed = () => {
        handleUpdateUserAttribute('given_name', newName);
    }

    useEffect(() => {
        getAuthenticatedUserDetails();
    }, []);

    return ( 
        <>
            <Text>Hello</Text>
            <SignOutButton />
            <TextInput value={newName} onChangeText={handleNewNameChange}/>
            <Button title="changeName" onPress={(changeNameButtonPressed)}/>
        </>
    );
}

export default withAuthenticator(App);