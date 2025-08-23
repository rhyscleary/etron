import React, { createContext, useContext } from 'react';
import { getWorkspaceId } from '../storage/workspaceStorage';

const AppContext = createContext({});


export function AppProvider({ children }) {
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
                    // Simulate backend call and response
                    await new Promise(res => setTimeout(res, 500));
                    let id = config && config.workspaceId;
                    if (!id) {
                        try {
                            id = await getWorkspaceId();
                            console.log('[AppContext] connectDataSource fetched workspaceId from storage:', id);
                        } catch (e) {
                            console.log('[AppContext] connectDataSource failed to fetch workspaceId from storage', e);
                        }
                    }
                    if (!id) id = 'no-workspace-id';
                    const result = { id, type, config, name };
                    console.log('[AppContext] connectDataSource result', result);
                    return result;
                },
                disconnectDataSource: () => {},
                testConnection: async (type, config, name) => {
                    console.log('[AppContext] testConnection called', { type, config, name });
                    // Simulate a short delay and always succeed
                    await new Promise(res => setTimeout(res, 500));
                    const result = { status: 'success', message: 'Connection successful' };
                    console.log('[AppContext] testConnection success', { type, name, result });
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
