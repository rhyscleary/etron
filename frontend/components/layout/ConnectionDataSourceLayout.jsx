import React, { useState, useEffect, useCallback } from "react";
import { View, Alert } from "react-native";
import { ScrollView } from "react-native";
import { useTheme, Text, Searchbar } from "react-native-paper";
import { router } from "expo-router";
import { getCurrentUser } from "aws-amplify/auth";

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
    dataManagementPath = "/modules/day-book/data-management/data-management",
    getNavigationParams,
    getAdapterFilterOptions,
}) => {
    const theme = useTheme();
    const filterOptions = ["All", "OneDrive", "Sharepoint"];
    
    // Use the global data sources hook
    const {
        dataSources: connectedDataSources,
        loading: dataSourcesLoading,
        error: dataSourcesError,
        connectDataSource,
        isDemoModeActive
    } = useDataSources();

    // Local state
    const [connectionInfo, setConnectionInfo] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedItem, setSelectedItem] = useState(null);
    const [availableDataSources, setAvailableDataSources] = useState([]);
    const [dataLoading, setDataLoading] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    const [locationFilter, setLocationFilter] = useState({ label: "All", count: 0, value: "All" });
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [connectionDialogData, setConnectionDialogData] = useState(null);

    // Find existing connection
    const existingConnection = connectedDataSources.find(source => source.type === adapterType);
    const isConnected = existingConnection?.status === 'connected';
    const isDemoMode = isDemoModeActive();

    // Auth check
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const user = await getCurrentUser();
                setConnectionInfo(user);
            } catch (error) {
                console.log('No authenticated user:', error);
                setConnectionInfo(null);
            } finally {
                setAuthChecked(true);
            }
        };
        checkAuth();
    }, []);

    // Auto-fetch data when connected
    useEffect(() => {
        if (isConnected && availableDataSources.length === 0 && !dataLoading) {
            handleFetchData();
        }
    }, [isConnected]);

    const handleConnect = useCallback(async () => {
        console.log("handle connect called");
        try {
            setIsConnecting(true);
            setError(null);
            
            const connectionConfig = {
                ...adapterDependencies,
                isDemoMode
            };
            console.log("attempting connection: ", adapterType, connectionConfig, connectionName);
            const connectionName = dataSourceName || `${serviceDisplayName}`;
            const newDataSource = await connectDataSource(adapterType, connectionConfig, connectionName);
            console.log("connection: ", newDataSource);
            
            if (newDataSource) {
                setConnectionDialogData(dialogData);
                setShowSuccessDialog(true);
            } else {
                Alert.alert("Connection Issue", `Unable to connect to ${serviceDisplayName}. Please try again.`);
            }
        } catch (error) {
            console.error('Connection error:', error);
            setError(error.message);
            Alert.alert("Error", `Failed to connect: ${error.message}`);
        } finally {
            setIsConnecting(false);
        }
    }, [connectDataSource, adapterType, adapterDependencies, isDemoMode, dataSourceName, serviceDisplayName]);

    const handleFetchData = useCallback(async () => {
        if (dataLoading || !existingConnection) return;
        
        setDataLoading(true);
        setError(null);
        
        try {
            // This is a placeholder - you'll need to implement the actual data fetching
            // using your DataSourceService based on the adapter type
            const mockData = generateMockData(adapterType);
            setAvailableDataSources(mockData);
            setSelectedItem(null);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError(error.message);
            Alert.alert("Error", `Failed to fetch ${serviceDisplayName.toLowerCase()} data.`);
        } finally {
            setDataLoading(false);
        }
    }, [dataLoading, existingConnection, adapterType, serviceDisplayName]);

    // Generate mock data based on adapter type (replace with actual data fetching)
    const generateMockData = (type) => {
        const baseItems = Array.from({ length: 5 }, (_, i) => ({
            id: `${type}_item_${i + 1}`,
            name: `${serviceDisplayName} Item ${i + 1}`,
            lastModified: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
            mimeType: type === 'google-sheets' ? 'application/vnd.google-apps.spreadsheet' : 'application/octet-stream',
            size: Math.floor(Math.random() * 1000000),
            url: `https://example.com/${type}/${i + 1}`,
            location: i % 2 === 0 ? 'Folder A' : 'Folder B'
        }));
        
        return baseItems;
    };

    const handleItemSelect = useCallback((item) => {
        setSelectedItem(selectedItem?.id === item.id ? null : item);
    }, [selectedItem]);

    const handleContinue = useCallback(async () => { 
        if (!selectedItem || !existingConnection) return;
        
        try {
            const navigationParams = getNavigationParams 
                ? getNavigationParams(selectedItem, null, { currentDataSource: existingConnection, isPersistent: enablePersistentConnection })
                : getDefaultNavigationParams(selectedItem);

            const navigationData = {
                pathname: dataManagementPath,
                params: navigationParams
            };

            const dialogData = formatConnectionForDialog(
                { ...selectedItem, status: 'selected' },
                selectedItem
            );
            dialogData.navigationData = navigationData;
            
            setConnectionDialogData(dialogData);
            setShowSuccessDialog(true);
            
        } catch (error) {
            console.error("Error in continue handler:", error);
            Alert.alert("Error", `Failed to process selection: ${error.message}`);
        }
    }, [selectedItem, existingConnection, getNavigationParams, enablePersistentConnection, dataManagementPath]);

    const getDefaultNavigationParams = (item) => {
        const baseParams = {
            type: adapterType,
            name: item.name,
            isPersistent: enablePersistentConnection ? 'true' : 'false',
            sourceId: existingConnection?.id
        };

        switch (adapterType) {
            case 'google-sheets':
                return { ...baseParams, spreadsheetId: item.id, url: item.url };
            case 'google-drive':
            case 'dropbox':
            case 'onedrive':
                return { ...baseParams, fileId: item.id, mimeType: item.mimeType };
            default:
                return { ...baseParams, itemId: item.id };
        }
    };

    const formatConnectionForDialog = (connection, selectedItem = null) => {
        const baseData = {
            name: connection.name,
            status: connection.status || 'connected',
            createdAt: connection.createdAt || new Date().toISOString(),
            originalConnection: connection
        };

        if (isDemoMode) {
            baseData.isDemoMode = true;
            baseData.message = demoModeMessage || `Connected in demo mode with sample ${serviceDisplayName} data.`;
        }

        return {
            ...baseData,
            title: selectedItem ? `${serviceDisplayName} Data Source Selected` : `${serviceDisplayName} Connected`,
            message: selectedItem ? 
                `Successfully selected "${selectedItem.name}".` :
                `Successfully connected to ${serviceDisplayName}.`,
            details: selectedItem ? [
                { label: "Item", value: selectedItem.name },
                { label: "Service", value: serviceDisplayName },
                { label: "Connection Type", value: enablePersistentConnection ? "Persistent" : "Session" }
            ] : [
                { label: "Service", value: serviceDisplayName },
                { label: "Connection Type", value: enablePersistentConnection ? "Persistent" : "Session" }
            ]
        };
    };

    const handleDialogConfirm = useCallback(() => { // TODO: this function should connect the data source and navigate to the right page
        setShowSuccessDialog(false);
        if (connectionDialogData?.navigationData) {
            router.push(connectionDialogData.navigationData);
        }
    }, [connectionDialogData]);

    // Filter and search
    const filterDataSources = useCallback((query, locationFilter = "All") => {
        return availableDataSources.filter(item => {
            const matchesSearch = !query || item.name.toLowerCase().includes(query.toLowerCase());
            const matchesLocation = locationFilter === "All" || item.location === locationFilter;
            return matchesSearch && matchesLocation;
        });
    }, [availableDataSources]);

    const getFilterOptions = useCallback(() => {
        console.log(showLocationFilter);
        if (!showLocationFilter || availableDataSources.length === 0) {
            return [{ label: "All", count: availableDataSources.length, value: "All" }];
        }
        
        const locationCounts = availableDataSources.reduce((acc, item) => {
            const location = item.location || "Default";
            acc[location] = (acc[location] || 0) + 1;
            return acc;
        }, {});
        
        return [
            { label: "All", count: availableDataSources.length, value: "All" },
            ...Object.entries(locationCounts).map(([location, count]) => ({
                label: location,
                count,
                value: location
            }))
        ];
    }, [showLocationFilter, availableDataSources]);

    const formatDate = useCallback((dateString) => {
        try {
            const date = new Date(dateString);
            return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        } catch (e) {
            return dateString;
        }
    }, []);

    const filteredDataSources = filterDataSources(searchQuery, locationFilter.value);
    const accountInfo = connectionInfo ? {
        name: connectionInfo?.name || `${serviceDisplayName} User`,
        email: connectionInfo.signInDetails?.loginId || connectionInfo.username || 'Demo User'
    } : null;

    // Loading states
    if (dataSourcesLoading && !authChecked) {
        return <LoadingView title={title} message="Loading..." />;
    }

    return (
        <View style={commonStyles.screen}>
            <Header title={title} showBack />
            <ScrollView contentContainerStyle={commonStyles} style={{marginBottom: 80}}>
                <StackLayout spacing={20}>
                    
                    {/* Error Display */}
                    {(error || dataSourcesError) && (
                        <StatusCard 
                            backgroundColor={theme.colors.errorContainer}
                            textColor={theme.colors.onErrorContainer}
                        >
                            {error || dataSourcesError}
                        </StatusCard>
                    )}

                    {/* Demo Mode Indicator */}
                    {isDemoMode && (
                        <StatusCard 
                            backgroundColor={theme.colors.secondaryContainer}
                            textColor={theme.colors.onSecondaryContainer}
                        >
                            🚀 Demo Mode Active{'\n'}
                            {demoModeMessage || `Using sample ${serviceDisplayName} data for development`}
                        </StatusCard>
                    )}

                    {/* Connection Status */}
                    {!isConnected && authChecked && (
                        <StackLayout spacing={15}>
                            <Text style={[commonStyles.titleText, { textAlign: 'center' }]}>
                                Connect {serviceDisplayName}
                            </Text>
                            <Text style={{ textAlign: 'center' }}>
                                Connect your {serviceDisplayName} account to access your data
                                {enablePersistentConnection && " and save the connection for future use"}
                            </Text>
                            <BasicButton // TODO: this button should actually allow the user to connect with a service provider, should do a similar thing to switch account but multiple accounts not implemented for not demo yet so just mimic it
                                label={isConnecting ? "Connecting..." : `Connect with ${serviceDisplayName}`}
                                onPress={handleConnect}
                                disabled={dataSourcesLoading || isConnecting}
                            />
                        </StackLayout>
                    )}

                    {/* Connected Account */}
                    {isConnected && accountInfo && (
                        <AccountCard 
                            name={accountInfo.name}
                            email={accountInfo.email}
                            loading={dataLoading}
                            onPress={() => {
                                Alert.alert(`Switch ${serviceDisplayName} Account`,
                                    `This will sign you out and allow you to sign in with a different account.`,
                                    [
                                        { text: "Cancel", style: "cancel" },
                                        { text: "Switch", onPress: () => router.push('/login-signup') }
                                    ]
                                );
                            }}
                        />
                    )}

                    {/* Data Sources List */}
                    {isConnected && (
                        <StackLayout spacing={20}>
                            <Divider color={theme.colors.divider} />
                            
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ fontSize: 16, fontWeight: '600' }}>Your {serviceDisplayName} Data</Text>
                                <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}>
                                    {availableDataSources.length} found
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
                                            style={[commonStyles.searchBar, { backgroundColor: theme.colors.buttonBackground }]}
                                            placeholderTextColor={theme.colors.divider}
                                            iconColor={theme.colors.themeGrey}
                                        />
                                        {availableDataSources.length > 0 && (
                                            <FilterBar // TODO: this needs to be able to get filter options from the adapter-type
                                                filters={filterOptions}
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
                                    style={[commonStyles.searchBar, { backgroundColor: theme.colors.buttonBackground }]}
                                />
                            )}
                            
                            <StackLayout spacing={15}>
                                {dataLoading ? (
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <Text>Loading {serviceDisplayName.toLowerCase()} data...</Text>
                                    </View>
                                ) : availableDataSources.length === 0 ? (
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <Text style={{ textAlign: 'center' }}>
                                            {emptyStateMessage || `No ${serviceDisplayName.toLowerCase()} data found`}
                                        </Text>
                                        <BasicButton 
                                            label="Refresh" 
                                            onPress={handleFetchData} 
                                            style={{ marginTop: 10 }} 
                                        />
                                    </View>
                                ) : (
                                    <StackLayout spacing={2}>
                                        {filteredDataSources.map((item) => (
                                            <DataButton
                                                key={item.id}
                                                label={item.name}
                                                description={getItemDescription ? 
                                                    getItemDescription(item, formatDate) : 
                                                    `Last modified: ${formatDate(item.lastModified)}`
                                                }
                                                icon={getItemIcon ? getItemIcon(item) : "file"}
                                                onPress={() => handleItemSelect(item)}
                                                selected={selectedItem?.id === item.id}
                                            />
                                        ))}
                                    </StackLayout>
                                )}
                                
                                {availableDataSources.length > 0 && (
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <IconButton
                                            label={dataLoading ? "Loading..." : "Refresh List"}
                                            onPress={handleFetchData}
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
                    onDismiss={() => setShowSuccessDialog(false)}
                    onConfirm={handleDialogConfirm} // TODO: this dialog should display the test connection data
                    connection={connectionDialogData}
                />
            )}
        </View>
    );
};

export default ConnectionDataSourceLayout;