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

import { getCurrentUser } from "aws-amplify/auth";
import { createDataAdapter } from "../../adapters/day-book/data-sources";


const useDataSource = (adapterType, dependencies = {}) => {
    const [adapter, setAdapter] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dataSources, setDataSources] = useState([]);
    const [connectionInfo, setConnectionInfo] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        try {
            const newAdapter = createDataAdapter(adapterType, dependencies);
            
            if (newAdapter) {
                setAdapter(newAdapter);
                const info = newAdapter.getConnectionInfo();
                setConnectionInfo(info);
            } else {
                throw new Error('Failed to create adapter - adapter is null');
            }
        } catch (err) {
            setError(`Failed to create adapter: ${err.message}`);
            console.error('Adapter creation error:', err);
        }
    }, [adapterType]);

    const connect = async () => {
        if (!adapter) {
            const errorMsg = 'Adapter not initialized';
            setError(errorMsg);
            throw new Error(errorMsg);
        }
        
        setLoading(true);
        setError(null);
        
        try {
            const result = await adapter.connect();
            const info = adapter.getConnectionInfo();
            setConnectionInfo(info);
            return result;
        } catch (error) {
            console.error('Connection error:', error);
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const fetchDataSources = async () => {
        if (!adapter) {
            const errorMsg = 'Adapter not initialized';
            setError(errorMsg);
            throw new Error(errorMsg);
        }
        
        setLoading(true);
        setError(null);
        
        try {
            const sources = await adapter.getDataSources();
            setDataSources(sources || []);
            const info = adapter.getConnectionInfo();
            setConnectionInfo(info);
            return sources || [];
        } catch (error) {
            console.error('Fetch data sources error:', error);
            setError(error.message);
            setDataSources([]);
            return [];
        } finally {
            setLoading(false);
        }
    };

    const getData = async (sourceId, options) => {
        if (!adapter) throw new Error('Adapter not initialized');
        return await adapter.getData(sourceId, options);
    };

    const getWorksheets = async (sourceId) => {
        if (!adapter || !adapter.getWorksheets) return ["Sheet1"];
        return await adapter.getWorksheets(sourceId);
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
        if (!adapter || !adapter.switchAccount) return;
        
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

    const filterDataSources = (query, locationFilter = "All") => {
        if (!adapter || !adapter.filterDataSources) {
            return dataSources.filter(item => {
                const matchesSearch = query ? item.name.toLowerCase().includes(query.toLowerCase()) : true;
                const matchesLocation = locationFilter === "All" || item.location === locationFilter;
                return matchesSearch && matchesLocation;
            });
        }
        return adapter.filterDataSources(query, dataSources, locationFilter);
    };

    const getFilterOptions = () => {
        if (adapter && adapter.getFilterOptions) {
            return adapter.getFilterOptions();
        }
        return [{ label: "All", count: dataSources.length, value: "All" }];
    };

    const formatDate = (dateString) => {
        if (!adapter || !adapter.formatDate) {
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString() + " " + 
                    date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            } catch (e) {
                return dateString;
            }
        }
        return adapter.formatDate(dateString);
    };

    return {
        adapter,
        loading,
        dataSources,
        connectionInfo,
        error,
        connect,
        fetchDataSources,
        getData,
        getWorksheets,
        disconnect,
        switchAccount,
        filterDataSources,
        getFilterOptions,
        formatDate,
        isConnected: () => adapter?.isConnected() || false
    };
};

const ConnectionDataSourceLayout = ({
    title,
    adapterType,
    adapterDependencies,
    serviceDisplayName,
    ConnectButton,
    connectButtonProps = {},
    getItemDescription,
    getItemIcon,
    onContinue,
    showLocationFilter = false,
    searchPlaceholder,
    emptyStateMessage,
    demoModeMessage
}) => {
    const theme = useTheme();

    const { 
        adapter,
        loading, 
        dataSources, 
        connectionInfo, 
        error,
        connect, 
        fetchDataSources, 
        getWorksheets,
        disconnect,
        switchAccount,
        filterDataSources,
        getFilterOptions,
        formatDate,
        isConnected 
    } = useDataSource(adapterType, adapterDependencies);

    const [cognitoUser, setCognitoUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedItem, setSelectedItem] = useState(null);
    const [dataLoading, setDataLoading] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    const [locationFilter, setLocationFilter] = useState({ label: "All", count: 0, value: "All" });
    
    useEffect(() => {
        checkAuthStatus();
    }, [adapter]);

    useEffect(() => {
        if (isConnected() && connectionInfo?.account && !dataLoading && dataSources.length === 0) {
            handleFetchDataSources();
        }
    }, [connectionInfo, isConnected()]);

    useEffect(() => {
        if (dataSources.length > 0 && showLocationFilter) {
            const filterOptions = getFilterOptions();
            setLocationFilter(filterOptions[0]);
        }
    }, [dataSources, showLocationFilter]);

    const checkAuthStatus = async () => {
        if (!adapter) return;

        try {
            const user = await getCurrentUser();
            setCognitoUser(user);
            setAuthChecked(true);

            if (user) {
                try {
                    const result = await connect();
                    console.log('Auto-connection result:', result);
                } catch (error) {
                    console.log('Auto-connection failed, will show connect button:', error.message);
                }
            }
        } catch (error) {
            console.log('No authenticated user, enabling demo mode:', error);
            setCognitoUser(null);
            setAuthChecked(true);

            try {
                const result = await connect();
                console.log('Demo connection result:', result);
            } catch (connectError) {
                console.error('Even demo connection failed:', connectError);
            }
        }
    };

    const handleConnect = async () => {
        try {
            const result = await connect();
            
            if (result.success) {
                console.log('Connection successful:', result);
                
                if (result.isDemoMode) {
                    Alert.alert(
                        "Demo Mode",
                        demoModeMessage || `Connected in demo mode. This shows sample ${serviceDisplayName} data for testing purposes.`,
                        [{ text: "OK" }]
                    );
                }
            } else {
                console.log('Connection failed:', result);
                Alert.alert("Connection Issue", `Unable to connect to ${serviceDisplayName}. Please try again.`);
            }
        } catch (error) {
            console.error('Connection error:', error);
            Alert.alert("Error", `Failed to connect: ${error.message}`);
        }
    };

    const handleSwitchAccount = async () => {
        Alert.alert(
            `Switch ${serviceDisplayName} Account`,
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
            ]
        );
    };

    const handleFetchDataSources = async () => {
        if (dataLoading) return;
        
        setDataLoading(true);
        try {
            const sources = await fetchDataSources();
            console.log('Fetched data sources:', sources);
            setSelectedItem(null);
        } catch (error) {
            console.error('Error fetching data sources:', error);
            Alert.alert("Error", `Failed to fetch ${serviceDisplayName.toLowerCase()} data. Please try again.`);
        } finally {
            setDataLoading(false);
        }
    };

    const handleItemSelect = (item) => {  
        if (selectedItem?.id === item.id) {
            setSelectedItem(null);
        } else {
            setSelectedItem(item);
        }
    };

    const handleFilterChange = (filterValue) => {
        setLocationFilter(filterValue);
    };

    const handleContinue = async () => {
        if (!selectedItem || !onContinue) return;
        
        try {
            await onContinue(selectedItem, { getWorksheets });
        } catch (error) {
            console.error("Error in continue handler:", error);
        }
    };

    const filteredDataSources = filterDataSources(searchQuery, locationFilter.value);


    if (!authChecked) {
        return (
            <View style={commonStyles.screen}>
                <Header title={title} showBack />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text>Loading...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={commonStyles.screen}>
            <Header title={title} showBack />
            <ScrollView contentContainerStyle={commonStyles} style={{marginBottom: 80}}>
                <StackLayout spacing={20}>
                    
                    {/* Error Display */}
                    {error && (
                        <View style={{ 
                            padding: 15, 
                            backgroundColor: theme.colors.errorContainer,
                            borderRadius: 8 
                        }}>
                            <Text style={{ color: theme.colors.onErrorContainer }}>
                                {error}
                            </Text>
                        </View>
                    )}

                    {/* Demo Mode Indicator */}
                    {connectionInfo?.isDemoMode && (
                        <View style={{ 
                            padding: 15, 
                            backgroundColor: theme.colors.secondaryContainer,
                            borderRadius: 8 
                        }}>
                            <Text style={{ 
                                color: theme.colors.onSecondaryContainer,
                                fontWeight: 'bold',
                                textAlign: 'center'
                            }}>
                                🚀 Demo Mode Active
                            </Text>
                            <Text style={{ 
                                color: theme.colors.onSecondaryContainer,
                                textAlign: 'center',
                                fontSize: 12,
                                marginTop: 4
                            }}>
                                {demoModeMessage || `Using sample ${serviceDisplayName} data for development`}
                            </Text>
                        </View>
                    )}
                    
                    {/* Authentication Required */}
                    {!cognitoUser && !connectionInfo?.isDemoMode && (
                        <StackLayout spacing={15}>
                            <Text style={[commonStyles.titleText, { textAlign: 'center' }]}>
                                Authentication Required
                            </Text>
                            <Text style={{ textAlign: 'center' }}>
                                Please sign in to connect your {serviceDisplayName} account
                            </Text>
                            <BasicButton
                                label="Sign In"
                                onPress={() => router.push('/login-signup')}
                            />
                        </StackLayout>
                    )}

                    {/* Connection Status */}
                    {!isConnected() && authChecked && !connectionInfo?.isDemoMode && (
                        <StackLayout spacing={15}>
                            <Text style={[commonStyles.titleText, { textAlign: 'center' }]}>
                                Connect {serviceDisplayName}
                            </Text>
                            <Text style={{ textAlign: 'center' }}>
                                Connect your {serviceDisplayName} account to access your data
                            </Text>
                            <ConnectButton
                                {...connectButtonProps}
                                label={loading ? "Connecting..." : `Connect with ${serviceDisplayName}`}
                                onPress={handleConnect}
                                disabled={loading}
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
                            
                            {/* Connection Info */}
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <Text style={{ fontSize: 16, fontWeight: '600' }}>
                                    Your {serviceDisplayName} Data
                                </Text>
                                <Text style={{ 
                                    fontSize: 12, 
                                    color: theme.colors.onSurfaceVariant 
                                }}>
                                    {connectionInfo?.dataSourceCount || dataSources.length} found
                                </Text>
                            </View>

                            {/* Search and Filter */}
                            {showLocationFilter ? (
                                <SearchFilterCard mode={"elevated"}  
                                child={
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
                                                onFilterChange={handleFilterChange}
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
                                    style={[commonStyles.searchBar, {
                                        backgroundColor: theme.colors.buttonBackground,
                                    }]}
                                />
                            )}

                            {showLocationFilter && locationFilter && filteredDataSources.length > 0 && (
                                <Text style={[commonStyles.captionText, {color: theme.colors.themeGrey, fontWeight: 'light'}]}>
                                    {`Found (${filteredDataSources.length}) files:`}
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
                                        {searchQuery && (
                                            <BasicButton
                                                label="Clear Search"
                                                onPress={() => setSearchQuery("")}
                                                style={{ marginTop: 10 }}
                                            />
                                        )}
                                        {!searchQuery && (
                                            <BasicButton
                                                label="Refresh"
                                                onPress={handleFetchDataSources}
                                                style={{ marginTop: 10 }}
                                            />
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
        </View>
    );
};

export default ConnectionDataSourceLayout;