// global data sources and app state using zustand

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import DataSourceService from "../services/DataSourceService";
import apiClient from "../utils/api/apiClient";

const dataSourceService = new DataSourceService(apiClient);

const useAppStore = create(
  devtools(
    (set, get) => ({
      dataSources: {
        list: [],
        count: 0,
        connected: [],
        errors: [],
        isDemoMode: false,
        updateTrigger: 0,
      },
      system: {
        isLoading: false,
        hasError: false,
        error: null,
      },

      recomputeDataSources: (list) => {
        const connected = Array.isArray(list)
          ? list.filter((s) => s?.status === "connected")
          : [];
        const errors = Array.isArray(list)
          ? list.filter((s) => s?.status === "error")
          : [];
        return {
          list: Array.isArray(list) ? list : [],
          count: Array.isArray(list) ? list.length : 0,
          connected,
          errors,
        };
      },

      refreshDataSources: async () => {
        set(
          (state) => ({
            system: {
              ...state.system,
              isLoading: true,
              hasError: false,
              error: null,
            },
          }),
          false,
          "app/refreshDataSources/start"
        );

        try {
          console.log(
            "[AppStore] refreshDataSources -> calling service.getConnectedDataSources"
          );
          const list = await dataSourceService.getConnectedDataSources();
          const stats = get().recomputeDataSources(list);

          set(
            (state) => ({
              dataSources: {
                ...state.dataSources,
                ...stats,
                updateTrigger: state.dataSources.updateTrigger + 1,
              },
              system: { isLoading: false, hasError: false, error: null },
            }),
            false,
            "app/refreshDataSources/success"
          );

          console.log("[AppStore] refreshDataSources success", {
            count: stats.count,
          });
        } catch (e) {
          const errorMsg = e?.message || "Failed to load data sources";

          // fail silently if no workspace (expected at startup)
          if (
            errorMsg.includes("No workspace selected") ||
            errorMsg.includes("workspace")
          ) {
            console.warn(
              "[AppStore] refreshDataSources - no workspace selected yet (expected at startup)"
            );
            set(
              (state) => ({
                dataSources: {
                  ...state.dataSources,
                  list: [],
                  count: 0,
                  connected: [],
                  errors: [],
                },
                system: { isLoading: false, hasError: false, error: null },
              }),
              false,
              "app/refreshDataSources/noWorkspace"
            );
            return;
          }

          console.error("[AppStore] refreshDataSources error", {
            message: errorMsg,
          });
          set(
            (state) => ({
              system: {
                ...state.system,
                isLoading: false,
                hasError: true,
                error: errorMsg,
              },
            }),
            false,
            "app/refreshDataSources/error"
          );
        }
      },

      connectDataSource: async (type, config, name) => {
        console.log("[AppStore] connectDataSource called", {
          type,
          config,
          name,
        });
        const created = await dataSourceService.connectDataSource(
          type,
          config,
          name
        );
        console.log("[AppStore] connectDataSource result", created);

        try {
          await get().refreshDataSources();
        } catch {}

        return created;
      },

      disconnectDataSource: async (sourceId) => {
        const ok = await dataSourceService.disconnectDataSource(sourceId);

        try {
          await get().refreshDataSources();
        } catch {}

        return ok;
      },

      testConnection: async (type, config, name) => {
        console.log("[AppStore] testConnection called", { type, config, name });
        const result = await dataSourceService.testConnection(
          type,
          config,
          name
        );
        console.log("[AppStore] testConnection success", {
          type,
          name,
          result: { status: result?.status },
        });
        return result;
      },

      forceUpdate: () => {
        set(
          (state) => ({
            dataSources: {
              ...state.dataSources,
              updateTrigger: state.dataSources.updateTrigger + 1,
            },
          }),
          false,
          "app/forceUpdate"
        );
      },

      getAppState: () => {
        const state = get();
        return { dataSources: state.dataSources, system: state.system };
      },

      debugAppState: () => {
        const state = get();
        console.log("[AppStore] state snapshot", {
          dataSourcesCount: state.dataSources.count,
          loading: state.system.isLoading,
          hasError: state.system.hasError,
        });
      },

      initialize: async () => {
        console.log("[AppStore] initialize - attempting to load data sources");
        try {
          await get().refreshDataSources();
        } catch (error) {
          console.log(
            "[AppStore] initialize - failed to load data sources (expected if no workspace):",
            error?.message
          );
        }
      },
    }),
    { name: "AppStore" }
  )
);

let initialized = false;
export const initializeAppStore = () => {
  if (!initialized) {
    initialized = true;
    useAppStore.getState().initialize();
  }
};

export default useAppStore;
