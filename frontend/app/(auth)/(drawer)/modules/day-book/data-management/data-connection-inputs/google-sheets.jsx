import { View, Alert } from "react-native";
import Header from "../../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../../assets/styles/stylesheets/common";
import { ScrollView } from "react-native";
import StackLayout from "../../../../../../../components/layout/StackLayout";
import { useTheme, Text, Searchbar } from "react-native-paper";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import GoogleButton from "../../../../../../../components/common/buttons/GoogleButton";
import BasicButton from "../../../../../../../components/common/buttons/BasicButton";
import DataButton from "../../../../../../../components/common/buttons/dataButton";
import Divider from "../../../../../../../components/layout/Divider";
import { apiPost } from "../../../../../../../utils/api/apiClient"; 
import endpoints from "../../../../../../../utils/api/endpoints";
import AccountCard from "../../../../../../../components/cards/accountCard";
import IconButton from "../../../../../../../components/common/buttons/IconButton";

import { 
    signInWithRedirect, 
    getCurrentUser, 
    fetchAuthSession,
    signOut
} from "aws-amplify/auth";


const GoogleSheets = () => {
    const theme = useTheme();

    const [isConnected, setIsConnected] = useState(false);
    const [connectedAccount, setConnectedAccount] = useState(null);
    const [spreadsheets, setSpreadsheets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [spreadsheetsLoading, setSpreadsheetsLoading] = useState(false);
    const [cognitoUser, setCognitoUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSpreadsheet, setSelectedSpreadsheet] = useState(null);
    
    useEffect(() => {
        checkAuthStatus();
    }, []);

    useEffect(() => {
        if (isConnected && connectedAccount?.accessToken) {
            fetchSpreadsheets();
        }
    }, [isConnected, connectedAccount]);

    const checkAuthStatus = async () => {
        try {
            // check if the user is authenticated
            const user = await getCurrentUser();
            setCognitoUser(user);
            
            // check if the user has a Google connection
            await checkGoogleConnection();
            
        } catch (error) {
            console.log('No authenticated user or Google connection:', error);
            setCognitoUser(null);
            setIsConnected(false);
        }
    };

    const checkGoogleConnection = async () => {
        try {
            // get the current session and check for google access token
            const session = await fetchAuthSession();
            const tokens = session.tokens;
            
            // TODO: backend - check if user has Google access token stored
            /*
            const response = await apiPost(endpoints.connections.google.status(tokens))
            const data = await response.json();
            */
            
            // TODO: remove when backend is ready
            // fake implementation - check if user signed in with Google
            if (tokens?.idToken?.payload?.identities) {
                const identities = tokens.idToken.payload.identities;
                const googleIdentity = identities.find(identity => 
                    identity.providerName === 'Google'
                );
                
                if (googleIdentity) {
                    // user has Google connection but no google api access token
                    setConnectedAccount({
                        email: tokens.idToken.payload.email,
                        name: tokens.idToken.payload.name || tokens.idToken.payload.email,
                        avatar: tokens.idToken.payload.picture,
                        provider: 'Google'
                    });
                    // TODO: uncomment when backend is ready
                    // setIsConnected(true);
                }
            }
            
            
            // TODO: remove when backend is ready
            setConnectedAccount({
                email: "fakeuser@gmail.com",
                name: "Fake User",
                avatar: null,
                accessToken: "FAKE_ACCESS_TOKEN"
            });
            setIsConnected(true);
            
        } catch (error) {
            console.error('Error checking Google connection:', error);
            setIsConnected(false);
        }
    };

    const handleConnectGoogle = async () => {
        setLoading(true);
        try {
            // use amplify to sign in with Google
            await signInWithRedirect({ 
                provider: 'Google',
                customState: JSON.stringify({ 
                    action: 'connect_sheets',
                    returnUrl: '/modules/day-book/data-management/create-data-connection/google-sheets'
                })
            });
            
        } catch (error) {
            console.error('Error connecting to Google:', error);
            Alert.alert("Error", "Failed to connect to Google. Please try again.");
            setLoading(false);
        }
    };

    const handleAmplifyGoogleAuth = async () => {
        setLoading(true);
        try {
            // TODO: backend implement:
            // Exchange Cognito identity token for Google access token
            // Store Google refresh token for future use
            // Return Google access token for immediate use
            
            const session = await fetchAuthSession();
            const cognitoToken = session.tokens?.accessToken?.toString();

            // TODO: uncomment when backend is ready
            /*
            const response = await apiPost(endpoints.connections.google.status(cognitoToken));
            const data = await response.json();
            */
            
            // TODO: redevelop when backend is ready
            Alert.alert(
                "Google Connection",
                "This would connect your Google account for Sheets access via AWS Amplify.",
                [
                    {
                        text: "Cancel",
                        style: "cancel"
                    },
                    {
                        text: "Continue",
                        onPress: () => {
                            setConnectedAccount({
                                email: cognitoUser?.signInDetails?.loginId || "user@gmail.com",
                                name: "John Doe",
                                avatar: null,
                                accessToken: "fake_google_access_token"
                            });
                            setIsConnected(true);
                        }
                    }
                ]
            );
            
        } catch (error) {
            console.error('Error with Amplify Google auth:', error);
            Alert.alert("Error", "Failed to authenticate with Google. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSwitchAccount = async () => {
        Alert.alert(
            "Switch Google Account",
            "This will sign you out and allow you to sign in with a different Google account.",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Switch",
                    onPress: async () => {
                        try {
                            // sign out from Cognito
                            await signOut();
                            
                            // clear local state
                            setIsConnected(false);
                            setConnectedAccount(null);
                            setSpreadsheets([]);
                            setSelectedSpreadsheet(null);
                            setCognitoUser(null);
                            
                            // navigate to login/signup page
                            router.push('/login-signup');
                            
                        } catch (error) {
                            console.error('Error switching account:', error);
                            Alert.alert("Error", "Failed to switch account. Please try again.");
                        }
                    }
                }
            ]
        );
    };

    const fetchSpreadsheets = async () => {
        setSpreadsheetsLoading(true);
        try {

            const session = await fetchAuthSession();
            const cognitoToken = session.tokens?.accessToken?.toString();
            
            // TODO: uncomment when backend is ready
            /*
            const response = await apiPost(endpoints.connections.google.status(cognitoToken));
            const data = await response.json();
            const data = await response.json();
            setSpreadsheets(data.spreadsheets);
            */
            
            // TODO: uncomment when backend is ready
            const fakeSpreadsheets = [
                {
                    id: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
                    name: "Budget 2024",
                    lastModified: "2024-01-15T10:30:00Z",
                    url: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                },
                {
                    id: "2CyjOWt1YSB6oGNeL...",
                    name: "Sales Data Q1",
                    lastModified: "2024-01-10T14:22:00Z",
                    url: "https://docs.google.com/spreadsheets/d/2CyjOWt1YSB6oGNeL..."
                }
            ];
            
            setTimeout(() => {
                setSpreadsheets(fakeSpreadsheets);
                setSelectedSpreadsheet(null);
                setSpreadsheetsLoading(false);
            }, 1000);
            
        } catch (error) {
            console.error('Error fetching spreadsheets:', error);
            Alert.alert("Error", "Failed to fetch spreadsheets. Please try again.");
            setSpreadsheetsLoading(false);
        }
    };

    function handleSpreadsheetSelect(spreadsheet) {  
        if (selectedSpreadsheet?.id === spreadsheet.id) {
            setSelectedSpreadsheet(null);
        } else {
            setSelectedSpreadsheet(spreadsheet);
        }
    };


    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + " " + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    };

    const filteredSpreadsheets = spreadsheets.filter(sheet =>
        sheet.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={commonStyles.screen}>
            <Header title="Google Sheets" showBack />
            <ScrollView contentContainerStyle={commonStyles}>
                <StackLayout spacing={20}>
                    
                    {/* user status */}
                    {!cognitoUser && (
                        <StackLayout spacing={15}>
                            <Text style={[commonStyles.titleText, { textAlign: 'center' }]}>
                                Authentication Required
                            </Text>
                            <Text style={{ textAlign: 'center' }}>
                                Please sign in to connect your Google account
                            </Text>
                            <BasicButton
                                label="Sign In"
                                onPress={() => router.push('/login-signup')}
                            />
                        </StackLayout>
                    )}

                    {/* connection status */}
                    {cognitoUser && !isConnected && (
                        <StackLayout spacing={15}>
                            <Text style={[commonStyles.titleText, { textAlign: 'center' }]}>
                                Connect Google Sheets
                            </Text>
                            <Text style={{ textAlign: 'center', }}>
                                Connect your Google account to access your spreadsheets
                            </Text>
                            <GoogleButton
                                imageSource={require('../../../../../../../assets/images/Google.jpg')}
                                label={loading ? "Connecting..." : "Connect with Google"}
                                onPress={handleAmplifyGoogleAuth}
                                disabled={loading}
                            />
                        </StackLayout>
                    )}

                    {cognitoUser && isConnected && (
                            <AccountCard 
                                name={connectedAccount?.name}
                                email={connectedAccount?.email}
                                loading={loading}
                            />
                    )}

                    {/* spreadsheets list */}
                    {cognitoUser && isConnected && (
                        <StackLayout spacing={20}>
                            <Divider color={theme.colors.divider} />
                            <Searchbar 
                                placeholder="Search"
                                onChangeText={setSearchQuery}
                                value={searchQuery}
                                placeholderTextColor={theme.colors.divider}
                                iconColor={theme.colors.themeGrey}
                                style= {[commonStyles.searchBar, {
                                    backgroundColor: theme.colors.buttonBackground,
                                }]}
                            />
                            
                            <StackLayout spacing={15}>
                                {spreadsheetsLoading ? (
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <Text>Loading spreadsheets...</Text>
                                    </View>
                                ) : spreadsheets.length === 0 ? (
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <Text>
                                            No spreadsheets found in your Google Drive
                                        </Text>
                                    </View>
                                ) : (
                                    <StackLayout spacing={2}>
                                        {filteredSpreadsheets.map((spreadsheet) => (
                                            <DataButton
                                                key={spreadsheet.id}
                                                label={spreadsheet.name}
                                                description={`Last modified: ${formatDate(spreadsheet.lastModified)}`}
                                                icon="google-spreadsheet"
                                                onPress={() => handleSpreadsheetSelect(spreadsheet)}
                                                boldLabel={false}
                                                selected={selectedSpreadsheet === spreadsheet}
                                            />
                                        ))}
                                    </StackLayout>
                                )}
                                {spreadsheets.length > 0 && (
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <IconButton
                                            label={spreadsheetsLoading ?  "Loading..." : "Refresh List"}
                                            onPress={fetchSpreadsheets}
                                            loading={spreadsheetsLoading}
                                            icon={"refresh"}
                                        />
                                    </View>
                                )}
                            </StackLayout>
                        </StackLayout>
                    )}
                </StackLayout>
            </ScrollView>
             
                <View style={commonStyles.floatingButtonContainer}>
                <BasicButton
                    label="Continue"
                    disabled={!selectedSpreadsheet}
                    onPress={() => router.push({
                            pathname: "/modules/day-book/data-management/data-management",
                            params: {
                                type: "google-sheets",
                                spreadsheetId: selected.id,
                                name: selected.name,
                                url: selected.url,
                            },
                        })
                    }
                    fullWidth={false}
                />
                </View>
            
        </View>
    );
};

export default GoogleSheets;