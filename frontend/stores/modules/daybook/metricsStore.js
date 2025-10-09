// day-book metrics using zustand

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { getWorkspaceId } from "../../../storage/workspaceStorage";
import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
} from "../../../utils/api/apiClient";
import endpoints from "../../../utils/api/endpoints";
import { getCurrentUser } from "aws-amplify/auth";

const useMetricsStore = create(
  devtools(
    (set, get) => ({
      metrics: [],
      metricsUser: [],
      metricsOther: [],
      selectedMetric: null,
      isLoading: false,
      error: null,
      lastUpdated: null,

      fetchMetrics: async () => {
        set(
          { isLoading: true, error: null },
          false,
          "metrics/fetchMetrics/start"
        );

        try {
          const workspaceId = await getWorkspaceId();
          const metricData = await apiGet(
            endpoints.modules.day_book.metrics.getMetrics,
            { workspaceId }
          );

          const metrics = Array.isArray(metricData) ? metricData : [];

          const { userId } = await getCurrentUser();
          const metricsUser = metrics.filter(
            (metric) => metric.createdBy === userId
          );
          const metricsOther = metrics.filter(
            (metric) => metric.createdBy !== userId
          );

          set(
            {
              metrics,
              metricsUser,
              metricsOther,
              isLoading: false,
              lastUpdated: new Date().toISOString(),
            },
            false,
            "metrics/fetchMetrics/success"
          );

          return metrics;
        } catch (error) {
          console.error("[MetricsStore] Error fetching metrics:", error);
          set(
            {
              isLoading: false,
              error: error.message || "Failed to fetch metrics",
            },
            false,
            "metrics/fetchMetrics/error"
          );
          throw error;
        }
      },

      selectMetric: (metric) => {
        set({ selectedMetric: metric }, false, "metrics/selectMetric");
      },

      createMetric: async (metricData) => {
        try {
          const workspaceId = await getWorkspaceId();
          const newMetric = await apiPost(
            endpoints.modules.day_book.metrics.create,
            { workspaceId, ...metricData }
          );

          set(
            (state) => ({
              metrics: [...state.metrics, newMetric],
            }),
            false,
            "metrics/createMetric"
          );

          await get().fetchMetrics();

          return newMetric;
        } catch (error) {
          console.error("[MetricsStore] Error creating metric:", error);
          throw error;
        }
      },

      updateMetric: async (metricId, updates) => {
        try {
          const workspaceId = await getWorkspaceId();
          const updated = await apiPut(
            endpoints.modules.day_book.metrics.update(workspaceId, metricId),
            updates
          );

          set(
            (state) => ({
              metrics: state.metrics.map((m) =>
                m.id === metricId ? updated : m
              ),
              selectedMetric:
                state.selectedMetric?.id === metricId
                  ? updated
                  : state.selectedMetric,
            }),
            false,
            "metrics/updateMetric"
          );

          return updated;
        } catch (error) {
          console.error("[MetricsStore] Error updating metric:", error);
          throw error;
        }
      },

      deleteMetric: async (metricId) => {
        try {
          const workspaceId = await getWorkspaceId();
          await apiDelete(
            endpoints.modules.day_book.metrics.delete(workspaceId, metricId)
          );

          set(
            (state) => ({
              metrics: state.metrics.filter((m) => m.id !== metricId),
              selectedMetric:
                state.selectedMetric?.id === metricId
                  ? null
                  : state.selectedMetric,
            }),
            false,
            "metrics/deleteMetric"
          );

          await get().fetchMetrics();

          return true;
        } catch (error) {
          console.error("[MetricsStore] Error deleting metric:", error);
          throw error;
        }
      },

      clearMetrics: () => {
        set(
          {
            metrics: [],
            metricsUser: [],
            metricsOther: [],
            selectedMetric: null,
            isLoading: false,
            error: null,
          },
          false,
          "metrics/clear"
        );
      },
    }),
    { name: "MetricsStore" }
  )
);

export default useMetricsStore;
