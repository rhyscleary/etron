// day-book reports using zustand

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { getWorkspaceId } from "../../../storage/workspaceStorage";
import { apiGet, apiPost, apiDelete } from "../../../utils/api/apiClient";
import endpoints from "../../../utils/api/endpoints";

const useReportsStore = create(
  devtools(
    (set, get) => ({
      reports: [],
      drafts: [],
      templates: [],
      selectedReport: null,
      isLoading: false,
      error: null,
      lastUpdated: null,

      fetchReports: async () => {
        set(
          { isLoading: true, error: null },
          false,
          "reports/fetchReports/start"
        );

        try {
          const workspaceId = await getWorkspaceId();
          const reportsData = await apiGet(
            endpoints.modules.day_book.reports.getReports,
            { workspaceId }
          );

          const reports = Array.isArray(reportsData) ? reportsData : [];

          set(
            {
              reports,
              isLoading: false,
              lastUpdated: new Date().toISOString(),
            },
            false,
            "reports/fetchReports/success"
          );

          return reports;
        } catch (error) {
          console.error("[ReportsStore] Error fetching reports:", error);
          set(
            {
              isLoading: false,
              error: error.message || "Failed to fetch reports",
            },
            false,
            "reports/fetchReports/error"
          );
          throw error;
        }
      },

      fetchDrafts: async () => {
        try {
          const workspaceId = await getWorkspaceId();
          const draftsData = await apiGet(
            endpoints.modules.day_book.reports.getDrafts,
            { workspaceId }
          );

          const drafts = Array.isArray(draftsData) ? draftsData : [];

          set({ drafts }, false, "reports/fetchDrafts/success");

          return drafts;
        } catch (error) {
          console.error("[ReportsStore] Error fetching drafts:", error);
          throw error;
        }
      },

      fetchTemplates: async () => {
        try {
          const workspaceId = await getWorkspaceId();
          const templatesData = await apiGet(
            endpoints.modules.day_book.reports.getTemplates,
            { workspaceId }
          );

          const templates = Array.isArray(templatesData) ? templatesData : [];

          set({ templates }, false, "reports/fetchTemplates/success");

          return templates;
        } catch (error) {
          console.error("[ReportsStore] Error fetching templates:", error);
          throw error;
        }
      },

      createReport: async (reportData) => {
        try {
          const workspaceId = await getWorkspaceId();
          const newReport = await apiPost(
            endpoints.modules.day_book.reports.create,
            { workspaceId, ...reportData }
          );

          set(
            (state) => ({
              reports: [...state.reports, newReport],
            }),
            false,
            "reports/createReport"
          );

          return newReport;
        } catch (error) {
          console.error("[ReportsStore] Error creating report:", error);
          throw error;
        }
      },

      saveDraft: async (draftData) => {
        try {
          const workspaceId = await getWorkspaceId();
          const draft = await apiPost(
            endpoints.modules.day_book.reports.saveDraft,
            { workspaceId, ...draftData }
          );

          set(
            (state) => ({
              drafts: [...state.drafts, draft],
            }),
            false,
            "reports/saveDraft"
          );

          return draft;
        } catch (error) {
          console.error("[ReportsStore] Error saving draft:", error);
          throw error;
        }
      },

      deleteReport: async (reportId) => {
        try {
          const workspaceId = await getWorkspaceId();
          await apiDelete(
            endpoints.modules.day_book.reports.delete(workspaceId, reportId)
          );

          set(
            (state) => ({
              reports: state.reports.filter((r) => r.id !== reportId),
              selectedReport:
                state.selectedReport?.id === reportId
                  ? null
                  : state.selectedReport,
            }),
            false,
            "reports/deleteReport"
          );

          return true;
        } catch (error) {
          console.error("[ReportsStore] Error deleting report:", error);
          throw error;
        }
      },

      selectReport: (report) => {
        set({ selectedReport: report }, false, "reports/selectReport");
      },

      clearReports: () => {
        set(
          {
            reports: [],
            drafts: [],
            templates: [],
            selectedReport: null,
            isLoading: false,
            error: null,
          },
          false,
          "reports/clear"
        );
      },
    }),
    { name: "ReportsStore" }
  )
);

export default useReportsStore;
