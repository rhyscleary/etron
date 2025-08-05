import { delay, validateSourceId, formatDate } from "./baseAdapter";

// mock data for demo
const createMockData = () => ({
  connections: [
    {
      id: "ftp_1642105600000",
      name: "Demo FTP Server",
      hostname: "ftp.demo.com",
      port: "21",
      username: "demo_user",
      directory: "/data",
      status: "connected",
      createdAt: "2024-01-15T10:30:00Z",
      lastConnected: "2024-01-15T10:30:00Z",
      testResult: {
        status: "success",
        responseTime: "350ms",
        features: ["read", "write", "list"],
        serverType: "Demo FTP Server",
      },
    },
    {
      id: "ftp_1642109200000",
      name: "Production FTP",
      hostname: "ftp.production.com",
      port: "22",
      username: "prod_user",
      directory: "/uploads",
      status: "connected",
      createdAt: "2024-01-16T11:30:00Z",
      lastConnected: "2024-01-16T11:30:00Z",
      testResult: {
        status: "success",
        responseTime: "180ms",
        features: ["read", "write", "list", "sftp"],
        serverType: "SFTP Server",
      },
    },
  ],
  files: [
    {
      name: "sales_data.csv",
      path: "/data/sales_data.csv",
      size: 1024,
      modified: "2024-01-15T10:30:00Z",
      type: "file",
    },
    {
      name: "inventory.json",
      path: "/data/inventory.json",
      size: 2048,
      modified: "2024-01-14T15:20:00Z",
      type: "file",
    },
    {
      name: "customer_data.xlsx",
      path: "/data/customer_data.xlsx",
      size: 4096,
      modified: "2024-01-13T14:10:00Z",
      type: "file",
    },
    {
      name: "reports",
      path: "/data/reports",
      size: 0,
      modified: "2024-01-13T09:15:00Z",
      type: "directory",
    },
  ],
  sampleData: {
    ftp_1642105600000: {
      name: "Demo FTP Server",
      files: [
        {
          path: "/data/sales_data.csv",
          name: "Sales Data",
          data: [
            {
              date: "2024-01-01",
              product: "Widget A",
              quantity: 10,
              revenue: 1000,
            },
            {
              date: "2024-01-02",
              product: "Widget B",
              quantity: 15,
              revenue: 1500,
            },
            {
              date: "2024-01-03",
              product: "Widget A",
              quantity: 8,
              revenue: 800,
            },
          ],
        },
        {
          path: "/data/inventory.json",
          name: "Inventory Data",
          data: [
            { id: 1, item: "Widget A", stock: 100, location: "Warehouse A" },
            { id: 2, item: "Widget B", stock: 75, location: "Warehouse B" },
            { id: 3, item: "Widget C", stock: 50, location: "Warehouse A" },
          ],
        },
      ],
    },
    ftp_1642109200000: {
      name: "Production FTP",
      files: [
        {
          path: "/uploads/customer_data.xlsx",
          name: "Customer Data",
          data: [
            {
              id: 1,
              name: "John Doe",
              email: "john@example.com",
              city: "New York",
            },
            {
              id: 2,
              name: "Jane Smith",
              email: "jane@example.com",
              city: "Los Angeles",
            },
            {
              id: 3,
              name: "Bob Johnson",
              email: "bob@example.com",
              city: "Chicago",
            },
          ],
        },
      ],
    },
  },
});

// Helper functions
const parseConnectionData = (connectionData) => {
  if (!connectionData) return {};

  // Normalize common field variations
  return {
    name:
      connectionData.name ||
      connectionData.connectionName ||
      connectionData.title,
    hostname:
      connectionData.hostname || connectionData.host || connectionData.server,
    username: connectionData.username || connectionData.user,
    password: connectionData.password,
    port: connectionData.port || "21",
    directory: connectionData.directory || connectionData.path || "/",
    keyFile: connectionData.keyFile || connectionData.privateKey,
  };
};

const buildFtpUrl = (hostname, port, directory, filename = "") => {
  const basePath = directory.endsWith("/") ? directory : `${directory}/`;
  return `ftp://${hostname}:${port}${basePath}${filename}`;
};

export const createCustomFtpAdapter = (options = {}) => {
  const isDemoMode =
    options.demoMode ||
    options.fallbackToDemo ||
    (typeof __DEV__ !== "undefined" ? __DEV__ : false);
  const mockData = createMockData();
  let connections = [];
  let currentConnection = null;
  let isConnected = false;

  const connectDemo = async (connectionData) => {
    await delay(1500);

    const parsed = parseConnectionData(connectionData);

    // find or create a demo connection
    const demoConnection = mockData.connections.find(
      (conn) => conn.hostname === parsed.hostname || conn.name === parsed.name
    ) || {
      id: `ftp_${Date.now()}`,
      name: parsed.name,
      hostname: parsed.hostname,
      port: parsed.port,
      username: parsed.username,
      directory: parsed.directory,
      status: "connected",
      createdAt: new Date().toISOString(),
      lastConnected: new Date().toISOString(),
      testResult: {
        status: "success",
        responseTime: "350ms",
        features: ["read", "write", "list"],
        serverType: "Demo FTP Server",
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
      if (!connectionData || !connectionData.hostname || !connectionData.name) {
        throw new Error("Connection data with hostname and name is required");
      }

      const testResult = await testConnection(
        connectionData.hostname,
        connectionData.port,
        connectionData.username,
        connectionData.password
      );

      if (testResult.status !== "success") {
        throw new Error("Connection test failed");
      }

      const parsed = parseConnectionData(connectionData);

      // mock response
      const newConnection = {
        id: `ftp_${Date.now()}`,
        name: parsed.name,
        hostname: parsed.hostname,
        port: parsed.port,
        username: parsed.username,
        directory: parsed.directory,
        status: "connected",
        createdAt: new Date().toISOString(),
        lastConnected: new Date().toISOString(),
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
      console.log("Custom FTP connection failed, falling back to demo mode");
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

  // Connection testing - this stays in the adapter as it's connection-specific logic
  const testConnection = async (hostname, port = "21", username, password) => {
    if (isDemoMode) {
      await delay(2000);
      const isSuccess = Math.random() > 0.2; // fake success rate

      if (isSuccess) {
        return {
          status: "success",
          responseTime: `${Math.floor(Math.random() * 300 + 100)}ms`,
          features: ["read", "write", "list"],
          serverType: "Demo FTP Server",
          sampleData: {
            message: "FTP connection successful",
            timestamp: new Date().toISOString(),
            files: ["/data", "/uploads", "/exports"],
          },
        };
      } else {
        throw new Error("Connection failed: Unable to reach the FTP server");
      }
    }

    try {
      // mock response
      await delay(2000);
      return {
        status: "success",
        responseTime: "350ms",
        features: ["read", "write", "list"],
        serverType: "FTP Server",
        sampleData: {
          message: "FTP connection successful",
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw new Error(`Connection test failed: ${error.message}`);
    }
  };

  // Data source discovery - returns available files/directories
  const getDataSources = async () => {
    if (!isConnected) {
      throw new Error("Not connected to any FTP server");
    }

    if (isDemoMode) {
      await delay(800);
      return mockData.files.map((file) => ({
        id: `${currentConnection.id}_${file.name}`,
        name: file.name,
        path: file.path,
        type: file.type,
        size: file.size,
        lastModified: file.modified,
        url: buildFtpUrl(
          currentConnection.hostname,
          currentConnection.port,
          file.path
        ),
      }));
    }

    // TODO: list directory contents
    /*
    const ftpClient = new FtpClient();
    await ftpClient.connect(currentConnection);
    const files = await ftpClient.list(currentConnection.directory);
    await ftpClient.disconnect();
    return files.map(file => ({
      id: `${currentConnection.id}_${file.name}`,
      name: file.name,
      path: file.path,
      type: file.type,
      size: file.size,
      lastModified: file.date,
      url: buildFtpUrl(currentConnection.hostname, currentConnection.port, file.path)
    }));
    */

    return [
      {
        id: `${currentConnection.id}_default`,
        name: `${currentConnection.name} - Default Directory`,
        path: currentConnection.directory,
        type: "directory",
        lastModified: currentConnection.lastConnected,
        url: buildFtpUrl(
          currentConnection.hostname,
          currentConnection.port,
          currentConnection.directory
        ),
      },
    ];
  };

  // Raw data fetching method for DataSourceService to use
  const fetchRawData = async (filePath, options = {}) => {
    if (!isConnected) {
      throw new Error("Not connected to any FTP server");
    }

    if (isDemoMode) {
      await delay(800);

      const mockConnection = mockData.sampleData[currentConnection.id];

      if (mockConnection) {
        const mockFile = mockConnection.files.find(
          (file) => file.path === filePath
        );

        if (mockFile) {
          return {
            data: mockFile.data,
            statusCode: 200,
            headers: { "content-type": "application/json" },
            responseTime: 350,
            metadata: {
              filePath,
              fileName: mockFile.name,
              lastModified: new Date().toISOString(),
            },
          };
        }
      }

      return {
        data: [
          { id: 1, name: "Item 1", value: 100 },
          { id: 2, name: "Item 2", value: 200 },
          { id: 3, name: "Item 3", value: 300 },
        ],
        statusCode: 200,
        headers: { "content-type": "application/json" },
        responseTime: 350,
        metadata: {
          filePath,
          fileName: filePath.split("/").pop(),
        },
      };
    }

    try {
      // Fallback to demo data for now
      return fetchRawData(filePath, options);
    } catch (error) {
      console.log("Real FTP download failed, falling back to demo data");
      const demoOptions = { ...options, demoMode: true };
      const demoAdapter = createCustomFtpAdapter(demoOptions);
      return demoAdapter.fetchRawData(filePath, options);
    }
  };

  const getConnectionInfo = () => ({
    isConnected,
    connection: currentConnection,
    provider: "Custom FTP",
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
    isConnected: () => isConnected,
    getConnectionInfo,
    switchConnection,
    updateConnection,
    deleteConnection,

    getDataSources,
    filterDataSources,

    fetchRawData,

    parseConnectionData,
    buildFtpUrl,

    formatDate,
  };
};
