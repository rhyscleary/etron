
import DataSourceService from "../services/DataSourceService";
import apiClient from "../utils/api/apiClient";

const dataSourceService = new DataSourceService(apiClient);

export default function useDataSource() {
  return {
    getConnectedDataSources: dataSourceService.getConnectedDataSources.bind(dataSourceService),
    connectDataSource: dataSourceService.connectDataSource.bind(dataSourceService),
    updateDataSource: dataSourceService.updateDataSource.bind(dataSourceService),
    disconnectDataSource: dataSourceService.disconnectDataSource.bind(dataSourceService),
    getDataSource: dataSourceService.getDataSource.bind(dataSourceService),
    fetchDataFromSource: dataSourceService.fetchDataFromSource.bind(dataSourceService),
    dataSourceService,
  };
}
