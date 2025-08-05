import { Redirect, useRouter, router, Link } from "expo-router";
import { PaperProvider, Text } from 'react-native-paper';
import React, { useEffect, useState } from "react";
import { Button, TextInput, View, Pressable, ScrollView } from 'react-native';
import TextField from '../../components/common/input/TextField';
import BasicButton from '../../components/common/buttons/BasicButton';
import { useTheme } from 'react-native-paper';
import GoogleButton from '../../components/common/buttons/GoogleButton';
import MicrosoftButton from '../../components/common/buttons/MicrosoftButton';
import Divider from "../../components/layout/Divider";
import StackLayout from '../../components/layout/StackLayout';
import { commonStyles } from '../../assets/styles/stylesheets/common';
import Header from "../../components/layout/Header";

import { Amplify, Storage } from 'aws-amplify';
import { withAuthenticator, useAuthenticator } from '@aws-amplify/ui-react-native';

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
        console.log("Log in details")
        const { username, userId, signInDetails } = await getCurrentUser();
        console.log(`userId: ${userId}`);
        console.log(`email: ${signInDetails.loginId}`);

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
    const [givenName, setGivenName] = useState('');
    const [familyName, setFamilyName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [confirmationCode, setConfirmationCode] = useState('');
    const [email, setEmail] = useState('');

    const changeGivenNameButtonPressed = () => {
        handleUpdateUserAttribute('given_name', givenName);
    }

    const changeFamilyNameButtonPressed = () => {
        handleUpdateUserAttribute('family_name', familyName);
    }
    
    const changePhoneNumberButtonPressed = () => {
        handleUpdateUserAttribute('phone_number', phoneNumber);
    }

    const confirmationCodeButtonPressed = () => {
        handleConfirmUserAttribute("email", confirmationCode);
    }

    const changeEmailButtonPressed = () => {
        handleUpdateUserAttribute('email', email);
    }

    const router = useRouter();

    useEffect(() => {
        getAuthenticatedUserDetails();
    }, []);

    return ( 
        <View>
            <Header title="Temp Account Settings" showMenu />

            <ScrollView contentContainerStyle={commonStyles.scrollableContentContainer}>
                <StackLayout spacing={34}>
                    {/*Temporary redirect to profile screen*/}
                    <Button title="Temporary - Back to Dashboard" onPress={() => router.back()}>
                        <Pressable>
                            <Text>Go to Profile</Text>
                        </Pressable>
                    </Button>
                    <SignOutButton />
                    <TextField
                        label="Given Name"
                        value={givenName}
                        placeholder="Enter your given name"
                        textContentType="givenName"
                        onChangeText={(text) => setGivenName(text)}
                    />
                    <Button title="Change first name" onPress={(changeGivenNameButtonPressed)}/>
                    <TextField
                        label="Family Name"
                        value={familyName}
                        placeholder="Enter your family name"
                        textContentType="familyName"
                        onChangeText={(text) => setFamilyName(text)}
                    />
                    <Button title="Change last name" onPress={(changeFamilyNameButtonPressed)}/>
                    <TextField
                        label="Phone Number"
                        value={phoneNumber}
                        placeholder="Enter your phone number"
                        textContentType="telephoneNumber"
                        onChangeText={(text) => setPhoneNumber(text)}
                    />
                    <Button title="Change phone number" onPress={(changePhoneNumberButtonPressed)}/>
                    <TextField
                        label="Email"
                        value={email}
                        placeholder="Enter your email"
                        textContentType="emailAddress"
                        onChangeText={(text) => setEmail(text)}
                    />
                    <Button title="Change email" onPress={(changeEmailButtonPressed)}/>
                    <TextField
                        label="Confirmation Code"
                        value={confirmationCode}
                        placeholder="Enter confirmation code"
                        textContentType="oneTimeCode"
                        onChangeText={(text) => setConfirmationCode(text)}
                    />
                    <Button title="Send Confirmation Code" onPress={(confirmationCodeButtonPressed)}/>
                    <Link href="/create-workspace" asChild>
                        <Pressable>
                            <Text>Go to Create Workspace</Text>
                        </Pressable>
                    </Link>
                </StackLayout>
            </ScrollView>
        </View>
    );
}

export default App;