// login and signup page

import { useRouter, Link, useLocalSearchParams } from "expo-router";
import { Text } from 'react-native-paper';
import { useEffect, useState } from "react";
import { View, Linking, Modal, TextInput } from 'react-native';
import TextField from '../components/common/input/TextField';
import BasicButton from '../components/common/buttons/BasicButton';
import { useTheme } from 'react-native-paper';
import GoogleButton from '../components/common/buttons/GoogleButton';
import MicrosoftButton from '../components/common/buttons/MicrosoftButton';
import Divider from "../components/layout/Divider";
import { commonStyles } from "../assets/styles/stylesheets/common";
import ResponsiveScreen from "../components/layout/ResponsiveScreen";
import accountService from '../services/AccountService';
import { Amplify } from 'aws-amplify';
import { 
    signIn, 
    signUp, 
    confirmSignUp, 
    signInWithRedirect, 
    getCurrentUser, 
    signOut,
    updateUserAttributes,
    fetchUserAttributes,
    resendSignUpCode
} from 'aws-amplify/auth';

import { apiGet } from "../utils/api/apiClient";
import endpoints from "../utils/api/endpoints";
import { saveWorkspaceInfo } from "../storage/workspaceStorage";
import VerificationDialog from "../components/overlays/VerificationDialog";

//Amplify.configure(awsmobile);

function LoginSignup() {
    const { email: emailParam, isSignUp, link, fromAccounts } = useLocalSearchParams();
    const isSignUpBool = isSignUp === 'true';
    const isLinking = link === 'true';
    const fromAccountsBool = fromAccounts === 'true';

    const [email, setEmail] = useState(emailParam || "");
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState({ google: false, microsoft: false });
    const [signedOutForLinking, setSignedOutForLinking] = useState(!isLinking);

    const router = useRouter();
    const theme = useTheme();

    // Setup AccountService callbacks
    useEffect(() => {
        accountService.setCallbacks({
            onMessage: (msg, isError) => {
                setMessage(msg);
            },
            onSocialLoadingChange: (loadingState) => {
                setSocialLoading(loadingState);
            },
            onNavigate: (path, params) => {
                if (params) {
                    router.push({ pathname: path, params });
                } else {
                    router.push(path);
                }
            },
            onAuthSuccess: async (provider) => {
                // No longer using context - AccountService handles everything
                console.log(`[LoginSignup] Auth success with ${provider}`);
            }
        });
    }, [router]);

    // Handle sign out for linking
    useEffect(() => {
        if (isLinking && !signedOutForLinking) {
            (async () => {
                const result = await accountService.signOutUser();
                if (result.success) {
                    setSignedOutForLinking(true);
                    console.log("Signed out for linking.");
                    setMessage("Ready to link a new account. Please sign in below.");
                } else {
                    setMessage("Error signing out previous user. Please try again.");
                }
            })();
        }
    }, [isLinking, signedOutForLinking]);

    // Setup deep link handling
    useEffect(() => {
        const subscription = accountService.setupDeepLinkListener();
        return () => subscription?.remove();
    }, []);

    const setHasWorkspaceAttribute = async (value) => {
        try {
            await updateUserAttributes({
                userAttributes: {
                    'custom:has_workspace': value ? 'true' : 'false'
                }
            });
        } catch (error) {
            console.error("Unable to update user attribute has_workspace:", error);
        }
    }

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        try {
            await resendSignUpCode({username: email});
            setResendCooldown(60);
        } catch (error) {
            console.error("Error resending the code", error);
        }
    }

    const handleSignIn = async () => {
        setLoading(true);
        setMessage('');
        
        const result = await accountService.signInWithEmail(email, password);
        
        if (result.success && isLinking) {
            // If we're linking and sign in was successful, navigate back to accounts
            setTimeout(() => {
                router.push('/(auth)/(drawer)/settings/account/accounts');
            }, 1000);
        }
        
        setLoading(false);
    };

    const handleSignUp = async () => {
        setMessage('');
        
        const result = await accountService.signUpWithEmail(email, password, confirmPassword);
        
        if (result.success) {
            setShowVerificationModal(true);
        }
    };

    const handleGoogleSignIn = async () => {
        const result = await accountService.signInWithGoogle(isLinking);
        
        if (result.success && isLinking) {
            setMessage("Google sign-in initiated. You'll be redirected after authentication.");
        }
    };

    const handleMicrosoftSignIn = async () => {
        const result = await accountService.signInWithMicrosoft(isLinking);
        
        if (result.success && isLinking) {
            setMessage("Microsoft sign-in initiated. You'll be redirected after authentication.");
        }
    };

    const handleConfirmCode = async () => {
        const result = await accountService.completeSignUp(email, password, verificationCode);
        
        if (result.success) {
            setShowVerificationModal(false);
            console.log("Confirmation successful! Please personalize your account.");
            
            if (isLinking) {
                // If we're linking, navigate back to accounts after successful signup
                setTimeout(() => {
                    router.push('/(auth)/(drawer)/settings/account/accounts');
                }, 1000);
            }
        }
    };

    const handleToggleSignUp = () => {
        const params = { isSignUp: (!isSignUpBool).toString() };
        
        // Preserve linking and fromAccounts params
        if (isLinking) params.link = 'true';
        if (fromAccountsBool) params.fromAccounts = 'true';
        if (emailParam) params.email = emailParam;
        
        router.push({
            pathname: '/login-signup',
            params,
        });
        setConfirmPassword('');
        setMessage('');
    };

    const getPageTitle = () => {
        if (isLinking) {
            return isSignUpBool ? 'Link New Account' : 'Link Existing Account';
        }
        return isSignUpBool ? 'Welcome' : 'Welcome Back';
    };

    const getButtonLabel = () => {
        if (loading) return 'Loading...';
        if (isLinking) {
            return isSignUpBool ? 'Create & Link Account' : 'Link Account';
        }
        return isSignUpBool ? 'Sign Up' : 'Login';
    };

    return (
        <View style={commonStyles.screen}>
            {(isLinking || fromAccountsBool) && (
                <Header
                    title={isLinking ? "Link Account" : ""}
                    showBack
                    onBack={() => router.push('/(auth)/accounts')}
                />
            )}
            
            <View style={{ padding: 20, gap: 30, flex: 1, justifyContent: 'center' }}>
                <Text style={{ fontSize: 40, textAlign: 'center' }}>
                    {getPageTitle()}
                </Text>

                {isLinking && (
                    <Text style={{ 
                        fontSize: 16, 
                        textAlign: 'center', 
                        color: theme.colors.onSurfaceVariant,
                        marginTop: -20
                    }}>
                        Sign in to an existing account or create a new one to link it to your current account.
                    </Text>
                )}

                <View style={{ gap: 30 }}>
                    <TextField
                        label="Email"
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        disabled={!signedOutForLinking && isLinking}
                    />

                    <View>
                        <TextField
                            label="Password"
                            placeholder="Password"
                            value={password}
                            secureTextEntry
                            onChangeText={setPassword}
                            disabled={!signedOutForLinking && isLinking}
                        />

                    {!isSignUpBool && (
                        <View style={{ marginTop: 10 }}>
                            <Link href="/reset-password">
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
                            disabled={!signedOutForLinking && isLinking}
                        />
                    )}
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                    <BasicButton
                        label={getButtonLabel()}
                        onPress={isSignUpBool ? handleSignUp : handleSignIn}
                        disabled={(!signedOutForLinking && isLinking) || loading}
                    />
                </View>

            {message && (
                <Text style={{
                    color: message.includes('Error') ? theme.colors.error : theme.colors.primary,
                    textAlign: 'center'
                }}>
                    {message}
                </Text>
            )}

            <Text style={{ fontSize: 20, textAlign: 'center' }}>
                OR
            </Text>

                <View style={{ gap: 20, marginTop: -10 }}>
                    <GoogleButton
                        imageSource={require('../assets/images/Google.jpg')}
                        label={socialLoading.google ? "Connecting to Google..." : 
                               isLinking ? "Link with Google" : "Continue with Google"}
                        onPress={handleGoogleSignIn}
                        disabled={(!signedOutForLinking && isLinking) || socialLoading.google || socialLoading.microsoft}
                    />

                    <MicrosoftButton
                        imageSource={require('../assets/images/Microsoft.png')}
                        label={socialLoading.microsoft ? "Connecting to Microsoft..." : 
                               isLinking ? "Link with Microsoft" : "Continue with Microsoft"}
                        onPress={handleMicrosoftSignIn}
                        disabled={(!signedOutForLinking && isLinking) || socialLoading.google || socialLoading.microsoft}
                    />
                </View>

            <Divider />

                <BasicButton
                    label={isSignUpBool ? 'Already have an account? Log In'
                        : "Don't have an account? Sign Up"}
                    onPress={handleToggleSignUp}
                    fullWidth
                    altBackground='true'
                    altText='true'
                    disabled={!signedOutForLinking && isLinking}
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
                                style={{ 
                                    borderWidth: 1, 
                                    padding: 10, 
                                    marginBottom: 20,
                                    borderColor: theme.colors.outline,
                                    borderRadius: 5,
                                    minWidth: 200
                                }}
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
                                    style={{ marginRight: 10 }}
                                />

                                <BasicButton
                                    label="Confirm"
                                    fullWidth='true'
                                    onPress={handleConfirmCode}
                                    style={{ marginLeft: 10 }}
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