// user storage wrapper using zustand

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  getUserInfo,
  saveUserInfo,
  removeUserInfo,
} from "../storage/userStorage";

const useUserStore = create(
  devtools(
    (set) => ({
      user: null,

      loadUser: async () => {
        try {
          const user = await getUserInfo();
          set({ user }, false, "user/load");
          return user;
        } catch (error) {
          console.error("[UserStore] Error loading user:", error);
          throw error;
        }
      },

      saveUser: async (userData) => {
        try {
          await saveUserInfo(userData);
          set({ user: userData }, false, "user/save");
        } catch (error) {
          console.error("[UserStore] Error saving user:", error);
          throw error;
        }
      },

      clearUser: async () => {
        try {
          await removeUserInfo();
          set({ user: null }, false, "user/clear");
        } catch (error) {
          console.error("[UserStore] Error clearing user:", error);
          throw error;
        }
      },
    }),
    { name: "UserStore" }
  )
);

export default useUserStore;
