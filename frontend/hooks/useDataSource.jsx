// TODO: this file can be extended to update the data sources after being notified by the backend (after processing webhook)
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "../utils/api/apiClient";
import { getCurrentUser, fetchAuthSession, signOut } from "aws-amplify/auth";
import DataSourceService from "../services/DataSourceService";
import { getAdapterInfo } from "../adapters/day-book/data-sources/DataAdapterFactory";

// TODO: this would be cleaner imported from apiClient file.
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

// TODO: this would also be cleaner if imported from an AuthService file.
// abstraction allows to change the authentication provider if needed
const createAuthService = () => ({
  getCurrentUser: async () => {
    try {
      const user = await getCurrentUser();
      return {
        userId: user.userId,
        username: user.username,
        email: user.signInDetails?.loginId || user.username,
        attributes: user.attributes || {},
      };
    } catch (error) {
      console.error("Failed to get current user:", error);
      throw new Error("User not authenticated");
    }
  },

  getSession: async () => {
    try {
      const session = await fetchAuthSession();
      return {
        accessToken: session.tokens?.accessToken?.toString(),
        idToken: session.tokens?.idToken?.toString(),
        refreshToken: session.tokens?.refreshToken?.toString(),
        isValid: !!session.tokens?.accessToken,
      };
    } catch (error) {
      console.error("Failed to get auth session:", error);
      throw new Error("Failed to retrieve authentication session");
    }
  },

  getAuthHeaders: async () => {
    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();

      if (!idToken) {
        throw new Error("No valid authentication token found");
      }

      return {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      };
    } catch (error) {
      console.error("Failed to get auth headers:", error);
      throw new Error("Failed to get authentication headers");
    }
  },
  isAuthenticated: async () => {
    try {
      const session = await fetchAuthSession();
      return !!session.tokens?.accessToken;
    } catch (error) {
      return false;
    }
  },

  getUserContext: async () => {
    try {
      const [user, session] = await Promise.all([
        getCurrentUser(),
        fetchAuthSession(),
      ]);

      return {
        user: {
          userId: user.userId,
          username: user.username,
          email: user.signInDetails?.loginId || user.username,
          attributes: user.attributes || {},
        },
        session: {
          accessToken: session.tokens?.accessToken?.toString(),
          idToken: session.tokens?.idToken?.toString(),
          isValid: !!session.tokens?.accessToken,
        },
        isAuthenticated: !!session.tokens?.accessToken,
      };
    } catch (error) {
      console.error("Failed to get user context:", error);
      throw new Error("Failed to get user context");
    }
  },
});


//Singleton !!!!!!!!!
// Global service instance - this is the key change
let globalDataSourceService = null;

const getDataSourceService = () => {
  if (!globalDataSourceService) {
    const apiClient = createApiClient();
    const authService = createAuthService();
    console.log('Creating new DataSourceService instance');
    globalDataSourceService = new DataSourceService(apiClient, authService, { demoMode: true });
  }
  return globalDataSourceService;
};

// Optional: Reset function for testing or logout scenarios
export const resetDataSourceService = () => {
  globalDataSourceService = null;
};

// assuming sources update when notified by backend (webhook)
const useDataSources = () => {
  const [dataSources, setDataSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // Use the global service instance instead of creating a new one
  const service = getDataSourceService({ demoMode: false }); // turn off demo mode TODO: make work for all demo components and functions

  // load all data sources
  const loadDataSources = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);
        setError(null);

        console.log('Loading data sources...');
        const sources = await service.getConnectedDataSources();
        console.log('Loaded sources:', sources.length, sources.map(s => s.id));
        setDataSources(sources);

        const sourceStats = await service.getDataSourceStats();
        setStats(sourceStats);
      } catch (err) {
        console.error("Failed to load data sources:", err);
        setError(err.message);
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [service] // service is now stable across re-renders
  );

  // connect a new data source
  const connectDataSource = useCallback(async (type, config, name) => {
    try {
      setError(null);
      console.log("Before connecting - current sources:", dataSources.length);
      
      const newSource = await service.connectDataSource(type, config, name);
      console.log("New source created:", newSource.id);
      
      // Immediately reload all sources to ensure state is in sync
      await loadDataSources(false); // false = don't show loading spinner
      
      console.log("After connecting - reloaded sources");
      
      return newSource;
    } catch (err) {
      console.error("Failed to connect data source:", err);
      setError(err.message);
      throw err;
    }
  }, [service, dataSources.length, loadDataSources]);

  const disconnectDataSource = useCallback(async (sourceId) => {
    try {
      setError(null);
      console.log("Disconnecting source:", sourceId);
      
      await service.disconnectDataSource(sourceId);
      
      // Reload all sources instead of manual state update
      await loadDataSources(false);
      
      console.log("Source disconnected and list reloaded");
    } catch (err) {
      console.error("Failed to disconnect data source:", err);
      setError(err.message);
      throw err;
    }
  }, [service, loadDataSources]);

  const updateDataSource = useCallback(async (sourceId, updates) => {
    try {
      setError(null);
      const updated = await service.updateDataSource(sourceId, updates);
      
      // Reload all sources to ensure consistency
      await loadDataSources(false);
      
      return updated;
    } catch (err) {
      console.error("Failed to update data source:", err);
      setError(err.message);
      throw err;
    }
  }, [service, loadDataSources]);

  const testConnection = useCallback(async (type, config, name) => {
    try {
      setError(null);
      return await service.testConnection(type, config, name);
    } catch (err) {
      console.error("Connection test failed:", err);
      setError(err.message);
      throw err;
    }
  }, [service]);

  const syncDataSource = useCallback(async (sourceId) => {
    try {
      setError(null);
      
      const updatedSource = await service.getDataSource(sourceId);
      
      // Update the specific source in state
      setDataSources((prev) =>
        prev.map((source) =>
          source.id === sourceId ? { ...source, ...updatedSource } : source
        )
      );
      
      return updatedSource;
    } catch (err) {
      console.error("Sync failed:", err);
      setError(err.message);
      throw err;
    }
  }, [service]);

  const getDataSource = useCallback(async (sourceId) => {
    try {
      return await service.getDataSource(sourceId);
    } catch (err) {
      console.error("Failed to get data source:", err);
      setError(err.message);
      throw err;
    }
  }, [service]);

  const refresh = useCallback(() => {
    console.log('Manual refresh triggered');
    return loadDataSources(true);
  }, [loadDataSources]);

  // Load data sources on mount
  useEffect(() => {
    console.log('useDataSources mounted, loading initial data');
    loadDataSources();
  }, [loadDataSources]);

  // Helper functions
  const getSourcesByStatus = useCallback(status =>
    dataSources.filter(s => s.status === status), [dataSources]);

  const getSourcesByType = useCallback(type =>
    dataSources.filter(s => s.type === type), [dataSources]);

  const getSourcesByCategory = useCallback(category =>
    dataSources.filter(source => {
      const info = getAdapterInfo(source.type);
      return info?.category === category;
    }), [dataSources]);

    
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
    console.log('=== DEBUG STATE ===');
    console.log('dataSources state:', dataSources.length, dataSources.map(s => ({ id: s.id, name: s.name })));
    console.log('service demo sources:', service.getDemoSourcesCount ? service.getDemoSourcesCount() : 'method not available');
    if (service.logDemoSources) service.logDemoSources();
    console.log('==================');
  }, [dataSources, service]);

  const isDemoModeActive = useCallback(() => {
    return service.isDemoModeActive();
  })

  return {
    dataSources,
    loading,
    error,
    stats,

    loadDataSources,
    connectDataSource,
    disconnectDataSource,
    updateDataSource,
    testConnection,
    syncDataSource,
    getDataSource,
    refresh,

    getSourcesByStatus,
    getSourcesByType,
    getSourcesByCategory,
    isDemoModeActive,
    getAdapterFilterOptions,

    connectedSources: dataSources.filter((s) => s.status === "connected"),
    errorSources: dataSources.filter((s) => s.status === "error"),
    totalSources: dataSources.length,

    // Debug helper
    debugState,
  };
};

export default useDataSources;