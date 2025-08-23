import React, { createContext, useContext } from 'react';
import DataSourceService from "../services/DataSourceService";
import apiClient from "../utils/api/apiClient";

const AppContext = createContext({});


export function AppProvider({ children }) {
    // Instantiate the real service once for the app
    const dataSourceService = new DataSourceService(apiClient);
    return (
        <AppContext.Provider value={{
            dataSources: {
                list: [],
                count: 0,
                connected: [],
                errors: [],
                isDemoMode: false,
                updateTrigger: 0,
            },
            system: {
                isLoading: false,
                hasError: false,
                error: null,
            },
            actions: {
                login: () => {},
                logout: () => {},
                switchAccount: () => {},
                connectDataSource: async (type, config, name) => {
                    console.log('[AppContext] connectDataSource called', { type, config, name });
                    // No transformation here; service normalizes and posts
                    const created = await dataSourceService.connectDataSource(type, config, name);
                    console.log('[AppContext] connectDataSource result', created);
                    return created;
                },
                disconnectDataSource: async (sourceId) => {
                    return dataSourceService.disconnectDataSource(sourceId);
                },
                testConnection: async (type, config, name) => {
                    console.log('[AppContext] testConnection called', { type, config, name });
                    const result = await dataSourceService.testConnection(type, config, name);
                    console.log('[AppContext] testConnection success', { type, name, result: { status: result?.status } });
                    return result;
                },
                connectProvider: () => {},
                disconnectProvider: () => {},
                isProviderConnected: () => false,
                refreshAll: () => {},
                refreshAccounts: () => {},
                refreshDataSources: () => {},
                getAppState: () => ({}),
                debugAppState: () => {},
                linkCurrentUser: () => {},
                forceUpdate: () => {},
            }
        }}>
            {children}
        </AppContext.Provider>
    );
}


export function useAppContext() {
    return useContext(AppContext);
}

// Alias for compatibility with existing imports
export const useApp = useAppContext;
