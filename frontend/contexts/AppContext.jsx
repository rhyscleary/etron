import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { useAccount } from '../hooks/useAccount';
import useDataSources from '../hooks/useDataSource';

const AppContext = createContext();

// hook to use context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// context provider
export const AppProvider = ({ children }) => {
  // Add state to force re-renders when data changes
  const [updateTrigger, setUpdateTrigger] = useState(0);
  
  // Force update function - only use when absolutely necessary
  const forceUpdate = useCallback(() => {
    setUpdateTrigger(prev => prev + 1);
  }, []);

  // account hook and data sources hook
  const account = useAccount();
  const dataSources = useDataSources({ demoMode: true }); // demo mode
  
  const {
    currentEmail,
    currentProvider,
    linkedAccounts,
    loading: accountLoading,
    error: accountError,
    handleAuthSuccess,
    handleSwitchAccount,
    refreshAccounts,
    linkCurrentUser,
  } = account;

  const {
    dataSources: dataSourcesList,
    loading: dataSourcesLoading,
    error: dataSourcesError,
    authenticationStatus,
    handleAuthenticationChange,
    connectDataSource: originalConnectDataSource,
    disconnectDataSource: originalDisconnectDataSource,
    connectProvider: originalConnectProvider,
    disconnectProvider,
    isProviderConnected,
    loadDataSources,
    refresh: originalRefreshDataSources,
  } = dataSources;

  // combined loading state
  const isLoading = accountLoading || dataSourcesLoading;

  // combined error state
  const hasError = accountError || dataSourcesError;
  const combinedError = accountError || dataSourcesError;

  // sync authentication states between account and data sources
  useEffect(() => {
    const syncAuthenticationStatus = async () => {
      if (currentEmail && authenticationStatus !== 'authenticated') {
        console.log('User is logged in, syncing data sources authentication...');
        await handleAuthenticationChange(true);
      } else if (!currentEmail && authenticationStatus === 'authenticated') {
        console.log('User is logged out, syncing data sources authentication...');
        await handleAuthenticationChange(false);
      }
    };

    // sync if not loading
    if (!accountLoading && authenticationStatus !== 'checking') {
      syncAuthenticationStatus();
    }
  }, [currentEmail, authenticationStatus, accountLoading, handleAuthenticationChange]);

  // Enhanced connect data source - REDUCED forceUpdate calls
  const connectDataSource = useCallback(async (type, config, name) => {
    try {
      console.log('Connecting data source via context...');
      const result = await originalConnectDataSource(type, config, name);
      
      // Only force update if the operation was successful
      // The underlying hook should handle most state updates
      console.log('Data source connected successfully');
      
      return result;
    } catch (error) {
      console.error('Failed to connect data source:', error);
      throw error;
    }
  }, [originalConnectDataSource]);

  // Enhanced disconnect data source - REDUCED forceUpdate calls
  const disconnectDataSource = useCallback(async (sourceId) => {
    try {
      console.log('Disconnecting data source via context...');
      const result = await originalDisconnectDataSource(sourceId);
      
      // Only force update if the operation was successful
      console.log('Data source disconnected successfully');
      
      return result;
    } catch (error) {
      console.error('Failed to disconnect data source:', error);
      throw error;
    }
  }, [originalDisconnectDataSource]);

  // Enhanced connect provider - REDUCED forceUpdate calls
  const connectProvider = useCallback(async (providerType) => {
    try {
      console.log(`Connecting ${providerType} provider via context...`);
      
      if (!currentEmail) {
        console.log('No user logged in, connecting in demo mode');
      }
      
      const result = await originalConnectProvider(providerType);
      
      console.log(`${providerType} provider connected successfully`);
      return result;
    } catch (error) {
      console.error(`Failed to connect ${providerType} provider:`, error);
      throw error;
    }
  }, [originalConnectProvider, currentEmail]);

  // Enhanced refresh - no automatic forceUpdate
  const refreshDataSources = useCallback(async () => {
    try {
      console.log('Refreshing data sources via context...');
      await originalRefreshDataSources();
      // Let the underlying hook manage state updates
      console.log('Data sources refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh data sources:', error);
      throw error;
    }
  }, [originalRefreshDataSources]);

  // combined authentication handler
  const handleFullAuthentication = useCallback(async (provider = 'Cognito') => {
    try {
      console.log('Starting full authentication process...');
      
      // handle account authentication
      await handleAuthSuccess(provider);
      
      // handle data sources authentication
      await handleAuthenticationChange(true);
      
      console.log('Full authentication completed successfully');
      return true;
    } catch (error) {
      console.error('Full authentication failed:', error);
      throw error;
    }
  }, [handleAuthSuccess, handleAuthenticationChange]);

  // combined logout handler
  const handleFullLogout = useCallback(async () => {
    try {
      console.log('Starting full logout process...');
      
      // switch data sources to demo mode first
      await handleAuthenticationChange(false);
      
      console.log('Full logout completed successfully');
      return true;
    } catch (error) {
      console.error('Full logout failed:', error);
      throw error;
    }
  }, [handleAuthenticationChange]);

  // account switching
  const handleFullAccountSwitch = useCallback(async (targetEmail) => {
    try {
      console.log(`Switching to account: ${targetEmail}`);
      
      // switch data sources to demo mode during transition
      await handleAuthenticationChange(false);
      
      // switch account (+ navigate to login)
      await handleSwitchAccount(targetEmail);
      
      console.log('Account switch initiated');
    } catch (error) {
      console.error('Account switch failed:', error);
      throw error;
    }
  }, [handleSwitchAccount, handleAuthenticationChange]);

  // refresh everything - OPTIMIZED to not force update unnecessarily
  const refreshAll = useCallback(async () => {
    try {
      console.log('Refreshing all data...');
      
      // refresh accounts
      await refreshAccounts(currentProvider);
      
      // refresh data sources
      await refreshDataSources();
      
      console.log('All data refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh all data:', error);
      throw error;
    }
  }, [refreshAccounts, refreshDataSources, currentProvider]);

  // get app state - MEMOIZED better
  const getAppState = useCallback(() => {
    return {
      user: {
        isAuthenticated: !!currentEmail,
        email: currentEmail,
        provider: currentProvider,
        linkedAccountsCount: linkedAccounts.length,
      },
      dataSources: {
        count: dataSourcesList.length,
        connected: dataSourcesList.filter(ds => ds.status === 'connected').length,
        errors: dataSourcesList.filter(ds => ds.status === 'error').length,
        isDemoMode: authenticationStatus !== 'authenticated',
      },
      system: {
        isLoading,
        hasError,
        error: combinedError,
      }
    };
  }, [
    currentEmail,
    currentProvider,
    linkedAccounts.length, // Use .length instead of full array
    dataSourcesList.length, // Use .length instead of full array
    dataSourcesList, // Still need full array for filtering
    authenticationStatus,
    isLoading,
    hasError,
    combinedError,
  ]);

  // debug helper
  const debugAppState = useCallback(() => {
    const state = getAppState();
    console.log('=== APP STATE DEBUG ===');
    console.log('User:', state.user);
    console.log('Data Sources:', state.dataSources);
    console.log('System:', state.system);
    console.log('Update Trigger:', updateTrigger);
    console.log('Raw Account Data:', {
      currentEmail,
      currentProvider,
      linkedAccounts: linkedAccounts.length,
      accountLoading,
      accountError
    });
    console.log('Raw Data Sources:', {
      count: dataSourcesList.length,
      authStatus: authenticationStatus,
      dataSourcesLoading,
      dataSourcesError
    });
    console.log('======================');
  }, [getAppState, currentEmail, currentProvider, linkedAccounts.length, accountLoading, accountError, dataSourcesList.length, authenticationStatus, dataSourcesLoading, dataSourcesError, updateTrigger]);

  // OPTIMIZED: Only log significant changes
  useEffect(() => {
    console.log('Data sources list length changed:', dataSourcesList.length);
  }, [dataSourcesList.length]); // Only trigger on count change, not full array change

  // context value - MEMOIZED to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    // USER DATA
    user: {
      currentEmail,
      currentProvider,
      linkedAccounts,
      isAuthenticated: !!currentEmail,
    },

    // DATA SOURCES DATA - optimized computation
    dataSources: {
      list: dataSourcesList,
      count: dataSourcesList.length,
      connected: dataSourcesList.filter(ds => ds.status === 'connected'),
      errors: dataSourcesList.filter(ds => ds.status === 'error'),
      isDemoMode: authenticationStatus !== 'authenticated',
      updateTrigger,
    },

    // SYSTEM STATE
    system: {
      isLoading,
      hasError,
      error: combinedError,
      authenticationStatus,
    },

    // UNIFIED ACTIONS
    actions: {
      // Authentication
      login: handleFullAuthentication,
      logout: handleFullLogout,
      switchAccount: handleFullAccountSwitch,
      
      // DATA SOURCES (enhanced versions)
      connectDataSource,
      disconnectDataSource,
      connectProvider,
      disconnectProvider,
      isProviderConnected,
      
      // REFRESH
      refreshAll,
      refreshAccounts: () => refreshAccounts(currentProvider),
      refreshDataSources,
      
      // UTILITIES
      getAppState,
      debugAppState,
      linkCurrentUser,
      forceUpdate, // Keep but use sparingly
    },

    // TODO: remove
    // === ORIGINAL HOOKS (for backward compatibility) ===
    hooks: {
      account,
      dataSources,
    }
  }), [
    // User dependencies
    currentEmail,
    currentProvider,
    linkedAccounts,
    
    // Data sources dependencies
    dataSourcesList,
    authenticationStatus,
    updateTrigger,
    
    // System dependencies
    isLoading,
    hasError,
    combinedError,
    
    // Action dependencies
    handleFullAuthentication,
    handleFullLogout,
    handleFullAccountSwitch,
    connectDataSource,
    disconnectDataSource,
    connectProvider,
    disconnectProvider,
    isProviderConnected,
    refreshAll,
    refreshAccounts,
    refreshDataSources,
    getAppState,
    debugAppState,
    linkCurrentUser,
    forceUpdate,
    
    // Original hooks
    account,
    dataSources,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};