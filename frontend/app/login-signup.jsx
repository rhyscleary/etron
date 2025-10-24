// Author(s): Matthew Parkinson, Holly Wyatt, Rhys Cleary

import { useRouter, Link, useLocalSearchParams } from "expo-router";
import { Text, Snackbar, Portal, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { View, Linking, Modal, TextInput, Keyboard, StyleSheet, Pressable } from 'react-native';
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
import { useApp } from "../contexts/AppContext";
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
import Header from "../components/layout/Header";

import { apiGet } from "../utils/api/apiClient";
import endpoints from "../utils/api/endpoints";
import { saveWorkspaceInfo } from "../storage/workspaceStorage";
import VerificationDialog from "../components/overlays/VerificationDialog";

//Amplify.configure(awsmobile);

function LoginSignup() {
    const { emailParam, isSignUp, link, fromAccounts } = useLocalSearchParams();
    const isSignUpBool = isSignUp == 'true';
    const isLinking = link === 'true';
    const fromAccountsBool = fromAccounts === 'true';

    const [email, setEmail] = useState(emailParam || "");
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [snack, setSnack] = useState({ visible: false, text: '' , tone: 'error'});  //tone: 'error' | 'info'
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState({ google: false, microsoft: false });
    const [signedOutForLinking, setSignedOutForLinking] = useState(!isLinking);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [loadingNextPage, setLoadingNextPage] = useState(false);

    const router = useRouter();
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    const { user, actions } = useApp();

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
                if (params) router.push({ pathname: path, params });
                else router.push(path);
            },
            onAuthSuccess: async (provider) => {
                await actions.login(provider);
            }
        });
    }, [router, actions.login]);

    useEffect(() => {
        if (!showVerificationModal || resendCooldown <= 0) return;
        const t = setTimeout(() => setResendCooldown((c) => Math.max(c - 1, 0)), 1000);
        return () => clearTimeout(t);
    }, [showVerificationModal, resendCooldown]);

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
        const handleDeepLink = async (objectUrl) => {
            console.log('Deep link received:', objectUrl);

            let url = objectUrl.url || objectUrl;
            if (!url) return;
            
            // check if the URL is a valid social sign-in callback
            if (url && (url.includes('myapp://callback'))) {
                try {
                    // wait to ensure the sign-in process completes
                    setTimeout(async () => {
                        try {
                            const user = await getCurrentUser();
                            console.log('Social sign-in successful:', user);
                            // navigate to profile page (or consider back to accounts page again)

                            const userAttributes = await fetchUserAttributes();
                            const hasGivenName = userAttributes["given_name"];
                            const hasFamilyName = userAttributes["family_name"];
                            let hasWorkspaceAttribute = userAttributes["custom:has_workspace"];

                            // if the attribute doesn't exist set it to false
                            if (hasWorkspaceAttribute == null) {
                                await setHasWorkspaceAttribute(false);
                                hasWorkspaceAttribute = "false";
                            }

                            const hasWorkspace = hasWorkspaceAttribute === "true";

                            if (!hasWorkspace) {
                                if (!hasGivenName || !hasFamilyName) {
                                    router.dismissAll();
                                    router.replace("(auth)/personalise-account");
                                    return;
                                } else {
                                    router.dismissAll();
                                    router.replace("(auth)/workspace-choice");
                                    return;
                                }
                            } else {
                                // fetch the workspace
                                try {
                                    const workspace = await apiGet(
                                        endpoints.workspace.core.getByUserId(user.userId)
                                    );

                                    if (!workspace.data || !workspace.data.workspaceId) {
                                        // clear attribute and redirect to choose workspace
                                        await setHasWorkspaceAttribute(false);
                                        router.dismissAll();
                                        router.replace("(auth)/workspace-choice");
                                        return;
                                    }

                                    // save locally and go to profile screen
                                    await saveWorkspaceInfo(workspace.data);
                                    router.dismissAll();
                                    router.replace("(auth)/authenticated-loading");
                                } catch (error) {
                                    console.error("Error fetching workspace:", error);
                                    setMessage("Unable to locate workspace. Please try again."); 
                                }
                            }

                            router.dismissAll();
                            router.replace("(auth)/authenticated-loading");

                        } catch (error) {
                            console.error('No authenticated user found after social sign-in');
                            setMessage("Social sign-in was cancelled or failed");
                        }
                    }, 1000);
                } catch (error) {
                    console.error('Error handling social sign-in callback:', error);
                    setMessage("Error completing social sign-in");
                    await signOut();
                }
            }

            // check if the URL is a valid social sign-out
            if (url && (url.includes('myapp://signout/'))) {
                router.dismissAll();
                try {
                    // navigate to landing with signout()
                    await signOut();
                    setMessage("Signed out successfully!");

                } catch (error) {
                    console.error('Error handling social sign-out:', error);
                    setMessage("Social sign-out was cancelled or failed");
                }
            }
        };

        // listen for deep links
        const subscription = Linking.addEventListener('url', handleDeepLink);

        // check if the app was opened with a deep link
        Linking.getInitialURL().then(handleDeepLink);

        return () => subscription?.remove();
    }, []);

    const showSnack = (text, tone = 'error') => {
        setSnack({ visible: true, text, tone});
    }

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
        try {
            try {
                const currentUser = await getCurrentUser();
                if (currentUser) {
                    console.log("User is already signed in. Signing out before continuing...");
                    await signOut();
                }
            } catch (error) {  // If the user isn't authenticated, then this is expected behaviour.
                if (!error.message.includes("User needs to be authenticated to call this API")) console.error("Error retrieving signed in user:", error);
            }

            const { isSignedIn, nextStep } = await signIn({ username: email, password });
            
            // Check if email confirmation still required
            if (!isSignedIn && nextStep.signInStep === "CONFIRM_SIGN_UP") {
                setShowVerificationModal(true);
                if (resendCooldown === 0) {
                    handleResend();
                    setResendCooldown(60);
                }
                return;
            }

            router.replace("(auth)/authenticated-loading");
            return;

            if (isSignedIn) {
                const user = await getCurrentUser();
                const userAttributes = await fetchUserAttributes();
                
                const hasGivenName = userAttributes["given_name"];
                const hasFamilyName = userAttributes["family_name"];
                const hasWorkspace = userAttributes["custom:has_workspace"] == 'true';

                if (!hasWorkspace) {
                    if (!hasGivenName || !hasFamilyName) {
                        router.dismissAll();
                        router.replace("(auth)/personalise-account");
                        return;
                    } else {
                        router.dismissAll();
                        router.replace("(auth)/workspace-choice");
                        return;
                    }
                } else {
                    try {
                        const workspace = await apiGet(endpoints.workspace.core.getByUserId(user.userId));

                        if (!workspace.data || !workspace.data.workspaceId) {
                            await setHasWorkspaceAttribute(false);
                            router.dismissAll();
                            router.replace("(auth)/workspace-choice");
                            return;
                        }

                        await saveWorkspaceInfo(workspace.data);
                        router.dismissAll();
                        router.replace("(auth)/authenticated-loading");
                    } catch (error) {
                        if (error.message.includes("No user found")) {
                            await setHasWorkspaceAttribute(false);
                            router.dismissAll();
                            router.replace("(auth)/workspace-choice");
                        } else {
                            console.error("Error fetching workspace:", error);
                            setMessage("Unable to locate workspace. Please try again.");
                        }
                    }
                }
            }
        } catch (error) {
            if (error.message.includes("Incorrect username or password")) {
                showSnack("Incorrect email or password", 'error');
                await signOut();
            } else if (error.message.includes("Password attempts exceeded")) {
                showSnack("Password attempt limit reached, please try again later.", 'error');
            } else {
                console.error("Sign in error:", error);
                showSnack("Sign in failed. Please try again.", 'error');
                await signOut();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async () => {
        setLoading(true);
        setMessage('');
        
        const result = await accountService.signUpWithEmail(email, password, confirmPassword);

        if (result.success) {
            setShowVerificationModal(true);
        } else {
            showSnack(result.error, "error");
        }
        setLoading(false);
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
        setLoading(true);
        setMessage('');
        const result = await accountService.completeSignUp(email, password, verificationCode);
        
        if (result.success) {
            setShowVerificationModal(false);
            
            if (isLinking) {
                // If we're linking, navigate back to accounts after successful signup
                setTimeout(() => {
                    router.push('/(auth)/(drawer)/settings/account/accounts');
                }, 1000);
            }
        }
        setLoading(false);
    };

    const handleToggleSignUp = () => {
        const params = { isSignUp: (!isSignUpBool).toString() };
        
        // Preserve linking and fromAccounts params + email
        if (isLinking) params.link = 'true';
        if (fromAccountsBool) params.fromAccounts = 'true';
        params.emailParam = email;
        
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
        <ResponsiveScreen
            loadingOverlayActive={loading}
        >
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

            <View style={{alignItems: 'flex-end' }}>
                <BasicButton
                    label={loading ? 'Loading...' : (isSignUpBool ? 'Sign Up' : 'Login')}
                    onPress={() => {
                        Keyboard.dismiss();
                        isSignUpBool ? handleSignUp() : handleSignIn()
                    }}
                    disabled={(isLinking && !signedOutForLinking) || loading || !email.trim() || !password || password.length < 8 || (isSignUpBool && !confirmPassword)}
                />
            </View>

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
                                placeholderTextColor={"#DDDDDD"}
                                value={verificationCode}
                                onChangeText={setVerificationCode}
                                keyboardType="numeric"
                                style={{ 
                                    borderWidth: 1, 
                                    padding: 10, 
                                    marginBottom: 20,
                                    borderColor: theme.colors.outline,
                                    borderRadius: 5,
                                    minWidth: 200,
                                    color: "#FFFFFF"
                                }}
                            />

                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                width: '100%',
                                marginBottom: 20,
                                gap: 10
                            }}>
                                <BasicButton
                                    label="Cancel"
                                    danger="true"
                                    onPress={() => setShowVerificationModal(false)}
                                    style={{ marginRight: 10 }}
                                />

                                <BasicButton
                                    label="Confirm"
                                    onPress={handleConfirmCode}
                                    style={{ marginLeft: 10 }}
                                />
                            </View>
                            <Pressable onPress={handleResend} disabled={resendCooldown > 0}>
                                <Text
                                    style={{
                                        color: resendCooldown > 0 ? theme.colors.onSurfaceVariant : theme.colors.primary,
                                        opacity: resendCooldown > 0 ? 0.5 : 1,
                                    }}
                                >
                                    {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Code'}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </Modal>
            </View>
            <Portal>
                <Snackbar
                    visible={snack.visible}
                    onDismiss={() => setSnack(s => ({ ...s, visible: false }))}
                    wrapperStyle={{
                        bottom: (insets.bottom ?? 0) + 12, //keeps it above home indicator
                        alignItems: 'center',
                        justifyContent: 'center',
                        
                    }}
                    style={{
                        alignSelf: 'center',
                        borderRadius: 12,
                        width: "90%",
                        maxWidth: 600,
                        backgroundColor:
                            snack.tone === 'error'
                                ? theme.colors.errorContainer
                                : theme.colors.inverseSurface,
                    }}
                    theme={{
                        colors: {
                            onSurface:
                                snack.tone === 'error'
                                ? theme.colors.onErrorContainer
                                : theme.colors.inverseOnSurface,
                        },
                    }}
                    action={{
                        label: 'Dismiss',
                        onPress: () => setSnack(s => ({ ...s, visible: false })),
                    }}
                >
                    <Text
                        style={{
                        fontWeight: '600',
                        marginBottom: 2,
                        color:
                            snack.tone === 'error'
                            ? theme.colors.onErrorContainer
                            : theme.colors.inverseOnSurface,
                        }}
                    >
                        {snack.tone === 'error' ? (isSignUpBool ? 'Sign-up error' : 'Sign-in error') : 'Notice'}
                    </Text>
                    <Text
                        style={{
                        color:
                            snack.tone === 'error'
                            ? theme.colors.onErrorContainer
                            : theme.colors.inverseOnSurface,
                        }}
                    >
                        {snack.text}
                    </Text>
                </Snackbar>
            </Portal>
            <Portal>
                { loading && (
                    <View style={styles.loadingOverlay} pointerEvents="auto">
                        <ActivityIndicator size="large" />
                    </View>
                )}
            </Portal>
        </ResponsiveScreen>
    );
}

export default LoginSignup;

const styles = StyleSheet.create({
    loadingOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});