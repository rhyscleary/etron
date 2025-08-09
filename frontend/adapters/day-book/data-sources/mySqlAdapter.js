import { delay, validateSourceId, formatDate } from "./baseAdapter";

// mock data for demo mode
const createMockData = () => ({
  connections: [
    {
      id: "mysql_1642105600000",
      name: "Local MySQL",
      host: "localhost",
      port: 3306,
      username: "root",
      database: "demo_db",
      status: "active",
      createdAt: "2024-01-15T10:30:00Z",
      lastTested: "2024-01-15T10:30:00Z",
      password: "",
      testResult: {
        status: "success",
        responseTime: "120ms",
        statusCode: 200,
        contentType: "mysql",
      },
    },
    {
      id: "mysql_1642109200000",
      name: "Remote MySQL",
      host: "remote.example.com",
      port: 3306,
      username: "admin",
      database: "weather_db",
      status: "active",
      createdAt: "2024-01-16T11:30:00Z",
      lastTested: "2024-01-16T11:30:00Z",
      password: "",
      testResult: {
        status: "success",
        responseTime: "180ms",
        statusCode: 200,
        contentType: "mysql",
      },
    },
  ],
  sampleData: {
    mysql_1642105600000: {
      name: "Local MySQL",
      tables: [
        {
          name: "posts",
          columns: ["id", "title", "body", "userId"],
          rows: [
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
          name: "users",
          columns: ["id", "name", "email", "username"],
          rows: [
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
    mysql_1642109200000: {
      name: "Remote MySQL",
      tables: [
        {
          name: "weather",
          columns: ["city", "temperature", "humidity", "description"],
          rows: [
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

const parseConnectionConfig = (config) => {
  if (!config) return {};
  return {
    host: config.host || "localhost",
    port: config.port || 3306,
    username: config.username || "root",
    password: config.password || "",
    database: config.database || "",
  };
};

export const createMySqlAdapter = (authService, apiClient, options = {}) => {
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

    const demoConnection = mockData.connections.find(
      (conn) =>
        conn.host === connectionData.host || conn.name === connectionData.name
    ) || {
      id: `mysql_${Date.now()}`,
      name: connectionData.name,
      host: connectionData.host,
      port: connectionData.port || 3306,
      username: connectionData.username || "root",
      database: connectionData.database || "",
      status: "active",
      createdAt: new Date().toISOString(),
      lastTested: new Date().toISOString(),
      password: connectionData.password || "",
      testResult: {
        status: "success",
        responseTime: "120ms",
        statusCode: 200,
        contentType: "mysql",
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
      if (
        !connectionData ||
        !connectionData.host ||
        !connectionData.name ||
        !connectionData.username
      ) {
        throw new Error(
          "Connection data with host, name, and username is required"
        );
      }

      const testResult = await testConnection(connectionData);

      if (testResult.status !== "success") {
        throw new Error("Connection test failed");
      }

      // TODO: Uncomment when backend is ready
      /*
            const response = await apiClient.post(endpoint.create, {
                name: connectionData.name,
                host: connectionData.host,
                port: connectionData.port,
                username: connectionData.username,
                password: connectionData.password,
                database: connectionData.database,
                testResult
            });
            const newConnection = await response.json();
            */

      const newConnection = {
        id: `mysql_${Date.now()}`,
        name: connectionData.name,
        host: connectionData.host,
        port: connectionData.port || 3306,
        username: connectionData.username || "root",
        database: connectionData.database || "",
        status: "active",
        createdAt: new Date().toISOString(),
        lastTested: new Date().toISOString(),
        password: connectionData.password || "",
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
      console.log("MySQL connection failed, falling back to demo mode");
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

  const testConnection = async (connectionData) => {
    if (isDemoMode) {
      await delay(1000);
      const isSuccess = Math.random() > 0.2;

      if (isSuccess) {
        return {
          status: "success",
          responseTime: `${Math.floor(Math.random() * 200 + 50)}ms`,
          statusCode: 200,
          contentType: "mysql",
          sampleData: {
            message: "MySQL connection successful",
            timestamp: new Date().toISOString(),
            tables: ["posts", "users", "weather"],
          },
        };
      } else {
        throw new Error("Connection failed: Unable to reach the MySQL server");
      }
    }

    try {
      const {
        host,
        port = 3306,
        username = "root",
        password = "",
        database = "",
      } = connectionData || {};

      if (!host || !username) {
        throw new Error("Host and username are required for MySQL connection");
      }

      // TODO: Uncomment when needed
      /*
            const response = await apiClient.post(endpoints.test, {
                host, port, username, password, database
            });
            return await response.json();
            */

      await delay(1000);
      return {
        status: "success",
        responseTime: "120ms",
        statusCode: 200,
        contentType: "mysql",
        sampleData: {
          message: "MySQL connection successful",
          timestamp: new Date().toISOString(),
          host,
          database,
        },
      };
    } catch (error) {
      throw new Error(`Connection test failed: ${error.message}`);
    }
  };

  const getDataSources = async () => {
    if (!isConnected) {
      throw new Error("Not connected to any MySQL server");
    }

    if (isDemoMode) {
      await delay(500);
      const mockConnection = mockData.sampleData[currentConnection.id];
      if (mockConnection?.tables) {
        return mockConnection.tables.map((table) => ({
          id: `${currentConnection.id}_${table.name}`,
          name: table.name,
          type: "table",
          lastModified: currentConnection.lastTested,
          database: currentConnection.database,
        }));
      }
    }

    // fetching tables
    // TODO: Uncomment when backend is ready
    /*
        const response = await apiClient.get(`${endpoints.tables}/${currentConnection.id}`);
        return await response.json();
        */

    return [
      {
        id: `${currentConnection.id}_default`,
        name: "default_table",
        type: "table",
        lastModified: currentConnection.lastTested,
        database: currentConnection.database,
      },
    ];
  };

  const getData = async (sourceId, options = {}) => {
    validateSourceId(sourceId);

    if (!isConnected) {
      throw new Error("Not connected to any MySQL server");
    }

    if (isDemoMode) {
      await delay(500);

      const [connectionId, tableName] = sourceId.split("_").slice(0, 2);
      const mockConnection = mockData.sampleData[connectionId];

      if (mockConnection) {
        const table = mockConnection.tables.find(
          (tbl) => tbl.name === tableName
        );

        if (table) {
          return {
            id: sourceId,
            name: `${mockConnection.name} - ${table.name}`,
            data: table.rows,
            headers: table.columns,
            metadata: {
              table: table.name,
              lastUpdated: new Date().toISOString(),
              isDemoData: true,
              connectionId: currentConnection.id,
            },
          };
        }
      }

      return {
        id: sourceId,
        name: "Demo MySQL Data",
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
      const { table = "", query = "", params = {} } = options;

      // TODO: uncomment when needed
      /*
            const response = await apiClient.post(`${endpoints.query}/${currentConnection.id}`, {
                table,
                query,
                params
            });
            const responseData = response.data;

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
                name: `${currentConnection.name} - ${table}`,
                data,
                headers,
                metadata: {
                    table,
                    lastUpdated: new Date().toISOString(),
                    connectionId: currentConnection.id
                }
            };
            */

      return getData(sourceId, { ...options, demoMode: true });
    } catch (error) {
      console.log("Real MySQL query failed, falling back to demo data");
      return getData(sourceId, { ...options, demoMode: true });
    }
  };

  const getConnectionInfo = () => ({
    isConnected,
    connection: currentConnection,
    provider: "MySQL",
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

    // TODO: real update via API
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

    // TODO: delete via API
    /*
        const response = await apiClient.delete(`${endpoints.delete}/${connectionId}`);
        return await response.json();
        */

    return { success: true };
  };

  const filterDataSources = (query, dataSources = []) => {
    if (!query) return dataSources;
    return dataSources.filter((source) =>
      source.name.toLowerCase().includes(query.toLowerCase())
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
