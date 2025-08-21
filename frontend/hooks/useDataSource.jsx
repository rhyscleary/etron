// TODO: this file can be extended to update the data sources after being notified by the backend (after processing webhook)
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "../utils/api/apiClient";
import DataSourceService from "../services/DataSourceService";
import { getAdapterInfo } from "../adapters/day-book/data-sources/DataAdapterFactory";
import AuthService from "../services/AuthService";

const createApiClient = () => ({
  get: async (path, config = {}) => ({ data: await apiGet(path, config.params || {}) }),
  post: async (path, body = {}) => ({ data: await apiPost(path, body) }),
  put: async (path, body = {}) => ({ data: await apiPut(path, body) }),
  delete: async (path) => ({ data: await apiDelete(path) }),
  request: async (url, config = {}) => {
    const method = (config.method || "GET").toLowerCase();
    const data = config.data || {};
    const params = config.params || {};
    let responseData;
    switch (method) {
      case "post": responseData = await apiPost(url, data); break;
      case "put": responseData = await apiPut(url, data); break;
      case "delete": responseData = await apiDelete(url, params); break;
      default: responseData = await apiGet(url, params);
    }
    return {
      data: responseData,
      status: 200,
      headers: { "content-type": "application/json" },
      responseTime: "200ms",
    };
  },
});

// Singleton DataSourceService
let globalDataSourceService = null;
const getDataSourceService = (options = {}) => {
  if (!globalDataSourceService) {
    const apiClient = createApiClient();
    globalDataSourceService = new DataSourceService(apiClient, {
      demoMode: options.demoMode,
      ...options,
    });
  }
  return globalDataSourceService;
};
export const resetDataSourceService = () => {
  globalDataSourceService = null;
};

// Main hook
const useDataSources = (options = {}) => {
  const [dataSources, setDataSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [authenticationStatus, setAuthenticationStatus] = useState("checking");
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const isUnmountedRef = useRef(false);
  const lastLoadTimeRef = useRef(0);
  const loadingOperationRef = useRef(null);

  const forceUpdate = useCallback(() => setUpdateTrigger((prev) => prev + 1), []);

  const service = useMemo(() => {
    if (globalDataSourceService) {
      const currentDemoMode = globalDataSourceService.isDemoModeActive();
      const newDemoMode = options.demoMode;
      if (currentDemoMode !== newDemoMode) {
        console.log('[useDataSources] Demo mode changed, updating service config:', currentDemoMode, '->', newDemoMode);
        // Instead of resetting, update the existing service
        globalDataSourceService.refreshFromCentralizedConfig();
      }
    }
    return getDataSourceService(options);
  }, [options.demoMode]);

  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
    };
  }, []);

  const checkAuthenticationStatus = useCallback(async () => {
    if (isUnmountedRef.current) return false;
    try {
      const isAuthenticated = await AuthService.isAuthenticated();
      if (!isUnmountedRef.current) {
        setAuthenticationStatus(isAuthenticated ? "authenticated" : "unauthenticated");
      }
      return isAuthenticated;
    } catch {
      if (!isUnmountedRef.current) setAuthenticationStatus("error");
      return false;
    }
  }, []);

  const loadDataSources = useCallback(
    async (showLoading = true) => {
      if (isUnmountedRef.current) return;
      if (loadingOperationRef.current) return await loadingOperationRef.current;

      const loadPromise = (async () => {
        try {
          const startTime = Date.now();
          lastLoadTimeRef.current = startTime;
          if (showLoading && !isUnmountedRef.current) setLoading(true);
          if (!isUnmountedRef.current) setError(null);

          const isAuthenticated = await checkAuthenticationStatus();
          if (isUnmountedRef.current) return;

          // Demo mode is now managed centrally by AppContext

          const [sources, sourceStats] = await Promise.all([
            service.getConnectedDataSources(),
            service.getDataSourceStats(),
          ]);

          console.log('[useDataSources] Loaded data sources:', sources.length, 'sources');
          console.log('[useDataSources] Source details:', sources.map(s => ({ id: s.id, type: s.type, name: s.name })));
          console.log('[useDataSources] Source stats:', sourceStats);
          
          // Log each individual data source
          console.log('[useDataSources] Individual data sources:');
          sources.forEach((source, index) => {
            console.log(`  [${index + 1}] ID: ${source.id}, Type: ${source.type}, Name: ${source.name}, Status: ${source.status}`);
          });

          if (!isUnmountedRef.current) {
            // Only update if this is the most recent load operation
            if (lastLoadTimeRef.current <= startTime) {
              setDataSources(sources);
              setStats(sourceStats);
              setLoading(false);
              console.log('[useDataSources] State updated - dataSources count:', sources.length);
            } else {
              console.log('[useDataSources] Skipping state update - newer operation in progress');
            }
          }
        } catch (err) {
          if (isUnmountedRef.current) return;
          if (err.message?.includes("authentication") || err.message?.includes("token")) {
            // Demo mode fallback is handled by DataSourceService based on centralized config
            try {
              const [sources, sourceStats] = await Promise.all([
                service.getConnectedDataSources(),
                service.getDataSourceStats(),
              ]);
              if (!isUnmountedRef.current) {
                setDataSources(sources);
                setStats(sourceStats);
                setError(null);
              }
            } catch (demoErr) {
              if (!isUnmountedRef.current) setError(demoErr.message);
            }
          } else {
            if (!isUnmountedRef.current) setError(err.message);
          }
        } finally {
          loadingOperationRef.current = null;
          if (showLoading && !isUnmountedRef.current) setLoading(false);
        }
      })();

      loadingOperationRef.current = loadPromise;
      return loadPromise;
    },
    [service, checkAuthenticationStatus]
  );

  const connectDataSource = useCallback(
    async (type, config, name) => {
      if (isUnmountedRef.current) return;
      try {
        console.log('[useDataSources] Connecting data source:', { type, name, config });
        setError(null);
        const isAuthenticated = await checkAuthenticationStatus();
        if (isUnmountedRef.current) return;
        
        const newSource = await service.connectDataSource(type, config, name);
        console.log('[useDataSources] Data source connected successfully:', newSource);
        
        if (isUnmountedRef.current) return newSource;
        
        // Optimistically update the state first
        setDataSources(prev => {
          const existingIndex = prev.findIndex(s => s.id === newSource.id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = newSource;
            return updated;
          }
          return [...prev, newSource];
        });
        
        // Then reload to ensure consistency (but with a delay to avoid race conditions)
        setTimeout(() => {
          if (!isUnmountedRef.current) {
            loadDataSources(false);
          }
        }, 100);
        
        forceUpdate();
        return newSource;
      } catch (err) {
        if (!isUnmountedRef.current) setError(err.message);
        throw err;
      }
    },
    [service, loadDataSources, checkAuthenticationStatus, forceUpdate]
  );

  const disconnectDataSource = useCallback(
    async (sourceId) => {
      if (isUnmountedRef.current) return;
      try {
        console.log('[useDataSources] Disconnecting data source:', sourceId);
        setError(null);
        await service.disconnectDataSource(sourceId);
        console.log('[useDataSources] Data source disconnected successfully:', sourceId);
        if (isUnmountedRef.current) return;
        await loadDataSources(false);
        forceUpdate();
      } catch (err) {
        if (!isUnmountedRef.current) setError(err.message);
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
        await loadDataSources(false);
        forceUpdate();
        return updated;
      } catch (err) {
        if (!isUnmountedRef.current) setError(err.message);
        throw err;
      }
    },
    [service, loadDataSources, forceUpdate]
  );

  const connectProvider = useCallback(
    async (adapterType) => {
      if (isUnmountedRef.current) return;
      try {
        setError(null);
        const isAuthenticated = await checkAuthenticationStatus();
        if (isUnmountedRef.current) return;
        // Demo mode is now managed centrally by AppContext
        const result = await service.connectProvider(adapterType);
        if (isUnmountedRef.current) return result;
        forceUpdate();
        return result;
      } catch (err) {
        if (!isUnmountedRef.current) setError(err.message);
        throw err;
      }
    },
    [service, checkAuthenticationStatus, forceUpdate]
  );

  const disconnectProvider = useCallback(
    async (adapterType) => {
      if (isUnmountedRef.current) return;
      try {
        setError(null);
        await service.disconnectProvider(adapterType);
        if (isUnmountedRef.current) return true;
        forceUpdate();
        return true;
      } catch (err) {
        if (!isUnmountedRef.current) setError(err.message);
        throw err;
      }
    },
    [service, forceUpdate]
  );

  const isProviderConnected = useCallback(
    (adapterType) => service.isProviderConnected(adapterType),
    [service, updateTrigger]
  );

  const getProviderConnection = useCallback(
    (adapterType) => service.getProviderConnection(adapterType),
    [service, updateTrigger]
  );

  const testConnection = useCallback(
    async (type, config, name) => {
      if (isUnmountedRef.current) return;
      try {
        setError(null);
        const isAuthenticated = await checkAuthenticationStatus();
        if (isUnmountedRef.current) return;
        // Demo mode is now managed centrally by AppContext
        return await service.testConnection(type, config, name);
      } catch (err) {
        if (!isUnmountedRef.current) setError(err.message);
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
        setDataSources((prev) =>
          prev.map((source) =>
            source.id === sourceId ? { ...source, ...updatedSource } : source
          )
        );
        forceUpdate();
        return updatedSource;
      } catch (err) {
        if (!isUnmountedRef.current) setError(err.message);
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
        if (!isUnmountedRef.current) setError(err.message);
        throw err;
      }
    },
    [service]
  );

  const refresh = useCallback(() => loadDataSources(true), [loadDataSources]);

  const handleAuthenticationChange = useCallback(
    async (isAuthenticated = null) => {
      if (isUnmountedRef.current) return;
      const authStatus =
        isAuthenticated !== null ? isAuthenticated : await checkAuthenticationStatus();
      if (isUnmountedRef.current) return;
      // Demo mode changes are handled by AppContext and service config listener
      // Just reload data sources to reflect the current demo state
      await loadDataSources(false);
      forceUpdate();
    },
    [service, loadDataSources, checkAuthenticationStatus, forceUpdate]
  );

  let loadDebounceTimer = null;
  const debouncedLoadDataSources = useCallback(
    (showLoading = true, delay = 250) => {
      if (loadDebounceTimer) {
        clearTimeout(loadDebounceTimer);
      }
      
      loadDebounceTimer = setTimeout(() => {
        loadDataSources(showLoading);
        loadDebounceTimer = null;
      }, delay);
    },
    [loadDataSources]
  );

  useEffect(() => {
    loadDataSources();
  }, [loadDataSources]);

  useEffect(() => {
    checkAuthenticationStatus();
  }, [checkAuthenticationStatus]);

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
    } catch {
      return [];
    }
  }, []);

  const debugState = useCallback(() => {
    // Only for debugging
    // console.log("dataSources:", dataSources, "auth:", authenticationStatus, "demo:", service.isDemoModeActive());
  }, [dataSources, service, authenticationStatus, updateTrigger]);

  const isDemoModeActive = useCallback(
    () => service.isDemoModeActive(),
    [service, updateTrigger]
  );

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
    updateTrigger,
    loadDataSources,
    connectDataSource,
    disconnectDataSource,
    updateDataSource,
    testConnection,
    syncDataSource,
    getDataSource,
    refresh,
    connectProvider,
    disconnectProvider,
    isProviderConnected,
    getProviderConnection,
    handleAuthenticationChange,
    checkAuthenticationStatus,
    getSourcesByStatus,
    getSourcesByType,
    getSourcesByCategory,
    isDemoModeActive,
    getAdapterFilterOptions,
    forceUpdate,
    connectedSources,
    errorSources,
    totalSources: dataSources.length,
    debugState,
  };
};

export default useDataSources;
