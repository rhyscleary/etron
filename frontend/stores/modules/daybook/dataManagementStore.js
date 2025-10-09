// day-book data sources using zustand

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { getWorkspaceId } from "../../../storage/workspaceStorage";
import { apiGet, apiDelete } from "../../../utils/api/apiClient";
import endpoints from "../../../utils/api/endpoints";

const useDataManagementStore = create(
  devtools(
    (set, get) => ({
      dataSources: [],
      selectedDataSource: null,
      isLoading: false,
      error: null,
      lastUpdated: null,

      fetchDataSources: async () => {
        set(
          { isLoading: true, error: null },
          false,
          "dataManagement/fetchDataSources/start"
        );

        try {
          const workspaceId = await getWorkspaceId();

          if (!workspaceId) {
            console.warn(
              "[DataManagementStore] No workspace selected - returning empty array"
            );
            set(
              {
                dataSources: [],
                isLoading: false,
                error: null,
              },
              false,
              "dataManagement/fetchDataSources/noWorkspace"
            );
            return [];
          }

          const sources = await apiGet(
            endpoints.modules.day_book.data_sources.getDataSources,
            { workspaceId }
          );

          set(
            {
              dataSources: Array.isArray(sources) ? sources : [],
              isLoading: false,
              lastUpdated: new Date().toISOString(),
            },
            false,
            "dataManagement/fetchDataSources/success"
          );

          return sources;
        } catch (error) {
          console.error(
            "[DataManagementStore] Error fetching data sources:",
            error
          );
          set(
            {
              isLoading: false,
              error: error.message || "Failed to fetch data sources",
            },
            false,
            "dataManagement/fetchDataSources/error"
          );
          throw error;
        }
      },

      selectDataSource: (source) => {
        set(
          { selectedDataSource: source },
          false,
          "dataManagement/selectDataSource"
        );
      },

      deleteDataSource: async (sourceId) => {
        try {
          const workspaceId = await getWorkspaceId();
          await apiDelete(
            endpoints.modules.day_book.data_sources.delete(
              workspaceId,
              sourceId
            )
          );

          set(
            (state) => ({
              dataSources: state.dataSources.filter((s) => s.id !== sourceId),
              selectedDataSource:
                state.selectedDataSource?.id === sourceId
                  ? null
                  : state.selectedDataSource,
            }),
            false,
            "dataManagement/deleteDataSource"
          );

          return true;
        } catch (error) {
          console.error(
            "[DataManagementStore] Error deleting data source:",
            error
          );
          throw error;
        }
      },

      clearDataManagement: () => {
        set(
          {
            dataSources: [],
            selectedDataSource: null,
            isLoading: false,
            error: null,
          },
          false,
          "dataManagement/clear"
        );
      },
    }),
    { name: "DataManagementStore" }
  )
);

export default useDataManagementStore;
