import {
  getAdapterInfo,
  createDataAdapter,
  getSupportedTypes,
} from "../adapters/day-book/data-sources/DataAdapterFactory";
import endpoints from "../utils/api/endpoints";

class DataSourceService {
  constructor(apiClient, authService, options = {}) {
    this.apiClient = apiClient;
    this.authService = authService;
    this.activeAdapters = new Map();
    this.isDemoMode = options.demoMode || options.fallbackToDemo || (typeof __DEV__ !== "undefined" ? __DEV__ : false);
    this.demoSources = this.createMockDataSources();
  }

  // Create mock data sources for demo mode
  createMockDataSources() {
    return [
      {
        id: "demo_api_1642105600000",
        type: "custom-api",
        name: "JSONPlaceholder API (Demo)",
        status: "connected",
        lastSync: new Date().toISOString(),
        createdAt: "2024-01-15T10:30:00Z",
        config: {
          url: "https://jsonplaceholder.typicode.com",
          headers: '{"Content-Type": "application/json"}',
          authentication: "",
          isDemoMode: true,
          defaultEndpoint: "/posts"
        },
        testResult: {
          status: "success",
          responseTime: "245ms",
          statusCode: 200,
          contentType: "application/json",
        }
      },
      {
        id: "demo_api_1642109200000",
        type: "custom-api",
        name: "Weather API (Demo)",
        status: "connected",
        lastSync: new Date().toISOString(),
        createdAt: "2024-01-16T11:30:00Z",
        config: {
          url: "https://api.openweathermap.org/data/2.5",
          headers: '{"Accept": "application/json"}',
          authentication: '{"type": "query", "key": "appid", "value": "demo_key"}',
          isDemoMode: true,
          defaultEndpoint: "/weather"
        },
        testResult: {
          status: "success",
          responseTime: "180ms",
          statusCode: 200,
          contentType: "application/json",
        }
      },
      {
        id: "demo_sheets_1642112800000",
        type: "google-sheets",
        name: "Budget Sheet (Demo)",
        status: "connected",
        lastSync: new Date().toISOString(),
        createdAt: "2024-01-17T12:00:00Z",
        config: {
          sheetId: "demo_budget_sheet_123",
          sheetName: "Budget 2024",
          isDemoMode: true
        }
      }
    ];
  }

  // Get all connected data sources from backend or demo
  async getConnectedDataSources() {
    if (this.isDemoMode) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return [...this.demoSources];
    }

    try {
      const response = await this.apiClient.get(
        endpoints.modules.day_book.data_sources.getDataSources()
      );
      return response.data;
    } catch (error) {
      console.error("Failed to fetch connected data sources, falling back to demo mode:", error);
      this.isDemoMode = true;
      return this.getConnectedDataSources();
    }
  }

  // Get a specific data source configuration
  async getDataSource(sourceId) {
    if (this.isDemoMode) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const demoSource = this.demoSources.find(source => source.id === sourceId);
      if (!demoSource) {
        throw new Error(`Demo data source ${sourceId} not found`);
      }
      return demoSource;
    }

    try {
      const response = await this.apiClient.get(
        endpoints.modules.day_book.data_sources.getDataSource(sourceId)
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch data source ${sourceId}, checking demo sources:`, error);
      
      // Check if it's a demo source ID
      if (sourceId.startsWith('demo_')) {
        this.isDemoMode = true;
        return this.getDataSource(sourceId);
      }
      
      throw new Error("Unable to load data source");
    }
  }

  // Fetch actual data from a data source
  async fetchDataFromSource(sourceId, options = {}) {
    try {
      // Get the data source configuration
      const dataSource = await this.getDataSource(sourceId);
      
      if (!dataSource) {
        throw new Error(`Data source ${sourceId} not found`);
      }

      // Get or create the appropriate adapter
      const adapter = await this.getAdapter(dataSource.type, dataSource.config);
      
      // Check if adapter supports raw data fetching
      if (!adapter.fetchRawData && typeof adapter.fetchRawData !== 'function') {
        throw new Error(`Adapter for ${dataSource.type} does not support data fetching`);
      }

      // Extract endpoint information from options or data source config
      const {
        endpoint = dataSource.config?.defaultEndpoint || "/",
        method = "GET",
        params = {},
        ...adapterOptions
      } = options;

      // Fetch raw data using the adapter
      const rawResponse = await adapter.fetchRawData(endpoint, method, params);
      
      // Transform raw response into standardized format
      const transformedData = this.transformRawData(rawResponse, dataSource, {
        endpoint,
        method,
        sourceId
      });

      // Update last sync timestamp
      await this.updateLastSync(sourceId);

      return transformedData;

    } catch (error) {
      console.error(`Failed to fetch data from source ${sourceId}:`, error);
      
      // Update data source status to error
      try {
        await this.updateDataSourceStatus(sourceId, 'error', error.message);
      } catch (statusError) {
        console.warn('Failed to update data source status:', statusError);
      }
      
      throw new Error(`Failed to fetch data: ${error.message}`);
    }
  }

  // Transform raw API response into standardized format
  transformRawData(rawResponse, dataSource, requestInfo) {
    let data = [];
    let headers = [];
    
    // Handle different response formats
    if (Array.isArray(rawResponse.data)) {
      data = rawResponse.data;
      headers = data.length > 0 ? Object.keys(data[0]) : [];
    } else if (rawResponse.data && typeof rawResponse.data === 'object') {
      data = [rawResponse.data];
      headers = Object.keys(rawResponse.data);
    } else {
      // Handle primitive responses
      data = [{ value: rawResponse.data }];
      headers = ['value'];
    }

    return {
      id: requestInfo.sourceId,
      name: `${dataSource.name} - ${requestInfo.endpoint}`,
      data,
      headers,
      metadata: {
        sourceId: requestInfo.sourceId,
        sourceName: dataSource.name,
        sourceType: dataSource.type,
        endpoint: requestInfo.endpoint,
        method: requestInfo.method,
        statusCode: rawResponse.statusCode,
        responseTime: rawResponse.responseTime,
        contentType: rawResponse.headers?.['content-type'] || 'unknown',
        lastUpdated: new Date().toISOString(),
        recordCount: data.length,
        isDemoData: dataSource.config?.isDemoMode || false
      }
    };
  }

  // Get or create adapter for a data source type
  async getAdapter(type, config = {}) {
    const adapterKey = `${type}_${JSON.stringify(config)}`;
    
    if (this.activeAdapters.has(adapterKey)) {
      return this.activeAdapters.get(adapterKey);
    }

    try {
      const adapter = createDataAdapter(type, {
        ...config,
        demoMode: this.isDemoMode || config.isDemoMode,
        fallbackToDemo: true,
        apiClient: this.apiClient,
        authService: this.authService
      });

      if (!adapter) {
        throw new Error(`No adapter found for type: ${type}`);
      }

      this.activeAdapters.set(adapterKey, adapter);
      return adapter;
    } catch (error) {
      console.error(`Failed to create adapter for ${type}:`, error);
      throw new Error(`Failed to initialize ${type} adapter: ${error.message}`);
    }
  }

  // Connect a new data source
  async connectDataSource(type, config, name) {
    if (this.isDemoMode) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newDemoSource = {
        id: `demo_${type}_${Date.now()}`,
        type,
        name: `${name} (Demo)`,
        status: 'connected',
        lastSync: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        config: {
          ...config,
          isDemoMode: true
        },
        testResult: {
          status: "success",
          responseTime: "245ms",
          statusCode: 200,
          contentType: "application/json",
        }
      };
      
      this.demoSources.push(newDemoSource);
      console.log(this.demoSources);
      return newDemoSource;
    }

    try {
      // First test the connection
      const connectionData = await this.testConnection(type, config, name);

      // Save the connection to backend
      const response = await this.apiClient.post(
        endpoints.modules.day_book.data_sources.add(),
        {
          type,
          name,
          config,
          status: 'connected',
          testResult: connectionData
        }
      );
      
      return response.data;
    } catch (error) {
      console.error("Failed to connect data source, falling back to demo mode:", error);
      this.isDemoMode = true;
      return this.connectDataSource(type, config, name);
    }
  }

  // Update data source configuration
  async updateDataSource(sourceId, updates) {
    if (this.isDemoMode) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const sourceIndex = this.demoSources.findIndex(s => s.id === sourceId);
      if (sourceIndex !== -1) {
        this.demoSources[sourceIndex] = {
          ...this.demoSources[sourceIndex],
          ...updates,
          lastSync: new Date().toISOString()
        };
        return this.demoSources[sourceIndex];
      }
      throw new Error(`Demo source ${sourceId} not found`);
    }

    try {
      const response = await this.apiClient.put(
        endpoints.modules.day_book.data_sources.update(sourceId),
        updates
      );
      
      // Clear cached adapter if config changed
      if (updates.config) {
        this.clearAdapterCache(sourceId);
      }
      
      return response.data;
    } catch (error) {
      console.error(`Failed to update data source ${sourceId}:`, error);
      throw new Error("Failed to update data source");
    }
  }

  // Disconnect/delete a data source
  async disconnectDataSource(sourceId) {
    if (this.isDemoMode) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const sourceIndex = this.demoSources.findIndex(s => s.id === sourceId);
      if (sourceIndex !== -1) {
        this.demoSources.splice(sourceIndex, 1);
        this.clearAdapterCache(sourceId);
        return true;
      }
      throw new Error(`Demo source ${sourceId} not found`);
    }

    try {
      await this.apiClient.delete(
        endpoints.modules.day_book.data_sources.removeDataSource(sourceId)
      );
      
      // Clear cached adapter
      this.clearAdapterCache(sourceId);
      
      return true;
    } catch (error) {
      console.error(`Failed to disconnect data source ${sourceId}:`, error);
      throw new Error("Failed to disconnect data source");
    }
  }

  // Test connection to a data source
  async testConnection(type, config, name) {
    try {
      // Create temporary adapter for testing
      const adapter = createDataAdapter(type, {
        ...config,
        demoMode: this.isDemoMode,
        fallbackToDemo: true,
        apiClient: this.apiClient,
        authService: this.authService
      });

      if (!adapter || !adapter.testConnection) {
        throw new Error(`Adapter for ${type} does not support connection testing`);
      }

      // Test the connection
      const testResult = await adapter.testConnection(
        config.url || config.connectionString,
        config.headers,
        config.authentication
      );

      return {
        type,
        name,
        config: {
          ...config,
          isDemoMode: this.isDemoMode
        },
        status: 'success',
        testResult,
        createdAt: new Date().toISOString(),
        lastTested: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Connection test failed:`, error);
      throw new Error(`Connection test failed: ${error.message}`);
    }
  }

  // Update last sync timestamp
  async updateLastSync(sourceId) {
    try {
      if (this.isDemoMode) {
        const sourceIndex = this.demoSources.findIndex(s => s.id === sourceId);
        if (sourceIndex !== -1) {
          this.demoSources[sourceIndex].lastSync = new Date().toISOString();
        }
        return;
      }

      await this.updateDataSource(sourceId, {
        lastSync: new Date().toISOString()
      });
    } catch (error) {
      console.warn(`Failed to update last sync for ${sourceId}:`, error);
    }
  }

  // Update data source status
  async updateDataSourceStatus(sourceId, status, error = null) {
    try {
      if (this.isDemoMode) {
        const sourceIndex = this.demoSources.findIndex(s => s.id === sourceId);
        if (sourceIndex !== -1) {
          this.demoSources[sourceIndex].status = status;
          if (error) {
            this.demoSources[sourceIndex].error = error;
          }
        }
        return;
      }

      const updates = { status };
      if (error) {
        updates.error = error;
      }
      await this.updateDataSource(sourceId, updates);
    } catch (updateError) {
      console.warn(`Failed to update status for ${sourceId}:`, updateError);
    }
  }

  // Clear cached adapter for a data source
  clearAdapterCache(sourceId) {
    // Remove all adapters that might be related to this source
    const keysToRemove = [];
    for (const key of this.activeAdapters.keys()) {
      if (key.includes(sourceId)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => this.activeAdapters.delete(key));
  }

  // Get statistics about connected data sources
  async getDataSourceStats() {
    try {
      const sources = await this.getConnectedDataSources();
      return {
        total: sources.length,
        connected: sources.filter((s) => s.status === "connected").length,
        errors: sources.filter((s) => s.status === "error").length,
        byType: this.groupByType(sources),
        byCategory: this.groupByCategory(sources),
      };
    } catch (error) {
      console.error("Failed to get data source stats:", error);
      throw error;
    }
  }

  // Group sources by type
  groupByType(sources) {
    return sources.reduce((acc, source) => {
      acc[source.type] = (acc[source.type] || 0) + 1;
      return acc;
    }, {});
  }

  // Group sources by category
  groupByCategory(sources) {
    return sources.reduce((acc, source) => {
      const adapterInfo = getAdapterInfo(source.type);
      const category = adapterInfo?.category || "other";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
  }

  // Get available data sources/endpoints for a connected source
  async getAvailableDataSources(sourceId) {
    try {
      const dataSource = await this.getDataSource(sourceId);
      const adapter = await this.getAdapter(dataSource.type, dataSource.config);
      
      if (adapter.getDataSources && typeof adapter.getDataSources === 'function') {
        return await adapter.getDataSources();
      }
      
      // Return default if adapter doesn't support discovery
      return [{
        id: `${sourceId}_default`,
        name: `${dataSource.name} - Default`,
        type: 'default',
        lastModified: dataSource.lastSync || dataSource.createdAt
      }];
    } catch (error) {
      console.error(`Failed to get available data sources for ${sourceId}:`, error);
      throw new Error("Failed to discover available data sources");
    }
  }

  // Sync/refresh data from a source 
  async syncDataSource(sourceId, options = {}) {
    return this.fetchDataFromSource(sourceId, options);
  }

  // Check if service is in demo mode
  isDemoModeActive() {
    return this.isDemoMode;
  }

  // Enable demo mode manually
  enableDemoMode() {
    this.isDemoMode = true;
  }

  // Get demo mode indicator in stats
  getDemoModeInfo() {
    return {
      isDemoMode: this.isDemoMode,
      demoSourceCount: this.demoSources.length,
      availableDemoTypes: [...new Set(this.demoSources.map(s => s.type))]
    };
  }
}

export default DataSourceService;