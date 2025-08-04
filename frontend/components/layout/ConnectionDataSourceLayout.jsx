import React, { useState, useEffect } from "react";
import { View, Alert } from "react-native";
import { ScrollView } from "react-native";
import { useTheme, Text, Searchbar } from "react-native-paper";
import { router } from "expo-router";

import Header from "./Header";
import { commonStyles } from "../../assets/styles/stylesheets/common";
import DataButton from "../common/buttons/dataButton"
import AccountCard from "../cards/accountCard";
import FilterBar from "../layout/FilterBar";
import StackLayout from "./StackLayout";
import BasicButton from "../../components/common/buttons/BasicButton";
import IconButton from "../../components/common/buttons/IconButton";
import Divider from "./Divider";
import SearchFilterCard from "../cards/searchFilterCard";
import ConnectionDialog from "../../components/overlays/ConnectionDialog";
import useDataSources from "../../hooks/useDataSource";

import { getCurrentUser } from "aws-amplify/auth";
import { createDataAdapter } from "../../adapters/day-book/data-sources";

// Custom hook for adapter management
const useAdapterConnection = (adapterType, dependencies = {}) => {
    const [adapter, setAdapter] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dataSources, setDataSources] = useState([]);
    const [connectionInfo, setConnectionInfo] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        try {
            const newAdapter = createDataAdapter(adapterType, dependencies);
            if (!newAdapter) throw new Error('Failed to create adapter - adapter is null');
            
            setAdapter(newAdapter);
            setConnectionInfo(newAdapter.getConnectionInfo());
        } catch (err) {
            setError(`Failed to create adapter: ${err.message}`);
            console.error('Adapter creation error:', err);
        }
    }, [adapterType]);

    const executeWithAdapter = async (operation, errorMsg) => {
        if (!adapter) {
            setError(errorMsg);
            throw new Error(errorMsg);
        }
        
        setLoading(true);
        setError(null);
        
        try {
            const result = await operation(adapter);
            setConnectionInfo(adapter.getConnectionInfo());
            return result;
        } catch (error) {
            console.error(errorMsg, error);
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const connect = () => executeWithAdapter(
        adapter => adapter.connect(),
        'Connection failed'
    );

    const fetchDataSources = async () => {
        const sources = await executeWithAdapter(
            adapter => adapter.getDataSources(),
            'Failed to fetch data sources'
        );
        setDataSources(sources || []);
        return sources || [];
    };

    const disconnect = async () => {
        if (!adapter) return;
        try {
            await adapter.disconnect();
            setConnectionInfo(null);
            setDataSources([]);
            setError(null);
        } catch (error) {
            console.error('Disconnect error:', error);
            setError(error.message);
            throw error;
        }
    };

    const switchAccount = async () => {
        if (!adapter?.switchAccount) return;
        try {
            const result = await adapter.switchAccount();
            if (result.requiresReauth) {
                setConnectionInfo(null);
                setDataSources([]);
            }
            return result;
        } catch (error) {
            console.error('Switch account error:', error);
            setError(error.message);
            throw error;
        }
    };

    // Utility functions
    const filterDataSources = (query, locationFilter = "All") => 
        adapter?.filterDataSources?.(query, dataSources, locationFilter) || 
        dataSources.filter(item => {
            const matchesSearch = !query || item.name.toLowerCase().includes(query.toLowerCase());
            const matchesLocation = locationFilter === "All" || item.location === locationFilter;
            return matchesSearch && matchesLocation;
        });

    const getFilterOptions = () => 
        adapter?.getFilterOptions?.() || [{ label: "All", count: dataSources.length, value: "All" }];

    const formatDate = (dateString) => {
        if (adapter?.formatDate) return adapter.formatDate(dateString);
        try {
            const date = new Date(dateString);
            return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        } catch (e) {
            return dateString;
        }
    };

    return {
        adapter, loading, dataSources, connectionInfo, error,
        connect, fetchDataSources, disconnect, switchAccount,
        filterDataSources, getFilterOptions, formatDate,
        getData: (sourceId, options) => adapter?.getData(sourceId, options),
        getWorksheets: (sourceId) => adapter?.getWorksheets?.(sourceId) || ["Sheet1"],
        isConnected: () => adapter?.isConnected() || false
    };
};

// Status components
const LoadingView = ({ title, message }) => (
    <View style={commonStyles.screen}>
        <Header title={title} showBack />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>{message}</Text>
        </View>
    </View>
);

const StatusCard = ({ children, backgroundColor, textColor }) => (
    <View style={{ padding: 15, backgroundColor, borderRadius: 8 }}>
        <Text style={{ color: textColor, textAlign: 'center' }}>
            {children}
        </Text>
    </View>
);

const ConnectionDataSourceLayout = ({
    title,
    adapterType,
    adapterDependencies,
    serviceDisplayName,
    getItemDescription,
    getItemIcon,
    showLocationFilter = false,
    searchPlaceholder,
    emptyStateMessage,
    demoModeMessage,
    enablePersistentConnection = false,
    dataSourceName,
    apiClient,
    authService,
    // Navigation configuration
    dataManagementPath = "/modules/day-book/data-management/data-management",
    getNavigationParams, // Optional custom function to generate navigation params
}) => {
    const theme = useTheme();
    const globalDataSources = useDataSources(apiClient, authService);
    const {
        adapter, loading, dataSources, connectionInfo, error,
        connect, fetchDataSources, getWorksheets, disconnect, switchAccount,
        filterDataSources, getFilterOptions, formatDate, isConnected
    } = useAdapterConnection(adapterType, adapterDependencies);

    const [cognitoUser, setCognitoUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedItem, setSelectedItem] = useState(null);
    const [dataLoading, setDataLoading] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    const [locationFilter, setLocationFilter] = useState({ label: "All", count: 0, value: "All" });
    const [isConnecting, setIsConnecting] = useState(false);
    
    // Dialog states
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [connectionDialogData, setConnectionDialogData] = useState(null);

    // Auto-fetch data when connected
    useEffect(() => {
        if (isConnected() && connectionInfo?.account && !dataLoading && dataSources.length === 0) {
            handleFetchDataSources();
        }
    }, [connectionInfo, isConnected()]);

    // Update filter options when data changes
    useEffect(() => {
        if (dataSources.length > 0 && showLocationFilter) {
            setLocationFilter(getFilterOptions()[0]);
        }
    }, [dataSources, showLocationFilter]);

    // Auth check and auto-connect
    useEffect(() => {
        const checkAuthStatus = async () => {
            if (!adapter) return;

            try {
                const user = await getCurrentUser();
                setCognitoUser(user);
                setAuthChecked(true);
                if (user) {
                    try { await connect(); } catch (error) {
                        // Auto-connection failed, will show connect button
                    }
                }
            } catch (error) {
                console.log('No authenticated user, enabling demo mode:', error);
                setCognitoUser(null);
                setAuthChecked(true);
                try {
                    await connect();
                    console.log('Demo connection successful');
                } catch (connectError) {
                    console.error('Even demo connection failed:', connectError);
                }
            }
        };
        checkAuthStatus();
    }, [adapter]);

    // Default navigation params generator
    const getDefaultNavigationParams = (selectedItem, worksheets) => {
        const baseParams = {
            type: adapterType,
            name: selectedItem.name,
            isPersistent: enablePersistentConnection ? 'true' : 'false'
        };

        // Add adapter-specific parameters
        switch (adapterType) {
            case 'google-sheets':
                return {
                    ...baseParams,
                    spreadsheetId: selectedItem.id,
                    url: selectedItem.url,
                    worksheets: JSON.stringify(worksheets || [])
                };
            case 'google-drive':
            case 'dropbox':
            case 'onedrive':
                return {
                    ...baseParams,
                    fileId: selectedItem.id,
                    mimeType: selectedItem.mimeType,
                    size: selectedItem.size?.toString()
                };
            case 'sharepoint':
                return {
                    ...baseParams,
                    siteId: selectedItem.id,
                    siteUrl: selectedItem.url
                };
            default:
                return {
                    ...baseParams,
                    itemId: selectedItem.id
                };
        }
    };

    // Format connection data for dialog display
    const formatConnectionForDialog = (connection, type, account, selectedItem, worksheets) => {
        const baseData = {
            name: connection.name,
            status: connection.status || 'connected',
            createdAt: connection.createdAt || new Date().toISOString(),
            originalConnection: connection
        };

        const formatters = {
            'google-sheets': (conn) => ({
                ...baseData,
                title: "Google Sheets Data Source Selected",
                message: `Successfully selected "${selectedItem.name}" with ${worksheets?.length || 0} worksheet(s).`,
                details: [
                    { label: "Spreadsheet", value: selectedItem.name },
                    { label: "Worksheets", value: `${worksheets?.length || 0} available` },
                    { label: "Connection Type", value: enablePersistentConnection ? "Persistent" : "Session" },
                    { label: "Last Modified", value: new Date(selectedItem.lastModified).toLocaleDateString() }
                ]
            }),

            'google-drive': (conn) => ({
                ...baseData,
                title: "Google Drive File Selected",
                message: `Successfully selected "${selectedItem.name}".`,
                details: [
                    { label: "File", value: selectedItem.name },
                    { label: "Type", value: selectedItem.mimeType || "File" },
                    { label: "Connection Type", value: enablePersistentConnection ? "Persistent" : "Session" },
                    { label: "Last Modified", value: new Date(selectedItem.lastModified).toLocaleDateString() }
                ]
            }),

            'dropbox': (conn) => ({
                ...baseData,
                title: "Dropbox File Selected",
                message: `Successfully selected "${selectedItem.name}".`,
                details: [
                    { label: "File", value: selectedItem.name },
                    { label: "Size", value: selectedItem.size ? `${(selectedItem.size / 1024).toFixed(1)} KB` : "Unknown" },
                    { label: "Connection Type", value: enablePersistentConnection ? "Persistent" : "Session" },
                    { label: "Last Modified", value: new Date(selectedItem.lastModified).toLocaleDateString() }
                ]
            }),

            'onedrive': (conn) => ({
                ...baseData,
                title: "OneDrive File Selected",
                message: `Successfully selected "${selectedItem.name}".`,
                details: [
                    { label: "File", value: selectedItem.name },
                    { label: "Type", value: selectedItem.mimeType || "File" },
                    { label: "Connection Type", value: enablePersistentConnection ? "Persistent" : "Session" },
                    { label: "Last Modified", value: new Date(selectedItem.lastModified).toLocaleDateString() }
                ]
            }),

            'sharepoint': (conn) => ({
                ...baseData,
                title: "SharePoint Site Selected",
                message: `Successfully selected "${selectedItem.name}".`,
                details: [
                    { label: "Site", value: selectedItem.name },
                    { label: "URL", value: selectedItem.url },
                    { label: "Connection Type", value: enablePersistentConnection ? "Persistent" : "Session" }
                ]
            })
        };

        const formatter = formatters[type];
        if (formatter) {
            return formatter(connection);
        }

        // Default formatter for unknown types
        return {
            ...baseData,
            title: `${serviceDisplayName} Data Source Selected`,
            message: `Successfully selected "${selectedItem.name}".`,
            details: [
                { label: "Item", value: selectedItem.name },
                { label: "Service", value: serviceDisplayName },
                { label: "Connection Type", value: enablePersistentConnection ? "Persistent" : "Session" }
            ]
        };
    };

    const handleConnect = async () => {
        try {
            setIsConnecting(true);
            const result = await connect();
            
            if (result.success) {
                // Wait a moment for connectionInfo to be updated
                await new Promise(resolve => setTimeout(resolve, 100));
                
                let persistentConnection = null;
                
                // Try to create persistent connection if enabled
                if (enablePersistentConnection && dataSourceName && connectionInfo?.account) {
                    try {
                        persistentConnection = await handlePersistentConnection();
                    } catch (persistError) {
                        console.warn('Failed to save persistent connection:', persistError);
                    }
                }

                // Always show success dialog regardless of persistent connection status
                const dialogData = formatConnectionForDialog(
                    persistentConnection || { 
                        name: dataSourceName || `${serviceDisplayName} Session`,
                        status: 'connected',
                        createdAt: new Date().toISOString()
                    }, 
                    adapterType, 
                    connectionInfo?.account || result.account,
                    null, // no selected item yet
                    null  // no worksheets yet
                );
                
                setConnectionDialogData(dialogData);
                setShowSuccessDialog(true);

                // Show demo mode info in dialog context if needed
                if (result.isDemoMode && !persistentConnection) {
                    dialogData.isDemoMode = true;
                    dialogData.message = demoModeMessage || `Connected in demo mode. This shows sample ${serviceDisplayName} data for testing purposes.`;
                }
            } else {
                Alert.alert("Connection Issue", `Unable to connect to ${serviceDisplayName}. Please try again.`);
            }
        } catch (error) {
            console.error('Connection error:', error);
            Alert.alert("Error", `Failed to connect: ${error.message}`);
        } finally {
            setIsConnecting(false);
        }
    };

    const handlePersistentConnection = async () => {
        if (!enablePersistentConnection || !connectionInfo?.account) return null;

        const connectionConfig = {
            type: adapterType,
            name: dataSourceName || `${serviceDisplayName} Connection`,
            connectionConfig: adapter.getConnectionConfig?.() || {},
            dependencies: adapterDependencies
        };
        

        const newDataSource = await globalDataSources.connectDataSource(
            adapterType,
            { connectionConfig: connectionConfig.connectionConfig, dependencies: adapterDependencies },
            connectionConfig.name
        );

        console.log("\n", newDataSource);

        return newDataSource;
    };

    const handleSwitchAccount = () => {
        Alert.alert(`Switch ${serviceDisplayName} Account`,
            `This will sign you out and allow you to sign in with a different ${serviceDisplayName} account.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Switch",
                    onPress: async () => {
                        try {
                            await switchAccount();
                            setSelectedItem(null);
                            setCognitoUser(null);
                            router.push('/login-signup');
                        } catch (error) {
                            console.error('Error switching account:', error);
                            Alert.alert("Error", "Failed to switch account. Please try again.");
                        }
                    }
                }
            ]);
    };

    const handleFetchDataSources = async () => {
        if (dataLoading) return;
        
        setDataLoading(true);
        try {
            await fetchDataSources();
            setSelectedItem(null);
        } catch (error) {
            console.error('Error fetching data sources:', error);
            Alert.alert("Error", `Failed to fetch ${serviceDisplayName.toLowerCase()} data. Please try again.`);
        } finally {
            setDataLoading(false);
        }
    };

    const handleItemSelect = (item) => {
        setSelectedItem(selectedItem?.id === item.id ? null : item);
    };

    const handleContinue = async () => {
        if (!selectedItem) return;
        
        try {
            
            let worksheets = null;
            
            // Get worksheets for spreadsheet types
            if (adapterType === 'google-sheets' || adapter?.getWorksheets) {
                try {
                    worksheets = await getWorksheets(selectedItem.id);
                    console.log('Available worksheets:', worksheets);
                } catch (error) {
                    console.warn('Failed to get worksheets:', error);
                    worksheets = ["Sheet1"]; // fallback
                }
            }

            // Generate navigation parameters
            const navigationParams = getNavigationParams 
                ? getNavigationParams(selectedItem, worksheets, { adapter, connectionInfo, isPersistent: enablePersistentConnection })
                : getDefaultNavigationParams(selectedItem, worksheets);

            const navigationData = {
                pathname: dataManagementPath,
                params: navigationParams
            };

            // Create dialog data
            const dialogData = formatConnectionForDialog(
                { 
                    name: selectedItem.name,
                    id: selectedItem.id,
                    status: 'selected',
                    createdAt: new Date().toISOString()
                }, 
                adapterType, 
                connectionInfo?.account,
                selectedItem,
                worksheets
            );

            // Add navigation data to dialog
            dialogData.navigationData = navigationData;

            handlePersistentConnection();
           
            setConnectionDialogData(dialogData);
            setShowSuccessDialog(true);
           // connectDataSource
            
        } catch (error) {
            console.error("ConnectionDataSourceLayout: Error in continue handler:", error);
            Alert.alert("Error", `Failed to process selection: ${error.message}`);
        }
    };

    const handleDialogConfirm = () => {
        const dialogData = connectionDialogData;
       
        setShowSuccessDialog(false);
        
        // Navigate using the stored navigation data
        if (dialogData?.navigationData) {
            
            router.push(dialogData.navigationData);
        } else {
            console.log('ConnectionDataSourceLayout: No navigation data found in dialog');
        }
    };

    const filteredDataSources = filterDataSources(searchQuery, locationFilter.value);

    // Loading states
    if (enablePersistentConnection && globalDataSources.loading && !authChecked) {
        return <LoadingView title={title} message="Loading data sources..." />;
    }

    if (!authChecked) {
        return <LoadingView title={title} message="Loading..." />;
    }

    return (
        <View style={commonStyles.screen}>
            <Header title={title} showBack />
            <ScrollView contentContainerStyle={commonStyles} style={{marginBottom: 80}}>
                <StackLayout spacing={20}>
                    
                    {/* Error Display */}
                    {(error || (enablePersistentConnection && globalDataSources.error)) && (
                        <StatusCard 
                            backgroundColor={theme.colors.errorContainer}
                            textColor={theme.colors.onErrorContainer}
                        >
                            {error || globalDataSources.error}
                        </StatusCard>
                    )}

                    {/* Demo Mode Indicator */}
                    {connectionInfo?.isDemoMode && (
                        <View style={{ padding: 15, backgroundColor: theme.colors.secondaryContainer, borderRadius: 8 }}>
                            <Text style={{ color: theme.colors.onSecondaryContainer, fontWeight: 'bold', textAlign: 'center' }}>
                                🚀 Demo Mode Active
                            </Text>
                            <Text style={{ color: theme.colors.onSecondaryContainer, textAlign: 'center', fontSize: 12, marginTop: 4 }}>
                                {demoModeMessage || `Using sample ${serviceDisplayName} data for development`}
                            </Text>
                        </View>
                    )}

                    {/* Persistent Connection Status */}
                    {enablePersistentConnection && globalDataSources.stats && (
                        <StatusCard 
                            backgroundColor={theme.colors.surfaceVariant}
                            textColor={theme.colors.onSurfaceVariant}
                        >
                            Connected Data Sources: {globalDataSources.stats.connected}/{globalDataSources.stats.total}
                        </StatusCard>
                    )}
                    
                    {/* Authentication Required */}
                    {!cognitoUser && !connectionInfo?.isDemoMode && (
                        <StackLayout spacing={15}>
                            <Text style={[commonStyles.titleText, { textAlign: 'center' }]}>Authentication Required</Text>
                            <Text style={{ textAlign: 'center' }}>Please sign in to connect your {serviceDisplayName} account</Text>
                            <BasicButton label="Sign In" onPress={() => router.push('/login-signup')} />
                        </StackLayout>
                    )}

                    {/* Connection Status */}
                    {!isConnected() && authChecked && !connectionInfo?.isDemoMode && (
                        <StackLayout spacing={15}>
                            <Text style={[commonStyles.titleText, { textAlign: 'center' }]}>Connect {serviceDisplayName}</Text>
                            <Text style={{ textAlign: 'center' }}>
                                Connect your {serviceDisplayName} account to access your data
                                {enablePersistentConnection && " and save the connection for future use"}
                            </Text>
                            <BasicButton
                                label={isConnecting ? "Connecting..." : `Connect with ${serviceDisplayName}`}
                                onPress={handleConnect}
                                disabled={loading || isConnecting}
                            />
                        </StackLayout>
                    )}

                    {/* Connected Account */}
                    {isConnected() && connectionInfo?.account && (
                        <AccountCard 
                            name={connectionInfo.account.name}
                            email={connectionInfo.account.email}
                            loading={loading}
                            onPress={handleSwitchAccount}
                        />
                    )}

                    {/* Data Sources List */}
                    {isConnected() && (
                        <StackLayout spacing={20}>
                            <Divider color={theme.colors.divider} />
                            
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ fontSize: 16, fontWeight: '600' }}>Your {serviceDisplayName} Data</Text>
                                <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}>
                                    {connectionInfo?.dataSourceCount || dataSources.length} found
                                </Text>
                            </View>

                            {/* Search and Filter */}
                            {showLocationFilter ? (
                                <SearchFilterCard mode="elevated" child={
                                    <StackLayout spacing={8} style={{ flex: 1, alignSelf: 'stretch' }}>
                                        <Searchbar 
                                            placeholder={searchPlaceholder || `Search ${serviceDisplayName.toLowerCase()} files`}
                                            onChangeText={setSearchQuery}
                                            value={searchQuery}
                                            placeholderTextColor={theme.colors.divider}
                                            iconColor={theme.colors.themeGrey}
                                            style={[commonStyles.searchBar, {
                                                backgroundColor: theme.colors.buttonBackground,
                                                alignSelf: 'stretch',
                                            }]}
                                        />
                                        {dataSources.length > 0 && (
                                            <FilterBar
                                                filters={getFilterOptions()}
                                                activeFilter={locationFilter}
                                                onFilterChange={setLocationFilter}
                                            />
                                        )}
                                    </StackLayout>
                                } />
                            ) : (
                                <Searchbar 
                                    placeholder={searchPlaceholder || `Search ${serviceDisplayName.toLowerCase()}`}
                                    onChangeText={setSearchQuery}
                                    value={searchQuery}
                                    placeholderTextColor={theme.colors.divider}
                                    iconColor={theme.colors.themeGrey}
                                    style={[commonStyles.searchBar, { backgroundColor: theme.colors.buttonBackground }]}
                                />
                            )}

                            {showLocationFilter && locationFilter && filteredDataSources.length > 0 && (
                                <Text style={[commonStyles.captionText, {color: theme.colors.themeGrey, fontWeight: 'light'}]}>
                                    Found ({filteredDataSources.length}) files:
                                </Text>
                            )}
                            
                            <StackLayout spacing={15}>
                                {dataLoading ? (
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <Text>Loading {serviceDisplayName.toLowerCase()} data...</Text>
                                    </View>
                                ) : dataSources.length === 0 ? (
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <Text style={{ textAlign: 'center' }}>
                                            {searchQuery 
                                                ? `No ${serviceDisplayName.toLowerCase()} data found matching "${searchQuery}"`
                                                : (emptyStateMessage || `No ${serviceDisplayName.toLowerCase()} data found`)
                                            }
                                        </Text>
                                        {searchQuery ? (
                                            <BasicButton label="Clear Search" onPress={() => setSearchQuery("")} style={{ marginTop: 10 }} />
                                        ) : (
                                            <BasicButton label="Refresh" onPress={handleFetchDataSources} style={{ marginTop: 10 }} />
                                        )}
                                    </View>
                                ) : (
                                    <StackLayout spacing={2}>
                                        {filteredDataSources.map((item) => (
                                            <DataButton
                                                key={item.id}
                                                label={item.name}
                                                description={getItemDescription ? getItemDescription(item, formatDate) : `Last modified: ${formatDate(item.lastModified)}`}
                                                icon={getItemIcon ? getItemIcon(item) : "file"}
                                                onPress={() => handleItemSelect(item)}
                                                boldLabel={false}
                                                selected={selectedItem?.id === item.id}
                                            />
                                        ))}
                                    </StackLayout>
                                )}
                                
                                {dataSources.length > 0 && (
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <IconButton
                                            label={dataLoading ? "Loading..." : "Refresh List"}
                                            onPress={handleFetchDataSources}
                                            loading={dataLoading}
                                            icon="refresh"
                                        />
                                    </View>
                                )}
                            </StackLayout>
                        </StackLayout>
                    )}
                </StackLayout>
            </ScrollView>
            
            {/* Continue Button */}
            <View style={commonStyles.floatingButtonContainer}>
                <BasicButton
                    label="Continue"
                    disabled={!selectedItem}
                    onPress={handleContinue}
                    fullWidth={false}
                />
            </View>

            {/* Success Dialog */}
            {showSuccessDialog && connectionDialogData && (
                <ConnectionDialog
                    visible={showSuccessDialog}
                    onDismiss={() => {
                        setShowSuccessDialog(false);
                    }}
                    onConfirm={handleDialogConfirm}
                    connection={connectionDialogData}
                />
            )}
        </View>
    );
};

export default ConnectionDataSourceLayout;