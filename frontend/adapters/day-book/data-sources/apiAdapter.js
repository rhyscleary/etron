import { delay, validateSourceId, formatDate } from "./baseAdapter";

// mock data for demo
const createMockData = () => ({
  connections: [
    {
      id: "api_1642105600000",
      name: "JSONPlaceholder API",
      url: "https://jsonplaceholder.typicode.com",
      status: "active",
      createdAt: "2024-01-15T10:30:00Z",
      lastTested: "2024-01-15T10:30:00Z",
      headers: '{"Content-Type": "application/json"}',
      authentication: "",
      testResult: {
        status: "success",
        responseTime: "245ms",
        statusCode: 200,
        contentType: "application/json",
      },
    },
    {
      id: "api_1642109200000",
      name: "Weather API",
      url: "https://api.openweathermap.org/data/2.5",
      status: "active",
      createdAt: "2024-01-16T11:30:00Z",
      lastTested: "2024-01-16T11:30:00Z",
      headers: '{"Accept": "application/json"}',
      authentication: '{"type": "query", "key": "appid", "value": "demo_key"}',
      testResult: {
        status: "success",
        responseTime: "180ms",
        statusCode: 200,
        contentType: "application/json",
      },
    },
  ],
  sampleData: {
    api_1642105600000: {
      name: "JSONPlaceholder API",
      endpoints: [
        {
          path: "/posts",
          method: "GET",
          data: [
            {
              id: 1,
              title: "Sample Post 1",
              body: "Sample content 1",
              userId: 1,
            },
            {
              id: 2,
              title: "Sample Post 2",
              body: "Sample content 2",
              userId: 1,
            },
            {
              id: 3,
              title: "Sample Post 3",
              body: "Sample content 3",
              userId: 2,
            },
          ],
        },
        {
          path: "/users",
          method: "GET",
          data: [
            {
              id: 1,
              name: "John Doe",
              email: "john@example.com",
              username: "johndoe",
            },
            {
              id: 2,
              name: "Jane Smith",
              email: "jane@example.com",
              username: "janesmith",
            },
          ],
        },
      ],
    },
    api_1642109200000: {
      name: "Weather API",
      endpoints: [
        {
          path: "/weather",
          method: "GET",
          data: [
            {
              city: "London",
              temperature: 15,
              humidity: 65,
              description: "Cloudy",
            },
            {
              city: "New York",
              temperature: 22,
              humidity: 45,
              description: "Sunny",
            },
            {
              city: "Tokyo",
              temperature: 18,
              humidity: 70,
              description: "Rainy",
            },
          ],
        },
      ],
    },
  },
});

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
  const isDemoMode =
    options.demoMode ||
    options.fallbackToDemo ||
    (typeof __DEV__ !== "undefined" ? __DEV__ : false);
  const mockData = createMockData();
  const endpoints = options.endpoints || {};

  let connections = [];
  let currentConnection = null;
  let isConnected = false;

  const connectDemo = async (connectionData) => {
    await delay(1000);

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
        status: "success",
        responseTime: "245ms",
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

    return {
      success: true,
      connection: currentConnection,
      isDemoMode: true,
    };
  };

  const connect = async (connectionData) => {
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

      if (testResult.status !== "success") {
        throw new Error("Connection test failed");
      }

      // create the connection via API
      // TODO: Uncomment when backend is ready
      /*
      const response = await apiClient.post(endpoint.create, {
        name: connectionData.name,
        url: connectionData.url,
        headers: connectionData.headers,
        authentication: connectionData.authentication,
        testResult
      });
      const newConnection = await response.json();
      */

      // mock response
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

      return {
        success: true,
        connection: currentConnection,
      };
    } catch (error) {
      console.log("Custom API connection failed, falling back to demo mode");
      options.demoMode = true;
      return connectDemo(connectionData);
    }
  };

  const disconnect = async () => {
    try {
      currentConnection = null;
      connections = [];
      isConnected = false;

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to disconnect: ${error.message}`);
    }
  };

  const testConnection = async (url, headers = "", authentication = "") => {
    if (isDemoMode) {
      await delay(2000);
      const isSuccess = Math.random() > 0.2; // fake success rate

      if (isSuccess) {
        return {
          status: "success",
          responseTime: `${Math.floor(Math.random() * 300 + 100)}ms`,
          statusCode: 200,
          contentType: "application/json",
          sampleData: {
            message: "API connection successful",
            timestamp: new Date().toISOString(),
            endpoints: ["/data", "/users", "/status"],
          },
        };
      } else {
        throw new Error("Connection failed: Unable to reach the API endpoint");
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

      // TODO: use when needed
      /*
      const response = await apiClient.request(url, config);
      
      return {
        status: "success",
        responseTime: `${response.responseTime}ms`,
        statusCode: response.status,
        contentType: response.headers['content-type'] || 'unknown',
        sampleData: response.data
      };
      */

      // mock response
      await delay(2000);
      return {
        status: "success",
        responseTime: "245ms",
        statusCode: 200,
        contentType: "application/json",
        sampleData: {
          message: "API connection successful",
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw new Error(`Connection test failed: ${error.message}`);
    }
  };

  const getDataSources = async () => {
    if (!isConnected) {
      throw new Error("Not connected to any API");
    }

    if (isDemoMode) {
      await delay(800);
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
        }));
      }
    }

    // TODO: let user select endpoints
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

  const getData = async (sourceId, options = {}) => {
    validateSourceId(sourceId);

    if (!isConnected) {
      throw new Error("Not connected to any API");
    }

    if (isDemoMode) {
      await delay(800);

      const [connectionId, endpointName] = sourceId.split("_");
      const mockConnection = mockData.sampleData[connectionId];

      if (mockConnection) {
        const endpoint = mockConnection.endpoints.find(
          (ep) => ep.path.replace("/", "") === endpointName
        );

        if (endpoint) {
          return {
            id: sourceId,
            name: `${mockConnection.name} - ${endpoint.path}`,
            data: endpoint.data,
            headers:
              endpoint.data.length > 0 ? Object.keys(endpoint.data[0]) : [],
            metadata: {
              endpoint: endpoint.path,
              method: endpoint.method,
              lastUpdated: new Date().toISOString(),
              isDemoData: true,
              connectionId: currentConnection.id,
            },
          };
        }
      }

      return {
        id: sourceId,
        name: "Demo API Data",
        data: [
          { id: 1, name: "Item 1", value: 100 },
          { id: 2, name: "Item 2", value: 200 },
          { id: 3, name: "Item 3", value: 300 },
        ],
        headers: ["id", "name", "value"],
        metadata: {
          lastUpdated: new Date().toISOString(),
          isDemoData: true,
        },
      };
    }

    try {
      const { endpoint = "/", method = "GET", params = {} } = options;
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

      // TODO: uncomment when backend is ready
      /*
      const response = await apiClient.request(url, config);
      const responseData = response.data;
      
      // Convert response to standardized format
      let data = [];
      let headers = [];
      
      if (Array.isArray(responseData)) {
        data = responseData;
        headers = data.length > 0 ? Object.keys(data[0]) : [];
      } else if (typeof responseData === 'object') {
        data = [responseData];
        headers = Object.keys(responseData);
      }
      
      return {
        id: sourceId,
        name: `${currentConnection.name} - ${endpoint}`,
        data,
        headers,
        metadata: {
          endpoint,
          method,
          statusCode: response.status,
          lastUpdated: new Date().toISOString(),
          connectionId: currentConnection.id
        }
      };
      */

      return getData(sourceId, { ...options, demoMode: true });
    } catch (error) {
      console.log("Real API call failed, falling back to demo data");
      return getData(sourceId, { ...options, demoMode: true });
    }
  };

  const getConnectionInfo = () => ({
    isConnected,
    connection: currentConnection,
    provider: "Custom API",
    dataSourceCount: connections.length,
    isDemoMode: isDemoMode || options.demoMode,
  });

  const switchConnection = async (connectionId) => {
    const connection = connections.find((c) => c.id === connectionId);
    if (!connection) {
      throw new Error("Connection not found");
    }

    currentConnection = connection;
    isConnected = true;

    return { success: true, connection };
  };

  const updateConnection = async (connectionId, updates) => {
    if (isDemoMode) {
      await delay(500);
      const connectionIndex = connections.findIndex(
        (c) => c.id === connectionId
      );
      if (connectionIndex !== -1) {
        connections[connectionIndex] = {
          ...connections[connectionIndex],
          ...updates,
        };
        if (currentConnection && currentConnection.id === connectionId) {
          currentConnection = connections[connectionIndex];
        }
      }
      return { success: true };
    }

    // TODO: backen update logic
    /*
    const response = await apiClient.put(`${endpoints.update}/${connectionId}`, updates);
    return await response.json();
    */

    return { success: true };
  };

  const deleteConnection = async (connectionId) => {
    if (isDemoMode) {
      await delay(500);
      connections = connections.filter((c) => c.id !== connectionId);
      if (currentConnection && currentConnection.id === connectionId) {
        currentConnection = null;
        isConnected = false;
      }
      return { success: true };
    }

    // TODO: backend delete logic
    /*
    const response = await apiClient.delete(`${endpoints.delete}/${connectionId}`);
    return await response.json();
    */

    return { success: true };
  };

  const filterDataSources = (query, dataSources = []) => {
    if (!query) return dataSources;
    return dataSources.filter(
      (source) =>
        source.name.toLowerCase().includes(query.toLowerCase()) ||
        source.path.toLowerCase().includes(query.toLowerCase())
    );
  };

  return {
    connect,
    disconnect,
    testConnection,
    getDataSources,
    getData,
    isConnected: () => isConnected,
    getConnectionInfo,
    switchConnection,
    updateConnection,
    deleteConnection,
    filterDataSources,
    formatDate,
  };
};
