// TODO: this file can be extended to update the data sources after being notified by the backend (after processing webhook)
import { useState, useEffect, useCallback, useRef } from 'react';
import DataSourceService from '../services/DataSourceService';


const useDataSources = (apiClient, authService) => {
  const [dataSources, setDataSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const serviceRef = useRef(null);
  if (!serviceRef.current) {
    serviceRef.current = new DataSourceService(apiClient, authService);
  }
  const service = serviceRef.current;

  // load all data sources
  const loadDataSources = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      
      const sources = await service.getConnectedDataSources();
      setDataSources(sources);

      const sourceStats = await service.getDataSourceStats();
      setStats(sourceStats);
      
    } catch (err) {
      console.error('Failed to load data sources:', err);
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [service]);

  // connect a new data source
  const connectDataSource = useCallback(async (type, config, name) => {
    try {
      setError(null);
      const newSource = await service.connectDataSource(type, config, name);
      
      //add to local state
      setDataSources(prev => [...prev, newSource]);

      const sourceStats = await service.getDataSourceStats();
      setStats(sourceStats);
      
      return newSource;
    } catch (err) {
      console.error('Failed to connect data source:', err);
      setError(err.message);
      throw err;
    }
  }, [service]);


  const disconnectDataSource = useCallback(async (sourceId) => {
    try {
      setError(null);
      await service.disconnectDataSource(sourceId);
      
      // remove from local state
      setDataSources(prev => prev.filter(source => source.id !== sourceId));

      const sourceStats = await service.getDataSourceStats();
      setStats(sourceStats);
      
    } catch (err) {
      console.error('Failed to disconnect data source:', err);
      setError(err.message);
      throw err;
    }
  }, [service]);
  
  const updateDataSource = useCallback(async (sourceId, updates) => {
    try {
      setError(null);
      const updatedSource = await service.updateDataSource(sourceId, updates);
      
      // update local state
      setDataSources(prev => 
        prev.map(source => 
          source.id === sourceId 
            ? { ...source, ...updatedSource }
            : source
        )
      );
      
      return updatedSource;
    } catch (err) {
      console.error('Failed to update data source:', err);
      setError(err.message);
      throw err;
    }
  }, [service]);

  const testConnection = useCallback(async (sourceId) => {
    try {
      setError(null);
      
      setDataSources(prev => 
        prev.map(source => 
          source.id === sourceId 
            ? { ...source, status: 'testing' }
            : source
        )
      );
      
      const result = await service.testConnection(sourceId);

      await loadDataSources(false);
      
      return result;
    } catch (err) {
      console.error('Connection test failed:', err);
      setError(err.message);

      await loadDataSources(false);
      throw err;
    }
  }, [service, loadDataSources]);

  const syncDataSource = useCallback(async (sourceId) => {
    try {
      setError(null);
      
      // update local state to show syncing
      setDataSources(prev => 
        prev.map(source => 
          source.id === sourceId 
            ? { ...source, status: 'syncing' }
            : source
        )
      );
      
      const result = await service.syncDataSource(sourceId);
      
      // reload data sources to get updated status
      await loadDataSources(false);
      
      return result;
    } catch (err) {
      console.error('Sync failed:', err);
      setError(err.message);

      await loadDataSources(false);
      throw err;
    }
  }, [service, loadDataSources]);

  const getDataSource = useCallback(async (sourceId) => {
    try {
      return await service.getDataSource(sourceId);
    } catch (err) {
      console.error('Failed to get data source:', err);
      setError(err.message);
      throw err;
    }
  }, [service]);
 
  const refresh = useCallback(() => {
    return loadDataSources(true);
  }, [loadDataSources]);

  useEffect(() => {
    loadDataSources();
  }, [loadDataSources]);

  useEffect(() => {
    return () => {
      if (serviceRef.current) {
        serviceRef.current.dispose();
      }
    };
  }, []);

  const getSourcesByStatus = useCallback((status) => {
    return dataSources.filter(source => source.status === status);
  }, [dataSources]);

  const getSourcesByType = useCallback((type) => {
    return dataSources.filter(source => source.type === type);
  }, [dataSources]);

  const getSourcesByCategory = useCallback((category) => {
    return dataSources.filter(source => {
      const adapterInfo = service.getAdapterInfo?.(source.type);
      return adapterInfo?.category === category;
    });
  }, [dataSources, service]);

  

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

    connectedSources: dataSources.filter(s => s.status === 'connected'),
    errorSources: dataSources.filter(s => s.status === 'error'),
    totalSources: dataSources.length,
  };
};

export default useDataSources;