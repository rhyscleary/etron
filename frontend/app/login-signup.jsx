import { Redirect, useRouter, router, Link, useLocalSearchParams } from "expo-router";
import { PaperProvider, Text } from 'react-native-paper';
import React, { useEffect, useState } from "react";
import { Button, TextInput, View, Pressable, Modal, StyleSheet } from 'react-native';
import TextField from '../components/common/input/TextField';
import BasicButton from '../components/common/buttons/BasicButton';
import { useTheme } from 'react-native-paper';
import GoogleButton from '../components/common/buttons/GoogleButton';
import MicrosoftButton from '../components/common/buttons/MicrosoftButton';
import Divider from "../components/layout/Divider";

import { Amplify } from 'aws-amplify';
import { useAuthenticator } from '@aws-amplify/ui-react-native';

import { signIn, signUp, confirmSignUp } from 'aws-amplify/auth';

import awsmobile from '../src/aws-exports';
Amplify.configure(awsmobile);

function App() {
    const { authStatus } = useAuthenticator();

    useEffect(() => {
        console.log("(landing.jsx). Auth status:", authStatus);
        if (authStatus === 'authenticated') {
            console.log("Redirecting to auth root page.")
            router.replace('(auth)/profile'); // Go to the protected root page
        }
    }, [authStatus]);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    //const [isSignUp, setIsSignUp] = useState(false); // toggle sign in vs sign up
    const [message, setMessage] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');

    const router = useRouter();

    const { isSignUp } = useLocalSearchParams();
    const isSignUpBool = isSignUp === 'true'

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
            setShowVerificationModal(true);
        } catch (error) {
            console.log('Error signing up:', error);
            setMessage(`Error: ${error.message}`);
        }
    };

    const handleGoogleSignIn = () => {
        console.log('Google Sign-In pressed');
    };

    const handleMicrosoftSignIn = () => {
        console.log('Microsoft Sign-In pressed');
    };

    const handleConfirmCode = async () => {
        try {
            await confirmSignUp({ username: email, confirmationCode: verificationCode });
            setShowVerificationModal(false);
            setMessage("Confirmation successful! Please personalize your account.");

            // Navigate to personalization page
            router.push('(auth)/personalise-account');
        } catch (error) {
            console.log('Error confirming code:', error);
            setMessage(`Error: ${error.message}`);
        }
    };

    const theme = useTheme();

    return (
        <View style={{ padding: 20, gap: 30, flex: 1, justifyContent: 'center' }}>
            <Text style={{ fontSize: 40, textAlign: 'center' }}>
                {isSignUpBool ? 'Welcome' : 'Welcome Back'}
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

                {isSignUpBool && (
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
                    label={isSignUpBool ? 'Sign Up' : 'Login'}
                    onPress={isSignUpBool ? handleSignUp : handleSignIn}
                />
            </View>

            <Text style={{ fontSize: 24, textAlign: 'center' }}>
                OR
            </Text>

            <View style={{ gap: 20, marginTop: -10 }}>
                <GoogleButton
                    imageSource={require('../assets/images/Google.jpg')}
                    label="Continue with Google"
                    onPress={handleGoogleSignIn}
                />

                <MicrosoftButton
                    imageSource={require('../assets/images/Microsoft.png')}
                    label="Continue with Microsoft"
                    onPress={handleMicrosoftSignIn}
                />
            </View>

            <Divider/>

            <BasicButton
                    label={isSignUpBool ? 'Already have an account? Log In' 
                                    : "Don't have an account? Sign Up"}
                    onPress={() => {
                        router.push({
                            pathname: '/login-signup',
                            params: { isSignUp: (!isSignUpBool).toString() },
                        });
                        setConfirmPassword('');
                    }}
                    fullWidth
                    altBackground='true'
                    altText='true'
                />

            <Text style={{ marginTop: 30 }}>{message}</Text>

            <Modal
                visible={showVerificationModal}
                animationType="slide"
                transparent={true}
            >
                <View style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.5)'
                }}>
                    <View style={{
                        backgroundColor: theme.colors.background,
                        padding: 10,
                        borderRadius: 10,
                        width: '65%',
                        alignItems: 'center'
                    }}>
                        <Text style={{ fontSize: 24, marginBottom: 20 }}>
                            Enter Verification Code
                        </Text>
                    
                        <TextInput
                            placeholder="Code"
                            value={verificationCode}
                            onChangeText={setVerificationCode}
                            keyboardType="numeric"
                            style={{ borderWidth: 1, padding: 10, marginBottom: 20 }}
                        />

                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            width: '100%',
                            marginBottom: 20
                        }}>
                            <BasicButton
                                label="Cancel"
                                fullWidth='true'
                                danger="true"
                                onPress={() => setShowVerificationModal(false)}
                                style={{ marginRight: 50 }}
                            />
                            
                            <BasicButton
                                label="Confirm"
                                fullWidth='true'
                                onPress={handleConfirmCode}
                                style={{ marginRight: 50 }}
                            />
                        </View>
                        
                    </View>
                </View>
            </Modal>
        </View>
    );
}

export default App;