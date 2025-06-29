import { Redirect, useRouter, router, Link } from "expo-router";
import { PaperProvider, Text } from 'react-native-paper';
import React, { useEffect, useState } from "react";
import { Button, TextInput, View, Pressable } from 'react-native';
import TextField from '../components/common/input/TextField';

import { Amplify } from 'aws-amplify';
import { withAuthenticator, useAuthenticator } from '@aws-amplify/ui-react-native';

import { signIn, signUp } from 'aws-amplify/auth';

import awsmobile from '../src/aws-exports';
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
    const { authStatus } = useAuthenticator();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false); // toggle sign in vs sign up
    const [message, setMessage] = useState('');

    const router = useRouter();

    useEffect(() => {
        console.log("(Landing page). Auth status:", authStatus);
        if (authStatus === 'authenticated') {
            console.log("Redirection to auth root page.")
            router.replace('/(auth)'); // Go to the protected root page
        } else {
            console.log("Showing base page.")
        }
    }, [authStatus]);

    const handleSignIn = async () => {
        try {
            await signIn({ username: email, password });
            setMessage("Sign in successful!");
        } catch (error) {
            console.log('Error signing in:', error);
            setMessage(`Error: ${error.message}`);
        }
    };

    const handleSignUp = async () => {
        try {
            await signUp({
                username: email,
                password,
                options: {
                    userAttributes: {
                        email
                    }
                }
            });
            setMessage("Sign up successful! Check your email to confirm.");
        } catch (error) {
            console.log('Error signing up:', error);
            setMessage(`Error: ${error.message}`);
        }
    };

    return (
        <PaperProvider>
            <View style={{ padding: 20, flex: 1, justifyContent: 'center' }}>
                <Text style={{ fontSize: 24, marginBottom: 20 }}>
                    {isSignUp ? 'Sign Up' : 'Sign In'}
                </Text>

                <TextField
                    label="Email"
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                />

                <TextField
                    label="Password"
                    placeholder="Password"
                    value={password}
                    secureTextEntry
                    onChangeText={setPassword}
                />

                <Button
                    title={isSignUp ? 'Create Account' : 'Login'}
                    onPress={isSignUp ? handleSignUp : handleSignIn}
                />

                <Pressable onPress={() => setIsSignUp(!isSignUp)}>
                    <Text style={{ marginTop: 16, color: 'blue' }}>
                        {isSignUp
                            ? 'Already have an account? Sign In'
                            : "Don't have an account? Sign Up"}
                    </Text>
                </Pressable>

                <Text style={{ marginTop: 20 }}>{message}</Text>
            </View>
        </PaperProvider>
    );
}

export default App;