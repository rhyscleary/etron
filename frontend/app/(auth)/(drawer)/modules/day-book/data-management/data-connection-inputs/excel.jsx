import { View, Alert } from "react-native";
import Header from "../../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../../assets/styles/stylesheets/common";
import { ScrollView } from "react-native";
import StackLayout from "../../../../../../../components/layout/StackLayout";
import { useTheme, Text, Searchbar, Surface } from "react-native-paper";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import MicrosoftButton from "../../../../../../../components/common/buttons/MicrosoftButton";
import BasicButton from "../../../../../../../components/common/buttons/BasicButton";
import DataButton from "../../../../../../../components/common/buttons/dataButton";
import Divider from "../../../../../../../components/layout/Divider";
import { apiPost } from "../../../../../../../utils/api/apiClient"; 
import endpoints from "../../../../../../../utils/api/endpoints";
import AccountCard from "../../../../../../../components/cards/accountCard";
import IconButton from "../../../../../../../components/common/buttons/IconButton";
import FilterBar from "../../../../../../../components/layout/FilterBar";
import SeachFilterCard from "../../../../../../../components/cards/searchFilterCard";

import { 
    signInWithRedirect, 
    getCurrentUser, 
    fetchAuthSession,
    signOut
} from "aws-amplify/auth";

const Excel = () => {
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
            
            // check if the user has a Microsoft connection
            await checkMicrosoftConnection();
            
        } catch (error) {
            console.log('No authenticated user or Microsoft connection:', error);
            setCognitoUser(null);
            setIsConnected(false);
        }
    };

    const checkMicrosoftConnection = async () => {
        try {
            // get the current session and check for Microsoft access token
            const session = await fetchAuthSession();
            const tokens = session.tokens;
            
            // TODO: backend - check if user has Microsoft access token stored
            /*
            const response = await apiPost(endpoints.connections.microsoft.status(tokens))
            const data = await response.json();
            */
            
            // TODO: remove when backend is ready
            // fake implementation - check if user signed in with Microsoft
            if (tokens?.idToken?.payload?.identities) {
                const identities = tokens.idToken.payload.identities;
                const microsoftIdentity = identities.find(identity => 
                    identity.providerName === 'LoginWithAmazon' || 
                    identity.providerName === 'Microsoft'
                );
                
                if (microsoftIdentity) {
                    // user has Microsoft connection but no Microsoft Graph API access token
                    setConnectedAccount({
                        email: tokens.idToken.payload.email,
                        name: tokens.idToken.payload.name || tokens.idToken.payload.email,
                        avatar: tokens.idToken.payload.picture,
                        provider: 'Microsoft'
                    });
                    // TODO: uncomment when backend is ready
                    // setIsConnected(true);
                }
            }
            
            // TODO: remove when backend is ready - mock connected state for testing
            setConnectedAccount({
                email: "fakeuser@outlook.com",
                name: "Fake Microsoft User",
                avatar: null,
                accessToken: "FAKE_MICROSOFT_ACCESS_TOKEN"
            });
            setIsConnected(true);
            
        } catch (error) {
            console.error('Error checking Microsoft connection:', error);
            setIsConnected(false);
        }
    };

    const handleConnectMicrosoft = async () => {
        setLoading(true);
        try {
            // use amplify to sign in with Microsoft (configure provider name in Cognito)
            await signInWithRedirect({ 
                provider: 'LoginWithAmazon', // TODO: change when backend is set up
                customState: JSON.stringify({ 
                    action: 'connect_excel',
                    returnUrl: '/modules/day-book/data-management/create-data-connection/excel'
                })
            });
            
        } catch (error) {
            console.error('Error connecting to Microsoft:', error);
            Alert.alert("Error", "Failed to connect to Microsoft. Please try again.");
            setLoading(false);
        }
    };

    const handleAmplifyMicrosoftAuth = async () => {
        setLoading(true);
        try {
            // TODO: backend implement:
            // Exchange Cognito identity token for Microsoft Graph access token
            // Store Microsoft refresh token for future use
            // Return Microsoft access token for immediate use
            
            const session = await fetchAuthSession();
            const cognitoToken = session.tokens?.accessToken?.toString();

            // TODO: uncomment when backend is ready
            /*
            const response = await apiPost(endpoints.connections.microsoft.connect, {
                cognitoToken: cognitoToken,
                scopes: [
                    'https://graph.microsoft.com/Files.Read',
                    'https://graph.microsoft.com/Sites.Read.All',
                    'https://graph.microsoft.com/User.Read'
                ]
            });
            const data = await response.json();
            */
            
            // TODO: remove when backend is ready
            Alert.alert(
                "Microsoft Connection",
                "This would connect your Microsoft account for Excel access via AWS Amplify.",
                [
                    {
                        text: "Cancel",
                        style: "cancel"
                    },
                    {
                        text: "Continue",
                        onPress: () => {
                            setConnectedAccount({
                                email: cognitoUser?.signInDetails?.loginId || "user@outlook.com",
                                name: "John Doe",
                                avatar: null,
                                accessToken: "fake_microsoft_access_token"
                            });
                            setIsConnected(true);
                        }
                    }
                ]
            );
            
        } catch (error) {
            console.error('Error with Amplify Microsoft auth:', error);
            Alert.alert("Error", "Failed to authenticate with Microsoft. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSwitchAccount = async () => {
        Alert.alert(
            "Switch Microsoft Account",
            "This will sign you out and allow you to sign in with a different Microsoft account.",
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
            const response = await apiPost(endpoints.connections.microsoft.spreadsheets(cognitoToken));
            const data = await response.json();
            setSpreadsheets(data.spreadsheets);
            */
            
            // TODO: remove when backend is ready - mock Excel files
            const fakeExcelFiles = [
                {
                    id: "01ABCDEF123456789",
                    name: "Financial Report 2024.xlsx",
                    lastModified: "2024-01-20T15:45:00Z",
                    url: "https://graph.microsoft.com/v1.0/me/drive/items/01ABCDEF123456789",
                    size: "2.5 MB",
                    location: "OneDrive"
                },
                {
                    id: "01BCDEFG234567890",
                    name: "Inventory Tracking.xlsx",
                    lastModified: "2024-01-18T11:30:00Z",
                    url: "https://graph.microsoft.com/v1.0/me/drive/items/01BCDEFG234567890",
                    size: "1.8 MB",
                    location: "OneDrive"
                },
                {
                    id: "01CDEFGH345678901",
                    name: "Sales Dashboard Q1.xlsx",
                    lastModified: "2024-01-16T09:22:00Z",
                    url: "https://graph.microsoft.com/v1.0/me/drive/items/01CDEFGH345678901",
                    size: "3.2 MB",
                    location: "SharePoint"
                },
                {
                    id: "01DEFGHI456789012",
                    name: "Team Collaboration Data.xlsx",
                    lastModified: "2024-01-15T14:12:00Z",
                    url: "https://graph.microsoft.com/v1.0/me/drive/items/01DEFGHI456789012",
                    size: "4.1 MB",
                    location: "SharePoint"
                },
                {
                    id: "01EFGHIJ567890123",
                    name: "Personal Budget 2024.xlsx",
                    lastModified: "2024-01-14T08:30:00Z",
                    url: "https://graph.microsoft.com/v1.0/me/drive/items/01EFGHIJ567890123",
                    size: "892 KB",
                    location: "OneDrive"
                },
                {
                    id: "01FGHIJK678901234",
                    name: "Project Timeline.xlsx",
                    lastModified: "2024-01-12T16:45:00Z",
                    url: "https://graph.microsoft.com/v1.0/me/drive/items/01FGHIJK678901234",
                    size: "1.2 MB",
                    location: "SharePoint"
                }
            ];
            
            setTimeout(() => {
                setSpreadsheets(fakeExcelFiles);
                setSelectedSpreadsheet(null);
                setSpreadsheetsLoading(false);
            }, 1000);
            
        } catch (error) {
            console.error('Error fetching Excel files:', error);
            Alert.alert("Error", "Failed to fetch Excel files. Please try again.");
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

    const oneDriveCount = spreadsheets.filter(sheet => sheet.location === "OneDrive").length;
    const sharePointCount = spreadsheets.filter(sheet => sheet.location === "SharePoint").length;

    const filterOptions = [
        { label: "All", count: spreadsheets.length, value: "All" },
        { label: "OneDrive", count: oneDriveCount, value: "OneDrive" },
        { label: "SharePoint", count: sharePointCount, value: "SharePoint" }
    ];

    const [locationFilter, setLocationFilter] = useState(filterOptions[0]);

    const filteredSpreadsheets = spreadsheets.filter(sheet => {
        const matchesSearch = sheet.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLocation = locationFilter.value === "All" || sheet.location === locationFilter.value;
        return matchesSearch && matchesLocation;
    });
    
    const handleFilterChange = (filterValue) => {
        setLocationFilter(filterValue);
    };

    return (
        <View style={commonStyles.screen}>
            <Header title="Excel" showBack />
            <ScrollView contentContainerStyle={commonStyles} style={{marginBottom: 80}}>
                <StackLayout spacing={20}>
                    
                    {/* user status */}
                    {!cognitoUser && (
                        <StackLayout spacing={15}>
                            <Text style={[commonStyles.titleText, { textAlign: 'center' }]}>
                                Authentication Required
                            </Text>
                            <Text style={{ textAlign: 'center' }}>
                                Please sign in to connect your Microsoft account
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
                                Connect Microsoft Excel
                            </Text>
                            <Text style={{ textAlign: 'center' }}>
                                Connect your Microsoft account to access your Excel files
                            </Text>
                            <MicrosoftButton
                                imageSource={require('../../../../../../../assets/images/Microsoft.png')}
                                label={loading ? "Connecting..." : "Connect with Microsoft"}
                                onPress={handleAmplifyMicrosoftAuth}
                                disabled={loading}
                            />
                        </StackLayout>
                    )}

                    {cognitoUser && isConnected && (
                        <AccountCard 
                            name={connectedAccount?.name}
                            email={connectedAccount?.email}
                            loading={loading}
                            onPress={() => handleSwitchAccount()}
                        />
                    )}

                    {/* Excel files list */}
                    {cognitoUser && isConnected && (
                        <StackLayout spacing={20} >
                            <Divider color={theme.colors.divider} />
                            <StackLayout spacing={8}> 
                                <SeachFilterCard mode={"elevated"}  
                                child={
                                    <StackLayout spacing={8} style={{ flex: 1, alignSelf: 'stretch' }}>
                                        <Searchbar 
                                            placeholder="Search Excel files"
                                            onChangeText={setSearchQuery}
                                            value={searchQuery}
                                            placeholderTextColor={theme.colors.divider}
                                            iconColor={theme.colors.themeGrey}
                                            style={[commonStyles.searchBar, {
                                                backgroundColor: theme.colors.buttonBackground,
                                                alignSelf: 'stretch',
                                            }]}
                                        />

                                        {spreadsheets.length > 0 && (
                                            <FilterBar
                                                filters={filterOptions}
                                                activeFilter={locationFilter}
                                                onFilterChange={handleFilterChange}
                                            />
                                        )}
                                    </StackLayout>
                                } />
                                
                                
                                {locationFilter && filteredSpreadsheets.length > 0 && (
                                    <Text style={[commonStyles.captionText, {color: theme.colors.themeGrey, fontWeight: 'light'}]}>
                                        {`Found (${filteredSpreadsheets.length}) files:`}
                                    </Text>
                                )}

                            </StackLayout>
                            
                            <StackLayout spacing={15}>
                                {spreadsheetsLoading ? (
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <Text>Loading Excel files...</Text>
                                    </View>
                                ) : spreadsheets.length === 0 ? (
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <Text>
                                            No Excel files found in your OneDrive or SharePoint
                                        </Text>
                                    </View>
                                ) : (
                                    <StackLayout spacing={2}>
                                        {filteredSpreadsheets.map((spreadsheet) => (
                                            <DataButton
                                                key={spreadsheet.id}
                                                label={spreadsheet.name}
                                                description={`${spreadsheet.location} • ${spreadsheet.size} • Last modified: ${formatDate(spreadsheet.lastModified)}`}
                                                icon="microsoft-excel"
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
                                            label={spreadsheetsLoading ? "Loading..." : "Refresh List"}
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
                            type: "microsoft-excel",
                            spreadsheetId: selectedSpreadsheet?.id,
                            name: selectedSpreadsheet?.name,
                            url: selectedSpreadsheet?.url,
                            location: selectedSpreadsheet?.location,
                            size: selectedSpreadsheet?.size
                        },
                    })}
                    fullWidth={false}
                />
            </View>
        </View>
    );
};

export default Excel;