// TODO: this file can be extended to update the data sources after being notified by the backend (after processing webhook)
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "../utils/api/apiClient";
import { AccountStorage } from "../storage/accountStorage";
import DataSourceService from "../services/DataSourceService";
import { getAdapterInfo } from "../adapters/day-book/data-sources/DataAdapterFactory";
import AuthService from "../services/AuthService";

// Create API client that integrates with AccountStorage
const createApiClient = () => ({
  get: async (path, config = {}) => {
    const data = await apiGet(path, config.params || {});
    return { data };
  },

  post: async (path, body = {}) => {
    const data = await apiPost(path, body);
    return { data };
  },

  put: async (path, body = {}) => {
    const data = await apiPut(path, body);
    return { data };
  },

  delete: async (path) => {
    const data = await apiDelete(path);
    return { data };
  },

  request: async (url, config = {}) => {
    const method = (config.method || "GET").toLowerCase();
    const data = config.data || {};
    const params = config.params || {};

    let responseData;
    switch (method) {
      case "post":
        responseData = await apiPost(url, data);
        break;
      case "put":
        responseData = await apiPut(url, data);
        break;
      case "delete":
        responseData = await apiDelete(url, params);
        break;
      default:
        responseData = await apiGet(url, params);
    }

    return {
      data: responseData,
      status: 200,
      headers: { "content-type": "application/json" },
      responseTime: "200ms",
    };
  },
});

// Global service instance
let globalDataSourceService = null;

const getDataSourceService = (options = {}) => {
  if (!globalDataSourceService) {
    const apiClient = createApiClient();
    console.log("Creating new DataSourceService instance with AccountStorage integration");
    globalDataSourceService = new DataSourceService(apiClient, {
      demoMode: options.demoMode !== false, // Default to true unless explicitly set to false
      ...options,
    });
  }
  return globalDataSourceService;
};

export const resetDataSourceService = () => {
  console.log("Resetting DataSourceService instance");
  globalDataSourceService = null;
};

// Custom hook that integrates with AccountStorage
const useDataSources = (options = {}) => {
  const [dataSources, setDataSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [authenticationStatus, setAuthenticationStatus] = useState('checking');
  const [updateTrigger, setUpdateTrigger] = useState(0);
  
  // Refs for preventing stale closures and tracking operations
  const isUnmountedRef = useRef(false);
  const lastLoadTimeRef = useRef(0);
  const loadingOperationRef = useRef(null);

  // Force update function
  const forceUpdate = useCallback(() => {
    console.log("Force updating useDataSources");
    setUpdateTrigger(prev => prev + 1);
  }, []);

  // Use the global service instance
  const service = useMemo(() => getDataSourceService(options), [options.demoMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      if (loadingOperationRef.current) {
        console.log("Cancelling pending load operation on unmount");
      }
    };
  }, []);

  // Check authentication status on mount and when account changes
  const checkAuthenticationStatus = useCallback(async () => {
    if (isUnmountedRef.current) return false;
    
    try {
      const isAuthenticated = await AuthService.isAuthenticated();
      if (!isUnmountedRef.current) {
        const status = isAuthenticated ? 'authenticated' : 'unauthenticated';
        setAuthenticationStatus(status);
        console.log(`Authentication status: ${status}`);
      }
      return isAuthenticated;
    } catch (error) {
      console.error('Error checking authentication status:', error);
      if (!isUnmountedRef.current) {
        setAuthenticationStatus('error');
      }
      return false;
    }
  }, []);

  // Load all data sources with authentication check
  const loadDataSources = useCallback(
    async (showLoading = true) => {
      if (isUnmountedRef.current) {
        console.log("Component unmounted, skipping load");
        return;
      }

      // Prevent concurrent loads
      if (loadingOperationRef.current) {
        console.log("Load already in progress, waiting...");
        return await loadingOperationRef.current;
      }

      const loadPromise = (async () => {
        try {
          const startTime = Date.now();
          lastLoadTimeRef.current = startTime;

          if (showLoading && !isUnmountedRef.current) {
            setLoading(true);
          }
          
          if (!isUnmountedRef.current) {
            setError(null);
          }

          // Check authentication first
          const isAuthenticated = await checkAuthenticationStatus();
          
          // Early return if unmounted during auth check
          if (isUnmountedRef.current) return;

          if (!isAuthenticated && !service.isDemoModeActive()) {
            console.log("User not authenticated, enabling demo mode");
            service.enableDemoMode();
          }

          console.log("Loading data sources...");
          const [sources, sourceStats] = await Promise.all([
            service.getConnectedDataSources(),
            service.getDataSourceStats()
          ]);

          // Only update state if this is the most recent load and component is mounted
          if (!isUnmountedRef.current && lastLoadTimeRef.current === startTime) {
            console.log("Loaded sources:", sources.length, sources.map((s) => s.id));
            setDataSources(sources);
            setStats(sourceStats);
            setError(null);
          }
        } catch (err) {
          console.error("Failed to load data sources:", err);
          
          if (isUnmountedRef.current) return;
          
          // If authentication failed, try enabling demo mode
          if (err.message.includes('authentication') || err.message.includes('token')) {
            console.log("Authentication error, enabling demo mode");
            service.enableDemoMode();
            
            try {
              const [sources, sourceStats] = await Promise.all([
                service.getConnectedDataSources(),
                service.getDataSourceStats()
              ]);
              
              if (!isUnmountedRef.current) {
                setDataSources(sources);
                setStats(sourceStats);
                setError(null);
              }
            } catch (demoErr) {
              console.error("Failed to load demo sources:", demoErr);
              if (!isUnmountedRef.current) {
                setError(demoErr.message);
              }
            }
          } else {
            if (!isUnmountedRef.current) {
              setError(err.message);
            }
          }
        } finally {
          loadingOperationRef.current = null;
          if (showLoading && !isUnmountedRef.current) {
            setLoading(false);
          }
        }
      })();

      loadingOperationRef.current = loadPromise;
      return loadPromise;
    },
    [service, checkAuthenticationStatus]
  );

  // Connect a new data source with authentication check
  const connectDataSource = useCallback(
    async (type, config, name) => {
      if (isUnmountedRef.current) return;
      
      try {
        setError(null);
        console.log("Before connecting - current sources:", dataSources.length);

        // Check authentication before connecting
        const isAuthenticated = await checkAuthenticationStatus();
        if (isUnmountedRef.current) return;
        
        if (!isAuthenticated && !service.isDemoModeActive()) {
          console.log("User not authenticated, enabling demo mode for connection");
          service.enableDemoMode();
        }

        const newSource = await service.connectDataSource(type, config, name);
        if (isUnmountedRef.current) return newSource;
        
        console.log("New source created:", newSource.id);

        // Force immediate reload to ensure state is in sync
        await loadDataSources(false);
        forceUpdate();

        console.log("After connecting - reloaded sources");
        return newSource;
      } catch (err) {
        console.error("Failed to connect data source:", err);
        if (!isUnmountedRef.current) {
          setError(err.message);
        }
        throw err;
      }
    },
    [service, dataSources.length, loadDataSources, checkAuthenticationStatus, forceUpdate]
  );

  const disconnectDataSource = useCallback(
    async (sourceId) => {
      if (isUnmountedRef.current) return;
      
      try {
        setError(null);
        console.log("Disconnecting source:", sourceId);

        await service.disconnectDataSource(sourceId);
        if (isUnmountedRef.current) return;

        // Force immediate reload instead of manual state update
        await loadDataSources(false);
        forceUpdate();

        console.log("Source disconnected and list reloaded");
      } catch (err) {
        console.error("Failed to disconnect data source:", err);
        if (!isUnmountedRef.current) {
          setError(err.message);
        }
        throw err;
      }
    },
    [service, loadDataSources, forceUpdate]
  );

  const updateDataSource = useCallback(
    async (sourceId, updates) => {
      if (isUnmountedRef.current) return;
      
      try {
        setError(null);
        const updated = await service.updateDataSource(sourceId, updates);
        if (isUnmountedRef.current) return updated;

        // Force reload to ensure consistency
        await loadDataSources(false);
        forceUpdate();

        return updated;
      } catch (err) {
        console.error("Failed to update data source:", err);
        if (!isUnmountedRef.current) {
          setError(err.message);
        }
        throw err;
      }
    },
    [service, loadDataSources, forceUpdate]
  );

  // Connect provider (doesn't add to data sources list)
  const connectProvider = useCallback(
    async (adapterType) => {
      if (isUnmountedRef.current) return;
      
      try {
        setError(null);
        console.log(`Starting provider connection for: ${adapterType}`);

        // Check authentication before connecting provider
        const isAuthenticated = await checkAuthenticationStatus();
        if (isUnmountedRef.current) return;
        
        if (!isAuthenticated && !service.isDemoModeActive()) {
          console.log("User not authenticated, enabling demo mode for provider connection");
          service.enableDemoMode();
        }

        const result = await service.connectProvider(adapterType);
        if (isUnmountedRef.current) return result;
        
        console.log(`${adapterType} provider connected:`, result);
        forceUpdate(); // Trigger re-render for any provider-related UI updates

        return result;
      } catch (err) {
        console.error(`Failed to connect ${adapterType} provider:`, err);
        if (!isUnmountedRef.current) {
          setError(err.message);
        }
        throw err;
      }
    },
    [service, checkAuthenticationStatus, forceUpdate]
  );

  // Disconnect provider (separate from data sources)
  const disconnectProvider = useCallback(
    async (adapterType) => {
      if (isUnmountedRef.current) return;
      
      try {
        setError(null);
        console.log(`Disconnecting ${adapterType} provider...`);

        await service.disconnectProvider(adapterType);
        if (isUnmountedRef.current) return true;
        
        console.log(`${adapterType} provider disconnected`);
        forceUpdate(); // Trigger re-render

        return true;
      } catch (err) {
        console.error(`Failed to disconnect ${adapterType} provider:`, err);
        if (!isUnmountedRef.current) {
          setError(err.message);
        }
        throw err;
      }
    },
    [service, forceUpdate]
  );

  // Check if a provider is connected
  const isProviderConnected = useCallback(
    (adapterType) => {
      return service.isProviderConnected(adapterType);
    },
    [service, updateTrigger] // Include updateTrigger to force re-evaluation
  );

  // Get provider connection info
  const getProviderConnection = useCallback(
    (adapterType) => {
      return service.getProviderConnection(adapterType);
    },
    [service, updateTrigger] // Include updateTrigger to force re-evaluation
  );

  const testConnection = useCallback(
    async (type, config, name) => {
      if (isUnmountedRef.current) return;
      
      try {
        setError(null);
        
        // Check authentication before testing connection
        const isAuthenticated = await checkAuthenticationStatus();
        if (isUnmountedRef.current) return;
        
        if (!isAuthenticated && !service.isDemoModeActive()) {
          console.log("User not authenticated, enabling demo mode for connection test");
          service.enableDemoMode();
        }
        
        return await service.testConnection(type, config, name);
      } catch (err) {
        console.error("Connection test failed:", err);
        if (!isUnmountedRef.current) {
          setError(err.message);
        }
        throw err;
      }
    },
    [service, checkAuthenticationStatus]
  );

  const syncDataSource = useCallback(
    async (sourceId) => {
      if (isUnmountedRef.current) return;
      
      try {
        setError(null);

        const updatedSource = await service.getDataSource(sourceId);
        if (isUnmountedRef.current) return updatedSource;

        // Update the specific source in state and force update
        setDataSources((prev) =>
          prev.map((source) =>
            source.id === sourceId ? { ...source, ...updatedSource } : source
          )
        );
        forceUpdate();

        return updatedSource;
      } catch (err) {
        console.error("Sync failed:", err);
        if (!isUnmountedRef.current) {
          setError(err.message);
        }
        throw err;
      }
    },
    [service, forceUpdate]
  );

  const getDataSource = useCallback(
    async (sourceId) => {
      try {
        return await service.getDataSource(sourceId);
      } catch (err) {
        console.error("Failed to get data source:", err);
        if (!isUnmountedRef.current) {
          setError(err.message);
        }
        throw err;
      }
    },
    [service]
  );

  const refresh = useCallback(() => {
    console.log("Manual refresh triggered");
    return loadDataSources(true);
  }, [loadDataSources]);

  // Handle authentication state changes - this could be called by account management
  const handleAuthenticationChange = useCallback(async (isAuthenticated = null) => {
    if (isUnmountedRef.current) return;
    
    console.log("Authentication state changed, checking status...");
    
    // If authentication status is provided, use it, otherwise check
    const authStatus = isAuthenticated !== null ? isAuthenticated : await checkAuthenticationStatus();
    if (isUnmountedRef.current) return;
    
    if (!authStatus && !service.isDemoModeActive()) {
      console.log("User logged out, enabling demo mode");
      service.enableDemoMode();
      await loadDataSources(false);
      forceUpdate();
    } else if (authStatus && service.isDemoModeActive()) {
      console.log("User logged in, disabling demo mode");
      // Reset the service to use real backend
      resetDataSourceService();
      // The service will be recreated on next access
      await loadDataSources(false);
      forceUpdate();
    }
  }, [service, loadDataSources, checkAuthenticationStatus, forceUpdate]);

  // Load data sources on mount
  useEffect(() => {
    console.log("useDataSources mounted, loading initial data");
    loadDataSources();
  }, [loadDataSources]);

  // Listen for authentication changes from AccountStorage if available
  useEffect(() => {
    const checkAuth = async () => {
      await checkAuthenticationStatus();
    };
    
    checkAuth();
  }, [checkAuthenticationStatus]);

  // Helper functions with updateTrigger dependency for re-computation
  const getSourcesByStatus = useCallback(
    (status) => dataSources.filter((s) => s.status === status),
    [dataSources, updateTrigger]
  );

  const getSourcesByType = useCallback(
    (type) => dataSources.filter((s) => s.type === type),
    [dataSources, updateTrigger]
  );

  const getSourcesByCategory = useCallback(
    (category) =>
      dataSources.filter((source) => {
        const info = getAdapterInfo(source.type);
        return info?.category === category;
      }),
    [dataSources, updateTrigger]
  );

  const getAdapterFilterOptions = useCallback((type) => {
    try {
      const info = getAdapterInfo(type);
      if (info && typeof info.getFilterOptions === "function") {
        return info.getFilterOptions();
      }
      return [];
    } catch (err) {
      console.error("Failed to get adapter filter options:", err);
      return [];
    }
  }, []);

  // Debug function to check current state
  const debugState = useCallback(() => {
    console.log("=== DEBUG STATE ===");
    console.log(
      "dataSources state:",
      dataSources.length,
      dataSources.map((s) => ({ id: s.id, name: s.name }))
    );
    console.log("Authentication status:", authenticationStatus);
    console.log("Demo mode active:", service.isDemoModeActive());
    console.log("Update trigger:", updateTrigger);
    console.log("Is unmounted:", isUnmountedRef.current);
    console.log("==================");
  }, [dataSources, service, authenticationStatus, updateTrigger]);

  const isDemoModeActive = useCallback(() => {
    return service.isDemoModeActive();
  }, [service, updateTrigger]); // Include updateTrigger for consistency

  // Computed values with updateTrigger dependency
  const connectedSources = useMemo(
    () => dataSources.filter((s) => s.status === "connected"),
    [dataSources, updateTrigger]
  );

  const errorSources = useMemo(
    () => dataSources.filter((s) => s.status === "error"),
    [dataSources, updateTrigger]
  );

  return {
    dataSources,
    loading,
    error,
    stats,
    authenticationStatus,
    updateTrigger, // Expose updateTrigger for external use

    // Data source operations
    loadDataSources,
    connectDataSource,
    disconnectDataSource,
    updateDataSource,
    testConnection,
    syncDataSource,
    getDataSource,
    refresh,

    // Provider operations (separate from data sources)
    connectProvider,
    disconnectProvider,
    isProviderConnected,
    getProviderConnection,

    // Authentication handling
    handleAuthenticationChange,
    checkAuthenticationStatus,

    // Helper functions
    getSourcesByStatus,
    getSourcesByType,
    getSourcesByCategory,
    isDemoModeActive,
    getAdapterFilterOptions,
    forceUpdate, // Expose forceUpdate for external triggers

    // Computed values
    connectedSources,
    errorSources,
    totalSources: dataSources.length,

    // Debug helper
    debugState,
  };
};

export default useDataSources;