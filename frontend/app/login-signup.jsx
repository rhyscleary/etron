// Author(s): Matthew Parkinson, Holly Wyatt, Rhys Cleary

import { useRouter, Link, useLocalSearchParams } from "expo-router";
import { Text } from 'react-native-paper';
import { useEffect, useState } from "react";
import { View, Linking } from 'react-native';
import TextField from '../components/common/input/TextField';
import BasicButton from '../components/common/buttons/BasicButton';
import { useTheme } from 'react-native-paper';
import GoogleButton from '../components/common/buttons/GoogleButton';
import MicrosoftButton from '../components/common/buttons/MicrosoftButton';
import Divider from "../components/layout/Divider";
import { commonStyles } from "../assets/styles/stylesheets/common";

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
import { saveUserInfo } from "../storage/userStorage";
import VerificationDialog from "../components/overlays/VerificationDialog";

//Amplify.configure(awsmobile);

function LoginSignup() {
    const { email: emailParam, isSignUp, link } = useLocalSearchParams();
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
    const [resendCooldown, setResendCooldown] = useState(0);
    const [verificationError, setVerificationError] = useState('');

    const router = useRouter();
    const theme = useTheme();

    useEffect(() => {
        let interval;
        if (resendCooldown > 0) {
            interval = setInterval(() => {
                setResendCooldown(current => current - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendCooldown]);

    useEffect(() => {
        if (showVerificationModal && email && resendCooldown === 0 && verificationError) {
            handleResend();
        }
    }, [showVerificationModal]);

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

                                    if (!workspace || !workspace.workspaceId) {
                                        // clear attribute and redirect to choose workspace
                                        await setHasWorkspaceAttribute(false);
                                        router.dismissAll();
                                        router.replace("(auth)/workspace-choice");
                                        return;
                                    }

                                    // save locally and go to profile screen
                                    await saveWorkspaceInfo(workspace);
                                    router.dismissAll();
                                    router.replace("(auth)/profile");
                                } catch (error) {
                                    console.error("Error fetching workspace:", error);
                                    setMessage("Unable to locate workspace. Please try again."); 
                                }
                            }

                            router.dismissAll();
                            router.replace("(auth)/profile");

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
                    console.log("User is already signed in. Signing out before continuing..");
                    await signOut();
                }
            } catch (error) {
                console.error("Error retrieving signed in user:", error);
            }

            const { isSignedIn, nextStep } = await signIn({ username: email, password });
            
            // check if not fully signed up
            if (!isSignedIn && nextStep.signInStep === "CONFIRM_SIGN_UP") {
                setShowVerificationModal(true);
                setResendCooldown(60);
                return;
            }

            if (isSignedIn) {
                const user = await getCurrentUser();
                const userAttributes = await fetchUserAttributes();
                
                const hasGivenName = userAttributes["given_name"];
                const hasFamilyName = userAttributes["family_name"];
                let hasWorkspaceAttribute = userAttributes["custom:has_workspace"];

                // If the attribute doesn't exist, set it to false
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

                        if (!workspace || !workspace.workspaceId) {
                            // clear attribute and redirect to choose workspace
                            await setHasWorkspaceAttribute(false);
                            router.dismissAll();
                            router.replace("(auth)/workspace-choice");
                            return;
                        }

                        // save locally and go to profile screen
                        await saveWorkspaceInfo(workspace);
                        router.dismissAll();
                        router.replace("(auth)/profile");
                    } catch (error) {
                        console.error("Error fetching workspace:", error);
                        setMessage("Unable to locate workspace. Please try again."); 
                    }
                }
            }
        } catch (error) {
            console.error("Sign in error:", error);
            setMessage(`Error: ${error.message}`);
            await signOut();
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
                        email,
                        'custom:has_workspace': `false`
                    }
                }
            });
            setMessage("Sign up successful! Check your email to confirm.");
            setShowVerificationModal(true);
        } catch (error) {
            console.error('Error signing up:', error);
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

            //await signInWithRedirect({ provider: 'Google' });
            
        } catch (error) {
            console.error('Error with Google sign-in:', error);
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
            console.error('Error with Microsoft sign-in:', error);
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
            console.error(`Error with ${provider} sign-in:`, error);
            setMessage(`${provider} sign-in error: ${error.message}`);
        }
    };

    const handleConfirmCode = async () => {
        setVerificationError('');
        try {
            await confirmSignUp({ username: email, confirmationCode: verificationCode });
            setShowVerificationModal(false);
            console.log("Confirmation successful! Please personalize your account.");

            // sign in the user
            await signIn({ username: email, password });
            router.navigate("(auth)/personalise-account"); // navigate to personalise account after sign up
        } catch (error) {
            console.error('Error confirming code:', error);
            setMessage(`Error: ${error.message}`);
            setVerificationError(error.message);
        }
    };

    return (
        <View style={commonStyles.screen}>
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
                        router.replace({
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

                <VerificationDialog
                    visible={showVerificationModal}
                    code={verificationCode}
                    setCode={setVerificationCode}
                    onConfirm={handleConfirmCode}
                    onResend={handleResend}
                    resendCooldown={resendCooldown}
                    onLater={() => setShowVerificationModal(false)}
                    error={verificationError}
                />
                
            </View>
        </View>
    );
}

export default LoginSignup;