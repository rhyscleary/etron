import {
  getAdapterInfo,
  createDataAdapter,
} from "../adapters/day-book/data-sources/DataAdapterFactory";
import endpoints from "../utils/api/endpoints";
import AuthService from "./AuthService";
import { demoConfigManager } from "../config/demoConfig";

class DataSourceService {
  constructor(apiClient, options = {}) {
    this.apiClient = apiClient;
    this.activeAdapters = new Map();
    this.providerConnections = new Map();
  this.isDemoMode = this.determineDemoMode(options);
  // temporary, service-local fallback flag used when remote APIs fail
  // This must NOT mutate centralized demoConfigManager — it's transient only
  this.tempDemoMode = false;
  this.demoSources = this.createMockDataSources();
    this.setupDemoConfigListener();
  }

  determineDemoMode(options) {
    if (options.demoMode !== undefined) return options.demoMode;
    // Only treat dataSources as a global demo toggle when the centralized config
    // uses a boolean for components.dataSources. If it's an object map (per-type)
    // we should NOT flip the service-level demo flag just because some types are
    // enabled; only the per-type checks should drive adapter/demo behavior.
    try {
      const dsConfig = demoConfigManager.getConfig().components?.dataSources;
      if (typeof dsConfig === 'boolean') return dsConfig === true;
    } catch (e) {
      // ignore and fallback
    }
    return options.fallbackToDemo || (typeof __DEV__ !== "undefined" ? __DEV__ : false);
  }

  setupDemoConfigListener() {
    this.demoConfigUnsubscribe = demoConfigManager.addListener((newConfig, oldConfig) => {
      const oldDS = oldConfig?.components?.dataSources;
      const newDS = newConfig.components.dataSources;

      // If both old and new are booleans, treat as global toggle
      if (typeof oldDS === 'boolean' && typeof newDS === 'boolean') {
        if (oldDS !== newDS) {
          this.isDemoMode = newDS;
          this.clearAllAdapterCache();
          if (newDS) this.demoSources = this.createMockDataSources();
        }
        return;
      }

      // For maps or other changes, only refresh if the dataSources value actually changed
      const oldSerialized = JSON.stringify(oldDS === undefined ? null : oldDS);
      const newSerialized = JSON.stringify(newDS === undefined ? null : newDS);
      if (oldSerialized === newSerialized) {
        // nothing relevant changed
        return;
      }

      // Some dataSources entries changed; refresh demo sources
      this.clearAllAdapterCache();
      this.demoSources = this.createMockDataSources();
    });
  }

  createMockDataSources() {
    const demoConfig = demoConfigManager.getConfig();
    const baseTimestamp = Date.now();
    console.log('[DataSourceService] Creating mock data sources, demoConfig:', demoConfig);
    const sources = [
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
          defaultEndpoint: "/posts",
        },
        testResult: {
          status: "success",
          responseTime: demoConfig.data.simulateNetworkDelay ? "245ms" : "1ms",
          statusCode: 200,
          contentType: "application/json",
        },
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
          defaultEndpoint: "/weather",
        },
        testResult: {
          status: "success",
          responseTime: demoConfig.data.simulateNetworkDelay ? "180ms" : "1ms",
          statusCode: 200,
          contentType: "application/json",
        },
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
          isDemoMode: true,
        },
        testResult: {
          status: "success",
          responseTime: demoConfig.data.simulateNetworkDelay ? "320ms" : "1ms",
          statusCode: 200,
          contentType: "application/json",
        },
      },
      {
        id: "demo_excel_1642116400000",
        type: "microsoft-excel",
        name: "Financial Report (Demo)",
        status: "connected",
        lastSync: new Date().toISOString(),
        createdAt: "2024-01-17T13:00:00Z",
        config: {
          workbookId: "demo_financial_workbook_456",
          worksheetName: "Q4 Report",
          isDemoMode: true,
        },
        testResult: {
          status: "success",
          responseTime: demoConfig.data.simulateNetworkDelay ? "280ms" : "1ms",
          statusCode: 200,
          contentType: "application/json",
        },
      },
    ];
    console.log('[DataSourceService] Base mock sources created:', sources.length, 'sources');
    console.log('[DataSourceService] Source types:', sources.map(s => s.type));
    if (demoConfig.data.includeExtendedSamples) {
      sources.push(
        {
          id: `demo_database_${baseTimestamp + 1000}`,
          type: "database",
          name: "Sample Database (Demo)",
          status: "connected",
          lastSync: new Date().toISOString(),
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          config: {
            connectionString: "demo://localhost:5432/sampledb",
            isDemoMode: true,
          },
          testResult: {
            status: "success",
            responseTime: demoConfig.data.simulateNetworkDelay ? "150ms" : "1ms",
            statusCode: 200,
            contentType: "application/json",
          },
        },
        {
          id: `demo_csv_${baseTimestamp + 2000}`,
          type: "csv-file",
          name: "Sales Data CSV (Demo)",
          status: "connected",
          lastSync: new Date().toISOString(),
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          config: {
            filePath: "/demo/sales_data.csv",
            hasHeaders: true,
            isDemoMode: true,
          },
          testResult: {
            status: "success",
            responseTime: demoConfig.data.simulateNetworkDelay ? "50ms" : "1ms",
            statusCode: 200,
            contentType: "text/csv",
          },
        }
      );
    }
    console.log('[DataSourceService] Final mock sources:', sources.length, 'total sources');
    console.log('[DataSourceService] All source types:', sources.map(s => s.type));
    return sources;
  }

  isDemoModeActive() {
  // Treat service-level demo as active only when explicitly enabled globally
  // (legacy boolean) or when the service has a transient/local demo flag.
  try {
    const dsCfg = demoConfigManager.getConfig().components?.dataSources;
    const globalDs = typeof dsCfg === 'boolean' ? dsCfg === true : false;
    return this.isDemoMode || this.tempDemoMode || globalDs;
  } catch (e) {
    return this.isDemoMode || this.tempDemoMode;
  }
  }

  async simulateDemoDelay(operation = "default") {
    if (!this.isDemoModeActive()) return;
    const demoConfig = demoConfigManager.getConfig();
    if (!demoConfig.data.simulateNetworkDelay) return;
    const delays = { default: 500, connect: 1000, test: 800, fetch: 300, update: 400, delete: 600 };
    const delay = delays[operation] || delays.default;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  async getAuthService() {
    return await AuthService.createAuthServiceObject();
  }

  async getConnectedDataSources() {
    // Prevent recursive re-entry which can cause stack overflows
    if (this._getConnectedPromise) {
      return this._getConnectedPromise;
    }
    this._getConnectedPromise = (async () => {
    const demoConfig = demoConfigManager.getConfig();
    const dsConfig = demoConfig.components?.dataSources;

    // If components.dataSources is a boolean and demo mode is active, return demo sources
    if (typeof dsConfig === 'boolean' && dsConfig === true) {
      await this.simulateDemoDelay("fetch");
      const filteredSources = this.demoSources.filter((source) => !source.config?.isProvider);
      console.log('[DataSourceService] getConnectedDataSources (demo mode):', filteredSources.length, 'sources');
      console.log('[DataSourceService] Demo source types:', filteredSources.map(s => s.type));
      return filteredSources;
    }

    // Otherwise fetch real sources and merge demo sources for types that are enabled in the map
    try {
      const response = await this.apiClient.get(
        endpoints.modules.day_book.data_sources.getDataSources()
      );
      const realSources = response.data.filter((source) => !source.config?.isProvider);

      // If dsConfig is an object map, replace real sources of demo-enabled types with demo sources
      if (dsConfig && typeof dsConfig === 'object') {
        const demoEnabledTypes = Object.entries(dsConfig).filter(([t, v]) => v).map(([t]) => t);
        const demoSourcesForTypes = this.demoSources.filter((s) => demoEnabledTypes.includes(s.type) && !s.config?.isProvider);
        // Keep real sources which are NOT demo-enabled
        const finalSources = realSources.filter((s) => !demoEnabledTypes.includes(s.type)).concat(demoSourcesForTypes);
        console.log('[DataSourceService] getConnectedDataSources (mixed mode):', finalSources.length, 'sources');
        return finalSources;
      }

      console.log('[DataSourceService] getConnectedDataSources (real mode):', realSources.length, 'sources');
      return realSources;
    } catch (error) {
  if (demoConfig.fallback.enableOnAuthFailure || demoConfig.fallback.enableOnApiFailure) {
        // Use a service-local fallback flag only for the duration of this call
        // instead of mutating the centralized config. Restore previous value
        // to avoid leaking fallback state into future adapter creation.
        const prevTemp = this.tempDemoMode;
        this.tempDemoMode = true;
        try {
          await this.simulateDemoDelay("fetch");
          // If dataSources is a per-type map, only include demo sources for types
          // that are enabled for demo. Otherwise include all demo sources.
          let filteredSources = this.demoSources.filter((source) => !source.config?.isProvider);
          if (dsConfig && typeof dsConfig === 'object') {
            const allowed = Object.entries(dsConfig).filter(([t, v]) => v).map(([t]) => t);
            filteredSources = filteredSources.filter(s => allowed.includes(s.type));
          }
          console.log('[DataSourceService] getConnectedDataSources (fallback to demo):', filteredSources.length, 'sources');
          return filteredSources;
        } finally {
          this.tempDemoMode = prevTemp;
        }
      }
      throw error;
    }
    })();
    try {
      return await this._getConnectedPromise;
    } finally {
      this._getConnectedPromise = null;
    }
  }

  getProviderConnection(type) {
    if (this.isDemoModeActive()) {
      return this.demoSources.find((source) => source.type === type && source.config?.isProvider);
    }
    return this.providerConnections.get(type);
  }

  isProviderConnected(type) {
    const connection = this.getProviderConnection(type);
    return connection && connection.status === "connected";
  }

  async getDataSource(sourceId) {
    // Guard against recursive re-entry
    if (this._getDataSourcePromise && this._lastGetDataSourceId === sourceId) {
      return this._getDataSourcePromise;
    }
    this._lastGetDataSourceId = sourceId;
    this._getDataSourcePromise = (async () => {
    // If the requested source is a demo source id or its type is configured for demo, return demo
    const demoConfig = demoConfigManager.getConfig();
    const dsConfig = demoConfig.components?.dataSources;
    if (sourceId.startsWith('demo_')) {
      await this.simulateDemoDelay("fetch");
      const demoSource = this.demoSources.find((source) => source.id === sourceId);
      if (!demoSource) throw new Error(`Demo data source ${sourceId} not found`);
      return demoSource;
    }
    try {
      const response = await this.apiClient.get(
        endpoints.modules.day_book.data_sources.getDataSource(sourceId)
      );
      return response.data;
    } catch (error) {
      const demoConfig = demoConfigManager.getConfig();
      const dsCfg = demoConfig.components?.dataSources;
      const typeIsExplicitlyDisabled = typeof dsCfg === 'object' && dsCfg && dsCfg[sourceId?.type] === false;
      if (sourceId.startsWith("demo_") || demoConfig.fallback.enableOnApiFailure) {
        // If this source's type is explicitly disabled for demo in per-type config,
        // do not fallback to demo for this specific source.
        if (typeof dsCfg === 'object' && !sourceId.startsWith('demo_')) {
          const requestedType = null; // we don't have type here; fall through to default behavior
        }
        // Temporarily enter service-local fallback mode and return a demo source
        const prevTemp = this.tempDemoMode;
        this.tempDemoMode = true;
        try {
          await this.simulateDemoDelay("fetch");
          const demoSource = this.demoSources.find((source) => source.id === sourceId) || this.demoSources[0];
          // If the demoSource's type is explicitly disabled, do not return it
          if (demoSource) {
            const dsConfigMap = demoConfig.components?.dataSources;
            if (typeof dsConfigMap === 'object' && dsConfigMap && dsConfigMap[demoSource.type] === false) {
              throw new Error(`Demo fallback not allowed for type ${demoSource.type}`);
            }
          }
          if (demoSource) return demoSource;
          // If no demo source exists, throw a clearer error instead of recursing
          throw new Error(`Unable to load data source and no demo substitute available for ${sourceId}`);
        } finally {
          this.tempDemoMode = prevTemp;
        }
      }
      throw new Error("Unable to load data source");
    }
    })();
    try {
      return await this._getDataSourcePromise;
    } finally {
      this._getDataSourcePromise = null;
      this._lastGetDataSourceId = null;
    }
  }

  async fetchDataFromSource(sourceId, options = {}) {
    try {
      const dataSource = await this.getDataSource(sourceId);
      if (!dataSource) throw new Error(`Data source ${sourceId} not found`);
  // Use per-type demo setting for delay
  const typeIsDemo = demoConfigManager.isDataSourceTypeInDemo(dataSource.type);
  if (typeIsDemo) await this.simulateDemoDelay("fetch");
      const adapter = await this.getAdapter(dataSource.type, dataSource.config);
      if (!adapter.fetchRawData || typeof adapter.fetchRawData !== "function")
        throw new Error(`Adapter for ${dataSource.type} does not support data fetching`);
      const {
        endpoint = dataSource.config?.defaultEndpoint || "/",
        method = "GET",
        params = {},
      } = options;
      const rawResponse = await adapter.fetchRawData(endpoint, method, params);
      const transformedData = this.transformRawData(rawResponse, dataSource, {
        endpoint,
        method,
        sourceId,
      });
      await this.updateLastSync(sourceId);
      return transformedData;
    } catch (error) {
      try {
        await this.updateDataSourceStatus(sourceId, "error", error.message);
      } catch {}
      throw new Error(`Failed to fetch data: ${error.message}`);
    }
  }

  transformRawData(rawResponse, dataSource, requestInfo) {
    let data = [];
    let headers = [];
    if (Array.isArray(rawResponse.data)) {
      data = rawResponse.data;
      headers = data.length > 0 ? Object.keys(data[0]) : [];
    } else if (rawResponse.data && typeof rawResponse.data === "object") {
      data = [rawResponse.data];
      headers = Object.keys(rawResponse.data);
    } else {
      data = [{ value: rawResponse.data }];
      headers = ["value"];
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
        contentType: rawResponse.headers?.["content-type"] || "unknown",
        lastUpdated: new Date().toISOString(),
        recordCount: data.length,
        isDemoData: dataSource.config?.isDemoMode || this.isDemoModeActive(),
        demoMode: this.isDemoModeActive() ? "active" : "disabled",
      },
    };
  }

  async getAdapter(type, config = {}) {
  const adapterKey = `${type}_${JSON.stringify(config)}_demo:${demoConfigManager.isDataSourceTypeInDemo(type)}`;
    if (this.activeAdapters.has(adapterKey)) return this.activeAdapters.get(adapterKey);
    try {
      const authService = await this.getAuthService();
      console.log('[DataSourceService] getAdapter creating adapter', { type, config });
      const adapter = createDataAdapter(type, {
        ...config,
        fallbackToDemo: demoConfigManager.getConfig().fallback.enableOnApiFailure,
        apiClient: this.apiClient,
        authService,
      });
      if (!adapter) throw new Error(`No adapter found for type: ${type}`);
      this.activeAdapters.set(adapterKey, adapter);
      return adapter;
    } catch (error) {
      console.error('[DataSourceService] getAdapter error', { type, error });
      throw new Error(`Failed to initialize ${type} adapter: ${error.message}`);
    }
  }

  async connectDataSource(type, config, name) {
    // Use per-type demo setting to decide whether to create a demo source
    const typeIsDemo = demoConfigManager.isDataSourceTypeInDemo(type);
    // Debug: show why we're choosing demo vs real
    console.log('[DataSourceService] connectDataSource decision', {
      type,
      name,
      typeIsDemo,
      serviceIsDemo: this.isDemoMode,
      centralizedDataSourcesConfig: demoConfigManager.getConfig().components?.dataSources,
    });
    if (typeIsDemo) {
      await this.simulateDemoDelay("connect");
      const newDemoSource = {
        id: `demo_${type}_${Date.now()}`,
        type,
        name: `${name} (Demo)`,
        status: "connected",
        lastSync: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        config: { ...config, isDemoMode: true },
        testResult: {
          status: "success",
          responseTime: demoConfigManager.getConfig().data.simulateNetworkDelay ? "245ms" : "1ms",
          statusCode: 200,
          contentType: "application/json",
        },
      };
      this.demoSources.push(newDemoSource);
      return newDemoSource;
    }
    try {
      console.log('[DataSourceService] connectDataSource calling testConnection', { type, name });
      const connectionData = await this.testConnection(type, config, name);

      console.log('[DataSourceService] connectDataSource - test result', {
        type,
        connectionDataSummary: {
          status: connectionData?.status,
          testResultKeys: connectionData?.testResult ? Object.keys(connectionData.testResult) : null,
          sampleDataDemoFlag: connectionData?.testResult?.sampleData?.demoMode,
          demoModeFlag: connectionData?.testResult?.demoMode,
        },
        managerPerTypeFlag: demoConfigManager.isDataSourceTypeInDemo(type),
        managerConfig: demoConfigManager.getConfig().components?.dataSources,
      });

      // If the adapter's test returned a demo-style response (adapter fell back to demo),
      // handle creation locally and only when per-type demo is allowed.
      const testIsDemo = connectionData && connectionData.testResult && (
        connectionData.testResult.sampleData?.demoMode === true || connectionData.testResult.demoMode === true
      );
      const typeAllowedForDemo = demoConfigManager.isDataSourceTypeInDemo(type);
      if (testIsDemo) {
        console.log('[DataSourceService] connectDataSource: test result indicates demo fallback', { type, testIsDemo, typeAllowedForDemo });
        if (typeAllowedForDemo === false) {
          throw new Error('Connection test fell back to demo but per-type demo is explicitly disabled');
        }
        // Create demo source locally instead of attempting to post to server
        await this.simulateDemoDelay("connect");
        const newDemoSource = {
          id: `demo_${type}_${Date.now()}`,
          type,
          name: `${name} (Demo)`,
          status: "connected",
          lastSync: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          config: { ...config, isDemoMode: true },
          testResult: connectionData.testResult,
        };
        this.demoSources.push(newDemoSource);
        console.log('[DataSourceService] connectDataSource: created demo source from test fallback', { id: newDemoSource.id });
        return newDemoSource;
      }

      const response = await this.apiClient.post(
        endpoints.modules.day_book.data_sources.add(),
        {
          type,
          name,
          config,
          status: "connected",
          testResult: connectionData,
        }
      );
      return response.data;
    } catch (error) {
      const demoConfig = demoConfigManager.getConfig();
      console.log('[DataSourceService] connectDataSource error', { type, name, error: error?.message, demoFallbackEnabled: demoConfig.fallback.enableOnApiFailure, centralizedDataSourcesConfig: demoConfig.components?.dataSources });
      if (demoConfig.fallback.enableOnApiFailure) {
        // Use the manager API to decide if this type is explicitly disabled.
        const typeIsExplicitlyDemo = demoConfigManager.isDataSourceTypeInDemo(type);
        console.log('[DataSourceService] connectDataSource fallback check', { type, typeIsExplicitlyDemo });
        if (typeIsExplicitlyDemo === false) {
          console.log('[DataSourceService] connectDataSource: per-type demo explicitly disabled via manager, not falling back to demo');
          throw error;
        }
        // Temporarily enter service-local fallback mode and create a demo source
        const prevTemp = this.tempDemoMode;
        this.tempDemoMode = true;
        try {
          await this.simulateDemoDelay("connect");
          const newDemoSource = {
            id: `demo_${type}_${Date.now()}`,
            type,
            name: `${name} (Demo)`,
            status: "connected",
            lastSync: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            config: { ...config, isDemoMode: true },
            testResult: {
              status: "success",
              responseTime: demoConfigManager.getConfig().data.simulateNetworkDelay ? "245ms" : "1ms",
              statusCode: 200,
              contentType: "application/json",
            },
          };
          this.demoSources.push(newDemoSource);
          console.log('[DataSourceService] connectDataSource: created demo source as fallback', { id: newDemoSource.id, type: newDemoSource.type });
          return newDemoSource;
        } finally {
          this.tempDemoMode = prevTemp;
        }
      }
      throw error;
    }
  }

  async updateDataSource(sourceId, updates) {
    if (this.isDemoModeActive()) {
      await this.simulateDemoDelay("update");
      const sourceIndex = this.demoSources.findIndex((s) => s.id === sourceId);
      if (sourceIndex !== -1) {
        this.demoSources[sourceIndex] = {
          ...this.demoSources[sourceIndex],
          ...updates,
          lastSync: new Date().toISOString(),
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
      if (updates.config) this.clearAdapterCache(sourceId);
      return response.data;
    } catch {
      throw new Error("Failed to update data source");
    }
  }

  async disconnectDataSource(sourceId) {
    if (this.isDemoModeActive()) {
      await this.simulateDemoDelay("delete");
      const sourceIndex = this.demoSources.findIndex((s) => s.id === sourceId);
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
      this.clearAdapterCache(sourceId);
      return true;
    } catch {
      throw new Error("Failed to disconnect data source");
    }
  }

  async testConnection(type, config, name) {
    try {
      if (this.isDemoModeActive()) await this.simulateDemoDelay("test");
      const authService = await this.getAuthService();
  // Reuse getAdapter (uses same factory) so we don't accidentally pass
  // transient fallback signals into normal adapter creation.
  const adapter = await this.getAdapter(type, config);
      if (!adapter || !adapter.testConnection)
        throw new Error(`Adapter for ${type} does not support connection testing`);
      const testResult = await adapter.testConnection(
        config.url || config.connectionString,
        config.headers,
        config.authentication
      );
      return {
        type,
        name,
        config: { ...config, isDemoMode: this.isDemoModeActive() },
        status: "success",
        testResult,
        createdAt: new Date().toISOString(),
        lastTested: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Connection test failed: ${error.message}`);
    }
  }

  async updateLastSync(sourceId) {
    try {
      if (this.isDemoModeActive()) {
        const sourceIndex = this.demoSources.findIndex((s) => s.id === sourceId);
        if (sourceIndex !== -1) this.demoSources[sourceIndex].lastSync = new Date().toISOString();
        return;
      }
      await this.updateDataSource(sourceId, { lastSync: new Date().toISOString() });
    } catch {}
  }

  async updateDataSourceStatus(sourceId, status, error = null) {
    try {
      if (this.isDemoModeActive()) {
        const sourceIndex = this.demoSources.findIndex((s) => s.id === sourceId);
        if (sourceIndex !== -1) {
          this.demoSources[sourceIndex].status = status;
          if (error) this.demoSources[sourceIndex].error = error;
        }
        return;
      }
      const updates = { status };
      if (error) updates.error = error;
      await this.updateDataSource(sourceId, updates);
    } catch {}
  }

  clearAdapterCache(sourceId) {
    const keysToRemove = [];
    for (const key of this.activeAdapters.keys()) {
      if (key.includes(sourceId)) keysToRemove.push(key);
    }
    keysToRemove.forEach((key) => this.activeAdapters.delete(key));
  }

  clearAllAdapterCache() {
    this.activeAdapters.clear();
  }

  async getDataSourceStats() {
    try {
      const sources = await this.getConnectedDataSources();
      return {
        total: sources.length,
        connected: sources.filter((s) => s.status === "connected").length,
        errors: sources.filter((s) => s.status === "error").length,
        byType: this.groupByType(sources),
        byCategory: this.groupByCategory(sources),
        demoMode: {
          isActive: this.isDemoModeActive(),
          config: demoConfigManager.getConfig(),
          demoSourceCount: this.isDemoModeActive() ? sources.length : 0,
          realSourceCount: this.isDemoModeActive() ? 0 : sources.length,
        },
      };
    } catch (error) {
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
      const category = adapterInfo?.category || "other";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
  }

  async getAvailableDataSources(sourceId) {
    try {
      const dataSource = await this.getDataSource(sourceId);
      const adapter = await this.getAdapter(dataSource.type, dataSource.config);
      if (adapter.getDataSources && typeof adapter.getDataSources === "function") {
        return await adapter.getDataSources();
      }
      return [
        {
          id: `${sourceId}_default`,
          name: `${dataSource.name} - Default`,
          type: "default",
          lastModified: dataSource.lastSync || dataSource.createdAt,
        },
      ];
    } catch {
      throw new Error("Failed to discover available data sources");
    }
  }

  async connectProvider(type) {
    try {
      if (this.isDemoModeActive()) await this.simulateDemoDelay("connect");
      const adapter = await this.getAdapter(type);
      if (!adapter || !adapter.connect)
        throw new Error(`Adapter for ${type} does not support provider connection`);
      const connectionResult = await adapter.connect();
      const providerConnection = {
        id: `provider_${type}_${Date.now()}`,
        type,
        name: `${this.getDisplayName(type)} Provider`,
        status: "connected",
        lastSync: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        config: {
          isProvider: true,
          connectionResult,
          isDemoMode: this.isDemoModeActive(),
        },
        testResult: {
          status: "success",
          responseTime: demoConfigManager.getConfig().data.simulateNetworkDelay ? "200ms" : "1ms",
          statusCode: 200,
          contentType: "application/json",
        },
      };
      if (this.isDemoModeActive()) {
        this.demoSources.push(providerConnection);
      } else {
        this.providerConnections.set(type, providerConnection);
      }
      return providerConnection;
    } catch (error) {
      throw new Error(`Failed to connect ${type} provider: ${error.message}`);
    }
  }

  async disconnectProvider(type) {
    try {
      if (this.isDemoModeActive()) await this.simulateDemoDelay("delete");
      if (this.isDemoModeActive()) {
        const sourceIndex = this.demoSources.findIndex(
          (s) => s.type === type && s.config?.isProvider
        );
        if (sourceIndex !== -1) this.demoSources.splice(sourceIndex, 1);
      } else {
        this.providerConnections.delete(type);
      }
      this.clearAdapterCacheByType(type);
      return true;
    } catch (error) {
      throw new Error(`Failed to disconnect ${type} provider: ${error.message}`);
    }
  }

  clearAdapterCacheByType(type) {
    const keysToRemove = [];
    for (const key of this.activeAdapters.keys()) {
      if (key.startsWith(type)) keysToRemove.push(key);
    }
    keysToRemove.forEach((key) => this.activeAdapters.delete(key));
  }

  async syncDataSource(sourceId, options = {}) {
    return this.fetchDataFromSource(sourceId, options);
  }

  enableDemoMode() {
  // Enable demo locally for the service without mutating centralized config.
  this.isDemoMode = true;
  this.tempDemoMode = true;
  }

  getDemoModeInfo() {
    const demoConfig = demoConfigManager.getConfig();
    return {
      isDemoMode: this.isDemoModeActive(),
      demoSourceCount: this.demoSources.filter((s) => !s.config?.isProvider).length,
      availableDemoTypes: [
        ...new Set(this.demoSources.filter((s) => !s.config?.isProvider).map((s) => s.type)),
      ],
      centralizedConfig: {
        mode: demoConfig.mode,
        isActive: demoConfigManager.isDemoActive(),
        components: demoConfig.components,
        behavior: demoConfig.behavior,
        data: demoConfig.data,
      },
      fallbackConfig: demoConfig.fallback,
    };
  }

  refreshFromCentralizedConfig() {
    const wasDemoMode = this.isDemoMode;
    this.isDemoMode = this.determineDemoMode({});
    if (wasDemoMode !== this.isDemoMode) {
      this.clearAllAdapterCache();
      if (this.isDemoMode) this.demoSources = this.createMockDataSources();
    }
    return this.isDemoMode;
  }

  getDemoStatus() {
    return {
      service: {
        isDemoMode: this.isDemoMode,
        sourceCount: this.demoSources.length,
        adapterCacheSize: this.activeAdapters.size,
        providerConnectionsSize: this.providerConnections.size,
      },
      centralized: demoConfigManager.getDemoStatus(),
      effective: this.isDemoModeActive(),
    };
  }

  getDisplayName(type) {
    const displayNames = {
      "google-sheets": "Google Sheets",
      "google-drive": "Google Drive",
      "microsoft-excel": "Microsoft Excel",
      onedrive: "OneDrive",
      dropbox: "Dropbox",
      "custom-api": "Custom API",
      database: "Database",
      "csv-file": "CSV File",
    };
    return displayNames[type] || type;
  }

  destroy() {
    if (this.demoConfigUnsubscribe) this.demoConfigUnsubscribe();
    this.clearAllAdapterCache();
    this.providerConnections.clear();
    this.demoSources = [];
  }
}

export default DataSourceService;
