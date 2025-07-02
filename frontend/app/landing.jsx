import { Redirect, useRouter, router, Link } from "expo-router";
import { PaperProvider, Text } from 'react-native-paper';
import React, { useEffect, useState } from "react";
import { Button, TextInput, View, Pressable } from 'react-native';
import TextField from '../components/common/input/TextField';
import BasicButton from '../components/common/buttons/BasicButton';
import { useTheme } from 'react-native-paper';
import GoogleButton from '../components/common/buttons/GoogleButton';
import MicrosoftButton from '../components/common/buttons/MicrosoftButton';
import Divider from "../components/layout/Divider";

import { Amplify } from 'aws-amplify';
import { withAuthenticator, useAuthenticator } from '@aws-amplify/ui-react-native';

import { signIn, signUp } from 'aws-amplify/auth';

import awsmobile from '../src/aws-exports';
Amplify.configure(awsmobile);

function App() {
    const { authStatus } = useAuthenticator();

    useEffect(() => {
        console.log("(landing.jsx). Auth status:", authStatus);
        if (authStatus === 'authenticated') {
            console.log("Redirecting to auth root page.")
            router.replace('(auth)/account-settings'); // Go to the protected root page
        }
    }, [authStatus]);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false); // toggle sign in vs sign up
    const [message, setMessage] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const router = useRouter();

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
            if (password !== confirmPassword) {
                setMessage("Error: Passwords do not match.");
                return;
            }

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

    const theme = useTheme();

    return (
        <View style={{ padding: 20, gap: 30, flex: 1, justifyContent: 'center' }}>
            <Text style={{ fontSize: 40, textAlign: 'center' }}>
                {isSignUp ? 'Welcome' : 'Welcome Back'}
            </Text>

            <View style={{ gap: 30 }}>
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

                {isSignUp && (
                    <TextField
                        label="Confirm Password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        secureTextEntry
                        onChangeText={setConfirmPassword}
                    />
                )}

            </View>

            <View style={{ alignItems: 'flex-end' }}>
                <BasicButton
                    label={isSignUp ? 'Sign Up' : 'Login'}
                    onPress={isSignUp ? handleSignUp : handleSignIn}
                />
            </View>

            <Text style={{ fontSize: 24, textAlign: 'center' }}>
                OR
            </Text>

            <View style={{ gap: 20, marginTop: -10 }}>
                <GoogleButton
                    imageSource={require('../assets/images/Google.jpg')}
                    label="Continue with Google"
                    onPress
                />

                <MicrosoftButton
                    imageSource={require('../assets/images/Microsoft.png')}
                    label="Continue with Microsoft"
                    onPress
                />
            </View>

            <Divider/>

            <BasicButton
                    label={isSignUp ? 'Already have an account? Log In' 
                                    : "Don't have an account? Sign Up"}
                    onPress={() => {
                        setIsSignUp(!isSignUp);
                        setConfirmPassword('');
                    }}
                    fullWidth
                    altBackground='true'
                    altText='true'
                />

            <Text style={{ marginTop: 30 }}>{message}</Text>
        </View>
    );
}

export default App;