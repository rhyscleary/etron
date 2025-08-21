import React, {
    createContext,
    useContext,
    useEffect,
    useCallback,
    useState,
    useMemo,
} from 'react';
import { useAccount } from '../hooks/useAccount';
import useDataSources from '../hooks/useDataSource';
import {
    demoConfigManager,
    DEMO_MODES,
    DEFAULT_DEMO_CONFIG,
} from '../config/demoConfig';

const AppContext = createContext();

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within an AppProvider');
    return context;
};

export const AppProvider = ({
    children,
    initialDemoConfig = DEFAULT_DEMO_CONFIG,
}) => {
    const [demoConfig, setDemoConfig] = useState(initialDemoConfig);
    const [showDemoNotification, setShowDemoNotification] = useState(false);
    const [updateTrigger, setUpdateTrigger] = useState(0);

    const forceUpdate = useCallback(() => setUpdateTrigger((p) => p + 1), []);

    useEffect(() => {
        demoConfigManager.updateConfig(initialDemoConfig);
        const unsubscribe = demoConfigManager.addListener((newConfig, oldConfig) => {
            setDemoConfig(newConfig);
            try {
                const oldDS = oldConfig?.components?.dataSources;
                const newDS = newConfig?.components?.dataSources;
                const oldEnabled = typeof oldDS === 'boolean' ? oldDS : !!(oldDS && Object.values(oldDS).some(Boolean));
                const newEnabled = typeof newDS === 'boolean' ? newDS : !!(newDS && Object.values(newDS).some(Boolean));
                if (newConfig.fallback.notifyUserOnFallback && !oldEnabled && newEnabled) {
                    setShowDemoNotification(true);
                }
            } catch (e) {
                // ignore
            }
            forceUpdate();
        });
        return unsubscribe;
    }, [initialDemoConfig, forceUpdate]);

    const account = useAccount();
    
    // dataSources can be a boolean (global) or an object map (per-type).
    // Pass only the global boolean into useDataSources to avoid forcing the service
    // into full-demo when only some types are demo-enabled.
    const dataSourcesGlobalDemo = useMemo(() => {
        const cfg = demoConfig.components.dataSources;
        return typeof cfg === 'boolean' ? cfg : false;
    }, [demoConfig.components.dataSources]);

    const dataSourcesAnyTypeDemo = useMemo(() => {
        const cfg = demoConfig.components.dataSources;
        return typeof cfg === 'boolean' ? cfg : !!(cfg && Object.values(cfg).some(Boolean));
    }, [demoConfig.components.dataSources]);

    const dataSourcesOptions = useMemo(() => ({
        demoMode: dataSourcesGlobalDemo,
        stableKey: 'app-context-data-sources',
    }), [dataSourcesGlobalDemo]);

    const dataSources = useDataSources(dataSourcesOptions);

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

    const isLoading = accountLoading || dataSourcesLoading;
    const hasError = accountError || dataSourcesError;
    const combinedError = accountError || dataSourcesError;

    const demoModeControls = useMemo(
        () => ({
            getStatus: () => demoConfigManager.getDemoStatus(),
            setMode: (mode) => demoConfigManager.setMode(mode),
            setComponentDemo: (component, enabled) =>
                demoConfigManager.setComponentDemo(component, enabled),
                // Set demo for a specific data source type (testing helper)
                setDataSourceDemo: (type, enabled) => demoConfigManager.setDataSourceDemo(type, enabled),
                // Query whether a specific data source type is in demo mode
                isDataSourceTypeInDemo: (type) => demoConfigManager.isDataSourceTypeInDemo(type),
            toggleAuthentication: () =>
                demoConfigManager.setComponentDemo(
                    'authentication',
                    !demoConfig.components.authentication
                ),
            toggleDataSources: () => demoConfigManager.setComponentDemo('dataSources', !isDataSourcesDemo),
            toggleApiConnections: () =>
                demoConfigManager.setComponentDemo(
                    'apiConnections',
                    !demoConfig.components.apiConnections
                ),
            toggleFileStorage: () =>
                demoConfigManager.setComponentDemo(
                    'fileStorage',
                    !demoConfig.components.fileStorage
                ),
            enableAllDemo: () => demoConfigManager.setMode(DEMO_MODES.FULL_DEMO),
            disableAllDemo: () => demoConfigManager.setMode(DEMO_MODES.DISABLED),
            enableDataSourcesOnly: () =>
                demoConfigManager.setMode(DEMO_MODES.DATA_SOURCES_ONLY),
            updateBehavior: (behaviorUpdates) =>
                demoConfigManager.updateConfig({ behavior: behaviorUpdates }),
            updateDataSettings: (dataUpdates) =>
                demoConfigManager.updateConfig({ data: dataUpdates }),
            reset: () => demoConfigManager.reset(),
            getConfig: () => demoConfigManager.getConfig(),
            isComponentInDemo: (component) =>
                demoConfigManager.isComponentInDemo(component),
            isAnyDemoActive: () => demoConfigManager.isDemoActive(),
        }),
        [demoConfig]
    );

    useEffect(() => {
        const syncAuthenticationStatus = async () => {
            if (demoConfig.components.authentication) return;
            if (currentEmail && authenticationStatus !== 'authenticated') {
                await handleAuthenticationChange(true);
            } else if (!currentEmail && authenticationStatus === 'authenticated') {
                await handleAuthenticationChange(false);
            }
        };
        if (!accountLoading && authenticationStatus !== 'checking') {
            syncAuthenticationStatus();
        }
    }, [
        currentEmail,
        authenticationStatus,
        accountLoading,
        handleAuthenticationChange,
        demoConfig.components.authentication,
    ]);

    const connectDataSource = useCallback(
        async (type, config, name) => {
            try {
                console.log('[AppContext] connectDataSource forwarded', { type, name });
                return await originalConnectDataSource(type, config, name);
            } catch (error) {
                throw error;
            }
        },
        [originalConnectDataSource, demoConfig.components.dataSources]
    );

    const disconnectDataSource = useCallback(
        async (sourceId) => {
            try {
                return await originalDisconnectDataSource(sourceId);
            } catch (error) {
                throw error;
            }
        },
        [originalDisconnectDataSource, demoConfig.components.dataSources]
    );

    const connectProvider = useCallback(
        async (providerType) => {
            try {
                if (!currentEmail && !demoConfig.components.authentication) {
                    throw new Error('Authentication required to connect provider');
                }
                return await originalConnectProvider(providerType);
            } catch (error) {
                throw error;
            }
        },
        [
            originalConnectProvider,
            currentEmail,
            demoConfig.components.authentication,
            demoConfig.components.apiConnections,
        ]
    );

    const refreshDataSources = useCallback(
        async () => {
            try {
                await originalRefreshDataSources();
            } catch (error) {
                throw error;
            }
        },
        [originalRefreshDataSources, demoConfig.components.dataSources]
    );

    const handleFullAuthentication = useCallback(
        async (provider = 'Cognito') => {
            try {
                if (!demoConfig.components.authentication) {
                    await handleAuthSuccess(provider);
                }
                await handleAuthenticationChange(true);
                return true;
            } catch (error) {
                throw error;
            }
        },
        [handleAuthSuccess, handleAuthenticationChange, demoConfig.components.authentication]
    );

    const handleFullLogout = useCallback(
        async () => {
            try {
                if (demoConfig.fallback.enableOnAuthFailure) {
                    await handleAuthenticationChange(false);
                }
                return true;
            } catch (error) {
                throw error;
            }
        },
        [handleAuthenticationChange, demoConfig.fallback.enableOnAuthFailure]
    );

    const handleFullAccountSwitch = useCallback(
        async (targetEmail) => {
            try {
                if (demoConfig.fallback.enableOnAuthFailure) {
                    await handleAuthenticationChange(false);
                }
                if (!demoConfig.components.authentication) {
                    await handleSwitchAccount(targetEmail);
                }
            } catch (error) {
                throw error;
            }
        },
        [
            handleSwitchAccount,
            handleAuthenticationChange,
            demoConfig.components.authentication,
            demoConfig.fallback.enableOnAuthFailure,
        ]
    );

    const refreshAll = useCallback(
        async () => {
            try {
                if (!demoConfig.components.authentication) {
                    await refreshAccounts(currentProvider);
                }
                await refreshDataSources();
            } catch (error) {
                throw error;
            }
        },
        [
            refreshAccounts,
            refreshDataSources,
            currentProvider,
            demoConfig.components.authentication,
            demoConfig.components.dataSources,
        ]
    );

    const getAppState = useCallback(() => {
        const demoStatus = demoModeControls.getStatus();
        return {
            user: {
                isAuthenticated: !!currentEmail || demoConfig.components.authentication,
                email:
                    currentEmail ||
                    (demoConfig.components.authentication ? 'demo@example.com' : null),
                provider:
                    currentProvider ||
                    (demoConfig.components.authentication ? 'Demo' : null),
                linkedAccountsCount: linkedAccounts.length,
                isDemoAuth: demoConfig.components.authentication,
            },
            dataSources: {
                count: dataSourcesList.length,
                connected: dataSourcesList.filter((ds) => ds.status === 'connected')
                    .length,
                errors: dataSourcesList.filter((ds) => ds.status === 'error').length,
                isDemoMode: dataSourcesAnyTypeDemo,
                demoSourceCount: dataSourcesAnyTypeDemo ? dataSourcesList.length : 0,
            },
            demo: {
                mode: demoConfig.mode,
                isActive: demoStatus.isActive,
                activeComponents: demoStatus.activeComponents,
                showIndicators: demoConfig.behavior.showDemoIndicators,
                config: demoConfig,
            },
            system: {
                isLoading,
                hasError,
                error: combinedError,
                authenticationStatus: demoConfig.components.authentication
                    ? 'demo'
                    : authenticationStatus,
            },
        };
    }, [
        currentEmail,
        currentProvider,
        linkedAccounts.length,
        dataSourcesList,
        authenticationStatus,
        isLoading,
        hasError,
        combinedError,
        demoConfig,
        demoModeControls,
    ]);

    const dismissDemoNotification = useCallback(
        () => setShowDemoNotification(false),
        []
    );

    const debugAppState = useCallback(() => {
        const state = getAppState();
        // eslint-disable-next-line no-console
        console.log('=== APP STATE DEBUG ===', state, {
            updateTrigger,
            showDemoNotification,
        });
    }, [getAppState, updateTrigger, showDemoNotification]);

    const contextValue = useMemo(
        () => ({
                user: {
                    email: currentEmail,
                    provider: currentProvider,
                    accounts: demoConfig.components.authentication
                        ? []
                        : linkedAccounts,
                    isAuthenticated: !!currentEmail || demoConfig.components.authentication,
                    isDemoAuth: demoConfig.components.authentication,
                },
                dataSources: {
                    list: dataSourcesList,
                count: dataSourcesList.length,
                connected: dataSourcesList.filter((ds) => ds.status === 'connected'),
                errors: dataSourcesList.filter((ds) => ds.status === 'error'),
                // expose a boolean global demo flag to consumers; per-type behavior
                // is handled by demoConfigManager directly in services/adapters
                isDemoMode: dataSourcesGlobalDemo,
                updateTrigger,
            },
            demo: {
                controls: demoModeControls,
                config: demoConfig,
                notification: {
                    show: showDemoNotification,
                    dismiss: dismissDemoNotification,
                },
                status: demoModeControls.getStatus(),
            },
            system: {
                isLoading,
                hasError,
                error: combinedError,
                authenticationStatus: demoConfig.components.authentication
                    ? 'demo'
                    : authenticationStatus,
            },
            actions: {
                login: handleFullAuthentication,
                logout: handleFullLogout,
                switchAccount: handleFullAccountSwitch,
                connectDataSource,
                disconnectDataSource,
                connectProvider,
                disconnectProvider,
                isProviderConnected,
                refreshAll,
                refreshAccounts: () =>
                    demoConfig.components.authentication
                        ? Promise.resolve()
                        : refreshAccounts(currentProvider),
                refreshDataSources,
                getAppState,
                debugAppState,
                linkCurrentUser: demoConfig.components.authentication
                    ? () => Promise.resolve()
                    : linkCurrentUser,
                forceUpdate,
            },
            hooks: {
                account,
                dataSources,
            },
        }),
        [
            currentEmail,
            currentProvider,
            linkedAccounts,
            dataSourcesList,
            authenticationStatus,
            updateTrigger,
            demoConfig,
            demoModeControls,
            showDemoNotification,
            dismissDemoNotification,
            isLoading,
            hasError,
            combinedError,
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
            account,
            dataSources,
        ]
    );

    return (
        <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
    );
};
