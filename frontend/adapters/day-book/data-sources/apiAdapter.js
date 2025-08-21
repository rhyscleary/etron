import { delay, validateSourceId, formatDate } from "./baseAdapter";
import { mockDataManager } from "./mockDataManager";
import { demoConfigManager } from "../../../config/demoConfig";

// creates mock data using the centralized mock data manager
const createMockData = (demoConfig) => {
  return mockDataManager.getMockData("custom-api");
};

// generates random response times when network delay simulation is enabled
const getRandomResponseTime = (demoConfig) => {
  if (!demoConfig.behavior.simulateNetworkDelay) {
    return "0ms";
  }
  return `${Math.floor(Math.random() * 500 + 50)}ms`;
};

// retrieves sample data for a specific connection from the mock data manager
const generateSampleDataForConnection = (connection, demoConfig) => {
  const mockData = mockDataManager.getMockData("custom-api");
  return (
    mockData.sampleData[connection.id] || {
      name: connection.name,
      endpoints: [{ path: "/data", method: "GET", data: [] }],
    }
  );
};

// utility functions for parsing and handling API connection data
const parseHeaders = (headersString) => {
  if (!headersString?.trim()) return {};
  try {
    return JSON.parse(headersString);
  } catch (error) {
    console.warn("Failed to parse headers:", error);
    return {};
  }
};

const parseAuthentication = (authString) => {
  if (!authString?.trim()) return null;
  try {
    return JSON.parse(authString);
  } catch (error) {
    console.warn("Failed to parse authentication:", error);
    return null;
  }
};

const applyAuthentication = (config, auth) => {
  if (!auth) return config;

  switch (auth.type) {
    case "bearer":
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${auth.token}`,
      };
      break;
    case "basic":
      const credentials = btoa(`${auth.username}:${auth.password}`);
      config.headers = {
        ...config.headers,
        Authorization: `Basic ${credentials}`,
      };
      break;
    case "apikey":
      config.headers = {
        ...config.headers,
        [auth.key]: auth.value,
      };
      break;
    case "query":
      if (!config.params) config.params = {};
      config.params[auth.key] = auth.value;
      break;
    default:
      console.warn("Unknown authentication type:", auth.type);
  }

  return config;
};

const buildApiUrl = (baseUrl, endpoint, params = {}) => {
  const url = new URL(
    endpoint.startsWith("/") ? endpoint : `/${endpoint}`,
    baseUrl
  );
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  return url.toString();
};

export const createCustomApiAdapter = (
  authService,
  apiClient,
  options = {}
) => {
  const demoConfig =
    options.demoConfig || demoConfigManager.getScopedConfig("apiConnections");

  // The factory MUST decide demoMode; adapter accepts explicit options.demoMode
  // or a transient fallbackTriggered flag. Fall back to scoped demoConfig.isDemo only
  // if neither is provided.
  const fallbackTriggered = !!options.fallbackTriggered;
  // Adapter must respect factory-provided demoMode. Only fall back to true
  // when fallbackTriggered is set. Do NOT read global/apiConnections.isDemo
  // here to decide mode — the factory is the single source-of-truth.
  const isDemoMode =
    options.demoMode !== undefined
      ? options.demoMode
      : fallbackTriggered
      ? true
      : false;

  // Debug: log the effective demoMode option passed to this adapter and any fallback trigger
  console.log(
    "[CustomApiAdapter] effective options.demoMode:",
    options.demoMode,
    "fallbackTriggered:",
    !!options.fallbackTriggered,
    "resolved isDemoMode:",
    isDemoMode
  );

  console.log(
    `Custom API Adapter initialized in ${
      isDemoMode ? "demo" : "production"
    } mode`
  );

  // Add entry log for create
  console.log("[CustomApiAdapter] create entry", {
    isDemoMode,
    demoConfig: demoConfig.isDemo,
  });

  // initialize state
  const mockData = createMockData(demoConfig);
  let connections = [];
  let currentConnection = null;
  let isConnected = false;

  // listen for demo configuration changes
  let configUnsubscribe = null;
  if (demoConfigManager) {
    configUnsubscribe = demoConfigManager.addListener((newConfig) => {
      const newDemoConfig = demoConfigManager.getScopedConfig("apiConnections");
      // Only apply scoped changes (e.g., behavior) to the adapter; do not flip
      // the adapter's demo mode here — that should be handled by the factory.
      if (newDemoConfig && newDemoConfig.behavior) {
        Object.assign(mockData, createMockData(newDemoConfig));
      }
    });
  }

  // simulate network delays based on config
  const simulateDelay = async (operation = "default") => {
    if (!demoConfig.behavior.simulateNetworkDelay) return;

    const delays = {
      connect: [800, 1500],
      test: [1000, 2500],
      fetch: [200, 1000],
      default: [300, 800],
    };

    const [min, max] = delays[operation] || delays.default;
    const delay = Math.random() * (max - min) + min;
    await new Promise((resolve) => setTimeout(resolve, delay));
  };

  // simulate errors based on config
  const maybeSimulateError = (operation = "default") => {
    if (!demoConfig.behavior.simulateErrors) return;

    const errorRates = {
      connect: 0.1,
      test: 0.15,
      fetch: 0.05,
      default: 0.08,
    };

    const rate = errorRates[operation] || errorRates.default;
    if (Math.random() < rate) {
      const errors = [
        "Network timeout occurred",
        "Connection refused by server",
        "Authentication failed",
        "Rate limit exceeded",
        "Service temporarily unavailable",
      ];
      throw new Error(errors[Math.floor(Math.random() * errors.length)]);
    }
  };

  const connectDemo = async (connectionData) => {
    console.log("[CustomApiAdapter] connectDemo entry", { connectionData });
    await simulateDelay("connect");
    maybeSimulateError("connect");

    // find or create a demo connection
    const demoConnection = mockData.connections.find(
      (conn) =>
        conn.url === connectionData.url || conn.name === connectionData.name
    ) || {
      id: `api_${Date.now()}`,
      name: connectionData.name,
      url: connectionData.url,
      status: "active",
      createdAt: new Date().toISOString(),
      lastTested: new Date().toISOString(),
      headers: connectionData.headers || "{}",
      authentication: connectionData.authentication || "",
      testResult: {
        status: "connected",
        responseTime: getRandomResponseTime(demoConfig),
        statusCode: 200,
        contentType: "application/json",
      },
    };

    currentConnection = demoConnection;
    connections = [
      demoConnection,
      ...mockData.connections.filter((c) => c.id !== demoConnection.id),
    ];
    isConnected = true;

    console.log(`Demo API connection established: ${demoConnection.name}`);

    return {
      connected: true,
      connection: currentConnection,
      isDemoMode: true,
    };
  };

  const connect = async (connectionData) => {
    console.log("[CustomApiAdapter] connect called", { isDemoMode });
    if (isDemoMode) {
      return connectDemo(connectionData);
    }

    try {
      if (!connectionData || !connectionData.url || !connectionData.name) {
        throw new Error("Connection data with URL and name is required");
      }

      const testResult = await testConnection(
        connectionData.url,
        connectionData.headers,
        connectionData.authentication
      );

      if (testResult.status !== "connected") {
        throw new Error("Connection test failed");
      }

      // In real implementation, this would call the actual API
      const newConnection = {
        id: `api_${Date.now()}`,
        name: connectionData.name,
        url: connectionData.url,
        status: "active",
        createdAt: new Date().toISOString(),
        lastTested: new Date().toISOString(),
        headers: connectionData.headers || "{}",
        authentication: connectionData.authentication || "",
        testResult,
      };

      currentConnection = newConnection;
      connections = [newConnection, ...connections];
      isConnected = true;

      console.log(`Real API connection established: ${newConnection.name}`);

      return {
        connected: true,
        connection: currentConnection,
      };
    } catch (error) {
      // Fallback to demo mode if enabled
      if (demoConfig.fallback.enableOnApiFailure) {
        console.log(
          "Custom API connection failed, falling back to demo mode",
          error.message
        );
        return connectDemo(connectionData);
      }
      throw error;
    }
  };

  const disconnect = async () => {
    try {
      await simulateDelay("disconnect");

      const wasConnected = isConnected;
      const connectionName = currentConnection?.name;

      currentConnection = null;
      connections = [];
      isConnected = false;

      if (wasConnected) {
        console.log(`Disconnected from API: ${connectionName}`);
      }

      return { connected: true };
    } catch (error) {
      throw new Error(`Failed to disconnect: ${error.message}`);
    }
  };

  // tests API connections with configurable demo behavior and error simulation
  const testConnection = async (url, headers = "", authentication = "") => {
    console.log("[CustomApiAdapter] testConnection called", { url });
    if (isDemoMode) {
      await simulateDelay("test");
      maybeSimulateError("test");

      const isConnectionSuccessful = Math.random() > 0.02; // 98% success rate in demo

      if (isConnectionSuccessful) {
        return {
          status: "connected",
          responseTime: getRandomResponseTime(demoConfig),
          statusCode: 200,
          contentType: "application/json",
          sampleData: {
            message: "Demo API connection successful",
            timestamp: new Date().toISOString(),
            endpoints: ["/data", "/users", "/status"],
            demoMode: true,
          },
        };
      } else {
        throw new Error("Demo connection test failed: Simulated network error");
      }
    }

    try {
      const parsedHeaders = parseHeaders(headers);
      const auth = parseAuthentication(authentication);

      let config = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...parsedHeaders,
        },
        timeout: 10000,
      };

      config = applyAuthentication(config, auth);

      // In real implementation, would make actual HTTP request
      await simulateDelay("test");

      return {
        status: "connected",
        responseTime: "245ms",
        statusCode: 200,
        contentType: "application/json",
        sampleData: {
          message: "API connection successful",
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      // Fallback to demo mode if enabled
      if (demoConfig.fallback.enableOnApiFailure) {
        console.log(
          "Real connection test failed, falling back to demo",
          error.message
        );
        // Return a demo-style successful test result instead of recursing
        try {
          await simulateDelay("test");
          maybeSimulateError("test");
          return {
            status: "connected",
            responseTime: getRandomResponseTime(demoConfig),
            statusCode: 200,
            contentType: "application/json",
            sampleData: {
              message: "Demo API connection successful (fallback)",
              timestamp: new Date().toISOString(),
              endpoints: ["/data", "/users", "/status"],
              demoMode: true,
            },
          };
        } catch (demoErr) {
          throw new Error(`Demo fallback failed: ${demoErr.message}`);
        }
      }
      throw new Error(`Connection test failed: ${error.message}`);
    }
  };

  // discovers available API endpoints and returns them as data sources
  const getDataSources = async () => {
    console.log("[CustomApiAdapter] getDataSources called", {
      isConnected,
      isDemoMode,
    });
    if (!isConnected) {
      throw new Error("Not connected to any API");
    }

    if (isDemoMode) {
      await simulateDelay("fetch");
      maybeSimulateError("fetch");

      const mockConnection = mockData.sampleData[currentConnection.id];
      if (mockConnection?.endpoints) {
        return mockConnection.endpoints.map((endpoint) => ({
          id: `${currentConnection.id}_${endpoint.path.replace("/", "")}`,
          name: `${endpoint.method} ${endpoint.path}`,
          path: endpoint.path,
          method: endpoint.method,
          type: "endpoint",
          lastModified: currentConnection.lastTested,
          url: `${currentConnection.url}${endpoint.path}`,
          recordCount: endpoint.data?.length || 0,
          demoMode: true,
        }));
      }
    }

    // Real implementation would discover actual endpoints
    return [
      {
        id: `${currentConnection.id}_default`,
        name: `${currentConnection.name} - Default Endpoint`,
        path: "/",
        method: "GET",
        type: "endpoint",
        lastModified: currentConnection.lastTested,
        url: currentConnection.url,
      },
    ];
  };

  // fetches raw data from API endpoints with fallback to demo data
  const fetchRawData = async (endpoint = "/", method = "GET", params = {}) => {
    console.log("[CustomApiAdapter] fetchRawData called", {
      endpoint,
      method,
      isDemoMode,
    });
    if (!isConnected) {
      throw new Error("Not connected to any API");
    }

    if (isDemoMode) {
      await simulateDelay("fetch");
      maybeSimulateError("fetch");

      const endpointName = endpoint.replace("/", "");
      const mockConnection = mockData.sampleData[currentConnection.id];

      if (mockConnection) {
        const mockEndpoint = mockConnection.endpoints.find(
          (ep) =>
            ep.path.replace("/", "") === endpointName || ep.path === endpoint
        );

        if (mockEndpoint) {
          return {
            data: mockEndpoint.data,
            statusCode: 200,
            headers: {
              "content-type": "application/json",
              "x-demo-mode": "true",
              "x-response-time": getRandomResponseTime(demoConfig),
            },
            responseTime: parseInt(getRandomResponseTime(demoConfig)),
          };
        }
      }

      // Fallback demo data
      return {
        data: generateGenericData(demoConfig),
        statusCode: 200,
        headers: {
          "content-type": "application/json",
          "x-demo-mode": "true",
        },
        responseTime: parseInt(getRandomResponseTime(demoConfig)),
      };
    }

    try {
      const parsedHeaders = parseHeaders(currentConnection.headers);
      const auth = parseAuthentication(currentConnection.authentication);

      let config = {
        method,
        headers: {
          "Content-Type": "application/json",
          ...parsedHeaders,
        },
        timeout: 30000,
      };

      config = applyAuthentication(config, auth);

      if (method === "GET" && Object.keys(params).length > 0) {
        config.params = params;
      } else if (["POST", "PUT", "PATCH"].includes(method)) {
        config.data = params;
      }

      const url = buildApiUrl(currentConnection.url, endpoint, config.params);

      // In real implementation, would make actual HTTP request
      // For now, fallback to demo data
      console.log(
        "Real API call would be made here, falling back to demo data"
      );
      return fetchRawData(endpoint, method, params);
    } catch (error) {
      // Fallback to demo data if enabled
      if (demoConfig.fallback.enableOnApiFailure) {
        console.log(
          "Real API call failed, falling back to demo data",
          error.message
        );
        const demoOptions = { ...options, demoMode: true, demoConfig };
        // Adapter factory signature is (authService, apiClient, options)
        const demoAdapter = createCustomApiAdapter(null, null, demoOptions);
        return demoAdapter.fetchRawData(endpoint, method, params);
      }
      throw error;
    }
  };

  const getConnectionInfo = () => ({
    isConnected,
    connection: currentConnection,
    provider: "Custom API",
    dataSourceCount: connections.length,
    isDemoMode: isDemoMode,
    demoConfig: isDemoMode
      ? demoConfig
      : null
      ? {
          simulateNetworkDelay: demoConfig.behavior.simulateNetworkDelay,
          simulateErrors: demoConfig.behavior.simulateErrors,
          showDemoIndicators: demoConfig.behavior.showDemoIndicators,
        }
      : null,
  });

  const switchConnection = async (connectionId) => {
    await simulateDelay("connect");

    const connection = connections.find((c) => c.id === connectionId);
    if (!connection) {
      throw new Error("Connection not found");
    }

    currentConnection = connection;
    isConnected = true;

    console.log(`Switched to connection: ${connection.name}`);
    return { connected: true, connection };
  };

  const updateConnection = async (connectionId, updates) => {
    if (isDemoMode || demoConfig.isDemo) {
      await simulateDelay("update");
      maybeSimulateError("update");

      const connectionIndex = connections.findIndex(
        (c) => c.id === connectionId
      );
      if (connectionIndex !== -1) {
        connections[connectionIndex] = {
          ...connections[connectionIndex],
          ...updates,
          lastTested: new Date().toISOString(),
        };
        if (currentConnection && currentConnection.id === connectionId) {
          currentConnection = connections[connectionIndex];
        }
        console.log(`Updated connection: ${connections[connectionIndex].name}`);
      }
      return { connected: true };
    }

    // Real implementation would update via API
    return { connected: true };
  };

  const deleteConnection = async (connectionId) => {
    if (isDemoMode || demoConfig.isDemo) {
      await simulateDelay("delete");

      const connectionToDelete = connections.find((c) => c.id === connectionId);
      connections = connections.filter((c) => c.id !== connectionId);

      if (currentConnection && currentConnection.id === connectionId) {
        currentConnection = null;
        isConnected = false;
      }

      console.log(`Deleted connection: ${connectionToDelete?.name}`);
      return { connected: true };
    }

    // Real implementation would delete via API
    return { connected: true };
  };

  const filterDataSources = (query, dataSources = []) => {
    if (!query) return dataSources;
    return dataSources.filter(
      (source) =>
        source.name.toLowerCase().includes(query.toLowerCase()) ||
        source.path.toLowerCase().includes(query.toLowerCase()) ||
        source.type.toLowerCase().includes(query.toLowerCase())
    );
  };

  // returns current demo mode status and configuration for UI display
  const getDemoStatus = () => ({
    isDemoActive: isDemoMode || demoConfig.isDemo,
    config: demoConfig,
    showIndicators: demoConfig.behavior.showDemoIndicators,
    connectionCount: connections.length,
  });

  // cleans up resources and event listeners when adapter is destroyed
  const destroy = () => {
    if (configUnsubscribe) {
      configUnsubscribe();
    }
    currentConnection = null;
    connections = [];
    isConnected = false;
    console.log("Custom API Adapter destroyed");
  };

  return {
    // primary methods for managing API connections
    connect,
    disconnect,
    testConnection,
    isConnected: () => isConnected,
    getConnectionInfo,
    switchConnection,
    updateConnection,
    deleteConnection,

    // methods for discovering and fetching data from API endpoints
    getDataSources,
    filterDataSources,
    fetchRawData,

    // helper functions for parsing and building API requests
    parseHeaders,
    parseAuthentication,
    applyAuthentication,
    buildApiUrl,
    formatDate,

    // methods for managing demo mode behavior and status
    getDemoStatus,
    simulateDelay,

    // resource cleanup method
    destroy,
  };
};
