import { getAdapterInfo, createDataAdapter, getSupportedTypes } from '../adapters/day-book/data-sources/DataAdapterFactory';


class DataSourceService {
  constructor(apiClient, authService) {
    this.apiClient = apiClient;
    this.authService = authService;
    this.activeAdapters = new Map();
  }

  MockConnectedSources = [
      {
        id: "1",
        type: "google-sheets",
        name: "My Budget Sheet",
        status: "connected",
        lastSync: new Date().toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        config: {
          endpoints: { sheetId: "1abc123def456" },
          options: { sheetName: "Budget 2024" }
        }
      },
      {
        id: "2", 
        type: "mysql",
        name: "Production Database",
        status: "connected",
        lastSync: new Date(Date.now() - 3600000).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
        config: {
          connectionString: "mysql://prod-db.company.com/main_db",
          options: { poolSize: 10 }
        }
      },
      {
        id: "3",
        type: "custom-api",
        name: "Sales API",
        status: "error",
        lastSync: new Date(Date.now() - 86400000).toISOString(),
        error: "Authentication failed",
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        config: {
          endpoints: { baseUrl: "https://api.sales.company.com" },
          options: { timeout: 30000 }
        }
      }
    ];

 
  async getConnectedDataSources() {
    try {
      // TODO: update with backend call when ready
      /*const response = await this.apiClient.get('/api/user/data-sources');
      return response.data;*/

      // mock data
      return this.getMockConnectedSources();
    } catch (error) {
      console.error('Failed to fetch connected data sources:', error);
      throw new Error('Unable to load connected data sources');
    }
  }


  async getDataSource(sourceId) {
    try {
      // TODO: update with backend call when ready
      /*const response = await this.apiClient.get(`/api/user/data-sources/${sourceId}`);
      return response.data;*/
  

      const sources = this.getMockConnectedSources();
      //const sources = await this.getConnectedDataSources();
      console.log(sources)
      
      return sources.find(source => source.id === sourceId);
      

    } catch (error) {
      console.error(`Failed to fetch data source ${sourceId}:`, error);
      throw new Error('Unable to load data source');
    }
  }

   async connectDataSource(type, config, name) {
    try {
      console.log(`Connecting new data source: ${name} (${type})`);
      const adapterInfo = getAdapterInfo(type);
      if (!adapterInfo) {
        throw new Error(`Unsupported data source type: ${type}`);
      }

      const adapter = createDataAdapter(type, config.dependencies);

      if (adapter && adapter.testConnection) {
        await adapter.testConnection();
      }
      console.log(`Connected new data source: ${name} (${type})`);

      // Generate a unique ID
      const newId = Date.now().toString();
      
      const connectionData = {
        id: newId,
        type,
        name,
        config: config.connectionConfig || {},
        status: 'connected',
        createdAt: new Date().toISOString(),
        lastSync: new Date().toISOString()
      };

      // TODO: update with backend call when ready
      /*const response = await this.apiClient.post('/api/user/data-sources', connectionData);
      return response.data;*/

      // Return the connection data
      return connectionData;
    } catch (error) {
      console.error('Failed to connect data source:', error);
      throw new Error(`Failed to connect to ${type}: ${error.message}`);
    }
  }


  async updateDataSource(sourceId, updates) {
    try {
      // TODO: update with backend call when ready
      /*const response = await this.apiClient.put(`/api/user/data-sources/${sourceId}`, updates);
      return response.data;*/

      console.log(`Updating data source ${sourceId}:`, updates);
      return { id: sourceId, ...updates, updatedAt: new Date().toISOString() };
    } catch (error) {
      console.error(`Failed to update data source ${sourceId}:`, error);
      throw new Error('Failed to update data source');
    }
  }

  async disconnectDataSource(sourceId) {
    try {
      if (this.activeAdapters.has(sourceId)) {
        const adapter = this.activeAdapters.get(sourceId);
        if (adapter.disconnect) {
          await adapter.disconnect();
        }
        this.activeAdapters.delete(sourceId);
      }

      // TODO: update with backend call when ready
      // await this.apiClient.delete(`/api/user/data-sources/${sourceId}`);

      console.log(`Disconnected data source ${sourceId}`);
      return true;
    } catch (error) {
      console.error(`Failed to disconnect data source ${sourceId}:`, error);
      throw new Error('Failed to disconnect data source');
    }
  }

  async testConnection(sourceId) {
    try {
      const source = await this.getDataSource(sourceId);
      if (!source) {
        throw new Error('Data source not found');
      }

      const adapter = await this.getAdapterInstance(source);
      
      if (adapter.testConnection) {
        await adapter.testConnection();
 
        await this.updateDataSource(sourceId, {
          status: 'connected',
          lastSync: new Date().toISOString(),
          error: null
        });
        
        return { success: true };
      } else {
        throw new Error('Connection test not supported for this adapter type');
      }
    } catch (error) {
      console.error(`Connection test failed for ${sourceId}:`, error);

      await this.updateDataSource(sourceId, {
        status: 'error',
        error: error.message
      });
      
      throw error;
    }
  }


  async syncDataSource(sourceId) {
    try {
      const source = await this.getDataSource(sourceId);
      if (!source) {
        throw new Error('Data source not found');
      }

      await this.updateDataSource(sourceId, { status: 'syncing' });

      const adapter = await this.getAdapterInstance(source);
      
      if (adapter.sync) {
        const result = await adapter.sync();

        await this.updateDataSource(sourceId, {
          status: 'connected',
          lastSync: new Date().toISOString(),
          error: null
        });
        
        return result;
      } else {
        throw new Error('Sync not supported for this adapter type');
      }
    } catch (error) {
      console.error(`Sync failed for ${sourceId}:`, error);

      await this.updateDataSource(sourceId, {
        status: 'error',
        error: error.message
      });
      
      throw error;
    }
  }


  async getAdapterInstance(source) {
    // Check for adapter instance
    if (this.activeAdapters.has(source.id)) {
      return this.activeAdapters.get(source.id);
    }

    // create new adapter instance
    const dependencies = await this.reconstructDependencies(source);
    const adapter = createDataAdapter(source.type, dependencies);

    this.activeAdapters.set(source.id, adapter);
    
    return adapter;
  }


  async reconstructDependencies(source) {
    const dependencies = {
      authService: this.authService,
      apiClient: this.apiClient,
      options: source.config.options || {}
    };

    switch (source.type) {
      case 'google-sheets':
        dependencies.endpoints = source.config.endpoints;
        break;
      case 'mysql':
        dependencies.dbConnection = source.config.connectionString;
        break;
      case 'custom-api':
        dependencies.endpoints = source.config.endpoints;
        break;
      // Add other cases as needed
    }

    return dependencies;
  }


  async getDataSourceStats() {
    try {
      const sources = await this.getConnectedDataSources();
      
      return {
        total: sources.length,
        connected: sources.filter(s => s.status === 'connected').length,
        errors: sources.filter(s => s.status === 'error').length,
        byType: this.groupByType(sources),
        byCategory: this.groupByCategory(sources)
      };
    } catch (error) {
      console.error('Failed to get data source stats:', error);
      throw error;
    }
  }


  groupByType(sources) {
    return sources.reduce((acc, source) => {
      acc[source.type] = (acc[source.type] || 0) + 1;
      return acc;
    }, {});
  }


  groupByCategory(sources) {
    return sources.reduce((acc, source) => {
      const adapterInfo = getAdapterInfo(source.type);
      const category = adapterInfo?.category || 'other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
  }

 // mock data
  getMockConnectedSources() {
    return this.MockConnectedSources;
  }

  dispose() {
    // Clean up all active adapters
    this.activeAdapters.forEach(async (adapter, sourceId) => {
      if (adapter.disconnect) {
        try {
          await adapter.disconnect();
        } catch (error) {
          console.error(`Error disconnecting adapter ${sourceId}:`, error);
        }
      }
    });
    this.activeAdapters.clear();
  }
}

export default DataSourceService;