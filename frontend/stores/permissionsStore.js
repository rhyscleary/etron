// permissions storage wrapper using zustand

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  getPermissions,
  savePermissions,
  removePermissions,
} from "../storage/permissionsStorage";

const usePermissionsStore = create(
  devtools(
    (set) => ({
      permissions: null,

      loadPermissions: async () => {
        try {
          const permissions = await getPermissions();
          set({ permissions }, false, "permissions/load");
          return permissions;
        } catch (error) {
          console.error("[PermissionsStore] Error loading permissions:", error);
          throw error;
        }
      },

      savePermissionsData: async (permissionsData) => {
        try {
          await savePermissions(permissionsData);
          set({ permissions: permissionsData }, false, "permissions/save");
        } catch (error) {
          console.error("[PermissionsStore] Error saving permissions:", error);
          throw error;
        }
      },

      clearPermissions: async () => {
        try {
          await removePermissions();
          set({ permissions: null }, false, "permissions/clear");
        } catch (error) {
          console.error(
            "[PermissionsStore] Error clearing permissions:",
            error
          );
          throw error;
        }
      },
    }),
    { name: "PermissionsStore" }
  )
);

export default usePermissionsStore;
