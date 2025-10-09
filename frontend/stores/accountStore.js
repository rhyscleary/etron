// account storage wrapper using zustand

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import AccountStorage from "../storage/accountStorage";

const useAccountStore = create(
  devtools(
    (set) => ({
      account: null,

      loadAccount: async () => {
        try {
          const account = await AccountStorage.getAccountInfo();
          set({ account }, false, "account/load");
          return account;
        } catch (error) {
          console.error("[AccountStore] Error loading account:", error);
          throw error;
        }
      },

      saveAccount: async (accountData) => {
        try {
          await AccountStorage.saveAccountInfo(accountData);
          set({ account: accountData }, false, "account/save");
        } catch (error) {
          console.error("[AccountStore] Error saving account:", error);
          throw error;
        }
      },

      clearAccount: async () => {
        try {
          await AccountStorage.removeAccountInfo();
          set({ account: null }, false, "account/clear");
        } catch (error) {
          console.error("[AccountStore] Error clearing account:", error);
          throw error;
        }
      },
    }),
    { name: "AccountStore" }
  )
);

export default useAccountStore;
