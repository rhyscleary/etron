import {
  delay,
  validateConnectionData,
  sanitizeConnectionData,
  createConnectionId,
  createTestResult,
} from "./baseAdapter";

// mcok data for demo mode
const createMockData = () => ({
  connections: [
    {
      id: "ftp-demo-server-1",
      name: "Demo FTP Server",
      hostname: "ftp.demo.com",
      port: "21",
      username: "demo_user",
      directory: "/data",
      status: "connected",
      lastConnected: "2024-01-15T10:30:00Z",
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
      name: "reports",
      path: "/data/reports",
      size: 0,
      modified: "2024-01-13T09:15:00Z",
      type: "directory",
    },
  ],
  sampleData: {
    "/data/sales_data.csv": {
      name: "Sales Data",
      headers: ["Date", "Product", "Quantity", "Revenue"],
      values: [
        ["2024-01-01", "Widget A", "10", "1000"],
        ["2024-01-02", "Widget B", "15", "1500"],
        ["2024-01-03", "Widget A", "8", "800"],
      ],
    },
  },
});

export const createCustomFtpAdapter = (
  authService,
  apiClient,
  options = {}
) => {
  const isDemoMode =
    options.demoMode ||
    options.fallbackToDemo ||
    (typeof __DEV__ !== "undefined" ? __DEV__ : false);

  const mockData = createMockData();
  let connections = [];
  let currentConnection = null;

  const testConnection = async (connectionData) => {
    const sanitized = sanitizeConnectionData(connectionData);

    try {
      validateConnectionData(sanitized, ["hostname", "username", "name"]);

      if (isDemoMode) {
        await delay(2000);

        return createTestResult(true, {
          hostname: sanitized.hostname,
          port: sanitized.port || "21",
          username: sanitized.username,
          directory: sanitized.directory || "/",
          connectionTime: Date.now(),
          features: ["read", "write", "list"],
          serverType: "Demo FTP Server",
        });
      }

      // TODO: Implement real FTP connection test
      const testPayload = {
        hostname: sanitized.hostname,
        port: parseInt(sanitized.port) || 21,
        username: sanitized.username,
        password: sanitized.password,
        keyFile: sanitized.keyFile,
        directory: sanitized.directory || "/",
        timeout: options.timeout || 30000,
      };

      // TODO: implement real FTP test
      /*
      const response = await apiClient.post('/connections/ftp/test', testPayload);
      const result = await response.json();
      
      if (result.success) {
        return createTestResult(true, {
          hostname: sanitized.hostname,
          port: sanitized.port || '21',
          directory: sanitized.directory || '/',
          connectionTime: result.connectionTime,
          features: result.features,
          serverType: result.serverType
        });
      } else {
        throw new Error(result.error || 'Connection test failed');
      }
      */

      console.log("Real FTP test not implemented, using demo mode");
      await delay(2000);
      return createTestResult(true, {
        hostname: sanitized.hostname,
        port: sanitized.port || "21",
        username: sanitized.username,
        directory: sanitized.directory || "/",
        connectionTime: Date.now(),
        features: ["read", "write", "list"],
        serverType: "Demo FTP Server",
      });
    } catch (error) {
      console.error("FTP connection test failed:", error);
      return createTestResult(false, {}, error);
    }
  };

  const connect = async (connectionData) => {
    const sanitized = sanitizeConnectionData(connectionData);

    try {
      validateConnectionData(sanitized, ["hostname", "username", "name"]);

      const connectionId = createConnectionId("ftp", sanitized);

      if (isDemoMode) {
        await delay(1500);

        const connection = {
          id: connectionId,
          name: sanitized.name,
          hostname: sanitized.hostname,
          port: sanitized.port || "21",
          username: sanitized.username,
          directory: sanitized.directory || "/",
          status: "connected",
          createdAt: new Date().toISOString(),
          isDemoMode: true,
        };

        connections.push(connection);
        currentConnection = connection;

        return {
          success: true,
          connection: connection,
        };
      }

      // TODO: Implement real FTP connection
      const connectionPayload = {
        id: connectionId,
        name: sanitized.name,
        hostname: sanitized.hostname,
        port: parseInt(sanitized.port) || 21,
        username: sanitized.username,
        password: sanitized.password,
        keyFile: sanitized.keyFile,
        directory: sanitized.directory || "/",
        timeout: options.timeout || 30000,
      };

      // TODO: Implement real FTP connection
      /*
      const response = await apiClient.post('/connections/ftp/connect', connectionPayload);
      const result = await response.json();
      
      if (result.success) {
        const connection = {
          id: connectionId,
          name: sanitized.name,
          hostname: sanitized.hostname,
          port: sanitized.port || '21',
          username: sanitized.username,
          directory: sanitized.directory || '/',
          status: 'connected',
          createdAt: new Date().toISOString()
        };
        
        connections.push(connection);
        currentConnection = connection;
        
        return {
          success: true,
          connection: connection
        };
      } else {
        throw new Error(result.error || 'Failed to create FTP connection');
      }
      */

      console.log("Real FTP connection not implemented, using demo mode");
      await delay(1500);

      const connection = {
        id: connectionId,
        name: sanitized.name,
        hostname: sanitized.hostname,
        port: sanitized.port || "21",
        username: sanitized.username,
        directory: sanitized.directory || "/",
        status: "connected",
        createdAt: new Date().toISOString(),
        isDemoMode: true,
      };

      connections.push(connection);
      currentConnection = connection;

      return {
        success: true,
        connection: connection,
      };
    } catch (error) {
      console.error("FTP connection failed:", error);
      throw new Error(`Failed to create FTP connection: ${error.message}`);
    }
  };

  const disconnect = async () => {
    try {
      if (currentConnection && !isDemoMode) {
        // TODO: close real FTP connection
        /*
        await apiClient.post('/connections/ftp/disconnect', {
          connectionId: currentConnection.id
        });
        */
      }

      currentConnection = null;
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to disconnect: ${error.message}`);
    }
  };

  const getDataSources = async () => {
    if (!currentConnection) {
      throw new Error("Not connected to FTP server");
    }

    if (isDemoMode) {
      await delay(1000);
      return mockData.files;
    }

    try {
      // TODO: list directory contents from FTP
      /*
      const response = await apiClient.post('/connections/ftp/list', {
        connectionId: currentConnection.id,
        directory: currentConnection.directory
      });
      const result = await response.json();
      return result.files;
      */

      await delay(1000);
      return mockData.files;
    } catch (error) {
      console.log("Real FTP listing failed, using demo data");
      await delay(1000);
      return mockData.files;
    }
  };

  const getData = async (filePath, options = {}) => {
    if (!currentConnection) {
      throw new Error("Not connected to FTP server");
    }

    if (isDemoMode) {
      await delay(800);
      const mockFile = mockData.sampleData[filePath];

      if (!mockFile) {
        return {
          path: filePath,
          name: filePath.split("/").pop(),
          data: [
            ["Column1", "Column2"],
            ["Value1", "Value2"],
          ],
          headers: ["Column1", "Column2"],
          metadata: { isDemoData: true },
        };
      }

      return {
        path: filePath,
        name: mockFile.name,
        data: mockFile.values,
        headers: mockFile.headers,
        metadata: {
          filePath,
          lastModified: new Date().toISOString(),
          isDemoData: true,
        },
      };
    }

    try {
      // TODO: download file from FTP
      /*
      const response = await apiClient.post('/connections/ftp/download', {
        connectionId: currentConnection.id,
        filePath: filePath,
        parseFormat: options.format || 'auto'
      });
      const result = await response.json();
      
      return {
        path: filePath,
        name: result.name,
        data: result.data,
        headers: result.headers,
        metadata: {
          filePath,
          lastModified: result.lastModified
        }
      };
      */

      console.log("Real FTP download not implemented, using demo data");
      return getData(filePath, { ...options, demoMode: true });
    } catch (error) {
      console.log("Real FTP download failed, falling back to demo data");
      return getData(filePath, { ...options, demoMode: true });
    }
  };

  const getConnectionInfo = () => ({
    isConnected: !!currentConnection,
    connection: currentConnection,
    provider: "Custom FTP",
    isDemoMode: isDemoMode,
  });

  const isConnected = () => !!currentConnection;

  return {
    testConnection,
    connect,
    disconnect,
    getDataSources,
    getData,
    isConnected,
    getConnectionInfo,
  };
};
