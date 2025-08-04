import { Redirect, useRouter, router, Link, useLocalSearchParams } from "expo-router";
import { PaperProvider, Text } from 'react-native-paper';
import React, { useEffect, useState } from "react";
import { TextInput, View, Modal, Linking } from 'react-native';
import TextField from '../components/common/input/TextField';
import BasicButton from '../components/common/buttons/BasicButton';
import { useTheme } from 'react-native-paper';
import GoogleButton from '../components/common/buttons/GoogleButton';
import MicrosoftButton from '../components/common/buttons/MicrosoftButton';
import Divider from "../components/layout/Divider";
import Header from "../components/layout/Header";
import { commonStyles } from "../assets/styles/stylesheets/common";

import { Amplify } from 'aws-amplify';

import { 
    signIn, 
    signUp, 
    confirmSignUp, 
    signInWithRedirect, 
    getCurrentUser, 
    signOut,
} from 'aws-amplify/auth';

import awsmobile from '../src/aws-exports';
Amplify.configure(awsmobile);

function LoginSignup() {
    const { email: emailParam, isSignUp, link, fromAccounts } = useLocalSearchParams();
    const isSignUpBool = isSignUp === 'true';
    const isLinking = link === 'true';

    const [email, setEmail] = useState(emailParam || "");
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState({ google: false, microsoft: false });
    const [signedOutForLinking, setSignedOutForLinking] = useState(!isLinking); // true if not linking

    const router = useRouter();
    const theme = useTheme();

    useEffect(() => {
        if (isLinking && !signedOutForLinking) {
            (async () => {
                try {
                    await signOut();
                    setSignedOutForLinking(true);
                    console.log("Signed out for linking.");
                } catch (err) {
                    console.error("Error signing out before linking:", err);
                    setMessage("Error signing out previous user. Please try again.");
                }
            })();
        }
    }, [isLinking, signedOutForLinking]);

    // handle deep link return from the social providers
    useEffect(() => {
        const handleDeepLink = async (url) => {
            console.log('Deep link received:', url);
            
            // check if the URL is a valid social sign-in callback
            if (url && (url.includes('oauth/callback') || url.includes('auth/callback'))) {
                try {
                    // wait to ensure the sign-in process completes
                    setTimeout(async () => {
                        try {
                            const user = await getCurrentUser();
                            console.log('Social sign-in successful:', user);
                            // navigate to profile page (or consider back to accounts page again)
                            router.push("(auth)/profile");
                        } catch (error) {
                            console.log('No authenticated user found after social sign-in');
                            setMessage("Social sign-in was cancelled or failed");
                        }
                    }, 1000);
                } catch (error) {
                    console.log('Error handling social sign-in callback:', error);
                    setMessage("Error completing social sign-in");
                }
            }
        };

        // listen for deep links
        const subscription = Linking.addEventListener('url', handleDeepLink);

        // check if the app was opened with a deep link
        Linking.getInitialURL().then(handleDeepLink);

        return () => subscription?.remove();
    }, []);

    const handleSignIn = async () => {
        setLoading(true);
        setMessage('');
        try {
            await signIn({ username: email, password });
            router.push("(auth)/profile"); // always push to profile after sign in
        } catch (error) {
            console.log('Error signing in:', error);
            setMessage(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async () => {
        setMessage('');
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

    const handleGoogleSignIn = async () => {
        setSocialLoading({ ...socialLoading, google: true });
        setMessage('');
        
        try {
            console.log('Initiating Google Sign-In...');
            
            // TODO: backend please set up the Google OAuth provider in Cognito
            
            await signInWithRedirect({
                provider: 'Google',
                customState: isLinking ? 'linking' : 'signin'
            });
            
        } catch (error) {
            console.log('Error with Google sign-in:', error);
            setMessage(`Google sign-in error: ${error.message}`);
            setSocialLoading({ ...socialLoading, google: false });
        }
    };

    const handleMicrosoftSignIn = async () => {
        setSocialLoading({ ...socialLoading, microsoft: true });
        setMessage('');
        
        try {
            console.log('Initiating Microsoft Sign-In...');
            
            // TODO: backend please set up the Microsoft OAuth provider in Cognito
            
            await signInWithRedirect({
                provider: 'SignIn', // change this to the correct provider name when configured
                customState: isLinking ? 'linking' : 'signin'
            });
            
        } catch (error) {
            console.log('Error with Microsoft sign-in:', error);
            setMessage(`Microsoft sign-in error: ${error.message}`);
            setSocialLoading({ ...socialLoading, microsoft: false });
        }
    };

    // alternative social sign-in method using custom OAuth endpoints (i dont know how you are setting this up, and can't test it)
    const handleSocialSignInAlternative = async (provider) => {
        try {
            const oauthConfig = {
                google: {
                    // replace with Google OAuth configuration
                    clientId: 'GOOGLE_CLIENT_ID',
                    redirectUri: 'APP_REDIRECT_URI',
                    scope: 'openid email profile',
                    responseType: 'code'
                },
                microsoft: {
                    // replace with Microsoft OAuth configuration
                    clientId: 'MICROSOFT_CLIENT_ID',
                    redirectUri: 'APP_REDIRECT_URI',
                    scope: 'openid email profile',
                    responseType: 'code'
                }
            };

            const config = oauthConfig[provider];
            const authUrl = provider === 'google' 
                ? `https://accounts.google.com/oauth2/auth?client_id=${config.clientId}&redirect_uri=${config.redirectUri}&scope=${config.scope}&response_type=${config.responseType}`
                : `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${config.clientId}&redirect_uri=${config.redirectUri}&scope=${config.scope}&response_type=${config.responseType}`;

            // open the OAuth URL in the browser
            const supported = await Linking.canOpenURL(authUrl);
            if (supported) {
                await Linking.openURL(authUrl);
            } else {
                throw new Error(`Cannot open ${provider} OAuth URL`);
            }

        } catch (error) {
            console.log(`Error with ${provider} sign-in:`, error);
            setMessage(`${provider} sign-in error: ${error.message}`);
        }
    };

    const handleConfirmCode = async () => {
        try {
            await confirmSignUp({ username: email, confirmationCode: verificationCode });
            setShowVerificationModal(false);
            console.log("Confirmation successful! Please personalize your account.");

            // sign in the user
            await handleSignIn();
        } catch (error) {
            console.log('Error confirming code:', error);
            setMessage(`Error: ${error.message}`);
        }
    };

    return (
        <View style={commonStyles.screen}>
            <Header
                title={isSignUpBool ? "Sign Up" : "Login"}
                showBack={fromAccounts === 'true'}
                onBack={() => router.push("/settings/account/accounts")} // TODO: fix navigation problem, not important right now
            />
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

                    <View>
                        <TextField
                            label="Password"
                            placeholder="Password"
                            value={password}
                            secureTextEntry
                            onChangeText={setPassword}
                        />

                        {!isSignUpBool && (
                            <View style={{ marginTop: 10 }}>
                                <Link href="/forgot-password">
                                    <Text style={{
                                        textDecorationLine: 'underline'
                                    }}>
                                        Forgot Your Password?
                                    </Text>
                                </Link>
                            </View>
                        )}
                    </View>

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
                        label={loading ? 'Loading...' : (isSignUpBool ? 'Sign Up' : 'Login')}
                        onPress={isSignUpBool ? handleSignUp : handleSignIn}
                        disabled={(isLinking && !signedOutForLinking) || loading}
                    />
                </View>

                <Text style={{ fontSize: 20, textAlign: 'center' }}>
                    OR
                </Text>

                <View style={{ gap: 20, marginTop: -10 }}>
                    <GoogleButton
                        imageSource={require('../assets/images/Google.jpg')}
                        label={socialLoading.google ? "Connecting to Google..." : "Continue with Google"}
                        onPress={handleGoogleSignIn}
                        disabled={(isLinking && !signedOutForLinking) || socialLoading.google || socialLoading.microsoft}
                    />

                    <MicrosoftButton
                        imageSource={require('../assets/images/Microsoft.png')}
                        label={socialLoading.microsoft ? "Connecting to Microsoft..." : "Continue with Microsoft"}
                        onPress={handleMicrosoftSignIn}
                        disabled={(isLinking && !signedOutForLinking) || socialLoading.google || socialLoading.microsoft}
                    />
                </View>

                <Divider />

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

                {message && (
                    <Text style={{ 
                        marginTop: 30, 
                        color: message.includes('Error') ? theme.colors.error : theme.colors.primary,
                        textAlign: 'center'
                    }}>
                        {message}
                    </Text>
                )}

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
        </View>
    );
}

export default LoginSignup;