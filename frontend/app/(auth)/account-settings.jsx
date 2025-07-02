import { Redirect, useRouter, router, Link } from "expo-router";
import { PaperProvider, Text } from 'react-native-paper';
import React, { useEffect, useState } from "react";
import { Button, TextInput, View, Pressable } from 'react-native';
import TextField from '../../components/common/input/TextField';
import BasicButton from '../../components/common/buttons/BasicButton';
import { useTheme } from 'react-native-paper';
import GoogleButton from '../../components/common/buttons/GoogleButton';
import MicrosoftButton from '../../components/common/buttons/MicrosoftButton';
import Divider from "../../components/layout/Divider";

import { Amplify } from 'aws-amplify';
import { withAuthenticator, useAuthenticator } from '@aws-amplify/ui-react-native';

import awsmobile from '../../src/aws-exports';
Amplify.configure(awsmobile);

import {
    getCurrentUser,
    fetchAuthSession,
    fetchUserAttributes,
    updateUserAttribute,
    confirmUserAttribute
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

        /*const authSession = await fetchAuthSession();
        console.log("ID Token:", authSession.tokens.idToken);
        console.log("Access Token:", authSession.tokens.accessToken);

        const userAttributes = await fetchUserAttributes();
        console.log("User Attributes:", userAttributes);*/
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

        const { nextStep } = output;

        switch (nextStep.updateAttributeStep) {
            case 'CONFIRM_ATTRIBUTE_WITH_CODE':  //confirming needs to be done with confirmUserAttribute from https://aws-amplify.github.io/amplify-js/api/functions/aws_amplify.auth.confirmUserAttribute.html
                const codeDeliveryDetails = nextStep.codeDeliveryDetails;
                console.log(`Confirmation code was sent to ${codeDeliveryDetails?.deliveryMedium} at ${codeDeliveryDetails?.destination}`);
                break;
            case 'DONE':
                console.log(`Attribute was updated successfully`);
                break;
        }
    } catch (error) {
        console.log("Error updating user attribute:", error);
    }
}

async function handleConfirmUserAttribute(userAttributeKey, confirmationCode) {
    try {
        await confirmUserAttribute({userAttributeKey, confirmationCode});
        console.log("User attribute confirmation successful.");
    } catch (error) {
        console.log("Error confirming user attribute:", error);
    }
}

function App() {
    const [newGivenName, setNewGivenName] = useState('');
    const handleNewGivenNameInput = (text) => {
        setNewGivenName(text);
    }
    const changeGivenNameButtonPressed = () => {
        handleUpdateUserAttribute('given_name', newGivenName);
    }

    const [newFamilyName, setNewFamilyName] = useState('');
    const handleNewFamilyNameInput = (text) => {
        setNewFamilyName(text);
    }
    const changeFamilyNameButtonPressed = () => {
        handleUpdateUserAttribute('family_name', newFamilyName);
    }
    
    const [newPhoneNumber, setNewPhoneNumber] = useState('');
    const handleNewPhoneNumberInput = (text) => {
        setNewPhoneNumber(text);
    }
    const changePhoneNumberButtonPressed = () => {
        handleUpdateUserAttribute('phone_number', newPhoneNumber);
    }

    const [confirmationCode, setConfirmationCode] = useState('');
    const handleConfirmationCodeInput = (text) => {
        setConfirmationCode(text);
    }
    const confirmationCodeButtonPressed = () => {
        handleConfirmUserAttribute("email", confirmationCode);
    }

    const [newEmail, setNewEmail] = useState('');
    const handleNewEmailInput = (text) => {
        setNewEmail(text);
    }
    const changeEmailButtonPressed = () => {
        handleUpdateUserAttribute('email', newEmail);
    }

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false); // toggle sign in vs sign up
    const [message, setMessage] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const router = useRouter();

    useEffect(() => {
        getAuthenticatedUserDetails();
    }, []);

    return ( 
        <>
            <View>
                <Text>Hello</Text>
                <SignOutButton />
            </View>
            <View>
                <TextInput onChangeText={handleNewGivenNameInput}/>
                <Button title="Change first name" onPress={(changeGivenNameButtonPressed)}/>
            </View>
            <View>
                <TextInput onChangeText={handleNewFamilyNameInput}/>
                <Button title="Change last name" onPress={(changeFamilyNameButtonPressed)}/>
            </View>
            <View>
                <TextInput onChangeText={handleNewPhoneNumberInput}/>
                <Button title="Change phone number" onPress={(changePhoneNumberButtonPressed)}/>
            </View>
            <View>
                <TextInput onChangeText={handleNewEmailInput}/>
                <Button title="Change email" onPress={(changeEmailButtonPressed)}/>
            </View>
            <View>
                <TextInput onChangeText={handleConfirmationCodeInput}/>
                <Button title="Confirmation code" onPress={(confirmationCodeButtonPressed)}/>
            </View>
            <Link href="/create-workspace" asChild>
                <Pressable>
                    <Text>Go to Create Workspace</Text>
                </Pressable>
            </Link>
            <Link href="/settings" asChild>
                <Pressable>
                    <Text>Go to Settings</Text>
                </Pressable>
            </Link>
        </>
    );
}

export default App;