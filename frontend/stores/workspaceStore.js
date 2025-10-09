// workspace storage wrapper using zustand

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  getWorkspaceInfo,
  saveWorkspaceInfo,
  removeWorkspaceInfo,
  getWorkspaceId,
} from "../storage/workspaceStorage";

const useWorkspaceStore = create(
  devtools(
    (set) => ({
      workspace: null,
      workspaceId: null,
      error: null,

      loadWorkspace: async () => {
        try {
          const workspace = await getWorkspaceInfo();
          const workspaceId = await getWorkspaceId();
          set({ workspace, workspaceId, error: null }, false, "workspace/load");
          return workspace;
        } catch (error) {
          set(
            { error: error.message || "Failed to load workspace" },
            false,
            "workspace/load/error"
          );
          console.error("[WorkspaceStore] Error loading workspace:", error);
          throw error;
        }
      },

      saveWorkspaceInfo: async (workspace) => {
        try {
          await saveWorkspaceInfo(workspace);
          const workspaceId = await getWorkspaceId();
          set(
            {
              workspace,
              workspaceId,
              error: null,
            },
            false,
            "workspace/saveWorkspaceInfo"
          );
        } catch (error) {
          set(
            { error: error.message || "Failed to save workspace info" },
            false,
            "workspace/saveWorkspaceInfo/error"
          );
          console.error("[WorkspaceStore] Error saving workspace:", error);
          throw error;
        }
      },

      clearWorkspace: async () => {
        try {
          await removeWorkspaceInfo();
          set(
            { workspace: null, workspaceId: null, error: null },
            false,
            "workspace/clear"
          );
        } catch (error) {
          set(
            { error: error.message || "Failed to clear workspace" },
            false,
            "workspace/clear/error"
          );
          console.error("[WorkspaceStore] Error clearing workspace:", error);
          throw error;
        }
      },
    }),
    { name: "WorkspaceStore" }
  )
);

export default useWorkspaceStore;
