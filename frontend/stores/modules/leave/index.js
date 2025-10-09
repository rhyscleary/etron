// leave module store template

import { create } from "zustand";
import { devtools } from "zustand/middleware";

const useLeaveStore = create(
  devtools(
    (set, get) => ({
      leaveRequests: [],
      selectedRequest: null,
      isLoading: false,
      error: null,

      fetchLeaveRequests: async () => {
        console.log("[LeaveStore] fetchLeaveRequests - to be implemented");
      },

      createLeaveRequest: async (requestData) => {
        console.log("[LeaveStore] createLeaveRequest - to be implemented");
      },

      clearLeave: () => {
        set(
          {
            leaveRequests: [],
            selectedRequest: null,
            isLoading: false,
            error: null,
          },
          false,
          "leave/clear"
        );
      },
    }),
    { name: "LeaveStore" }
  )
);

export default useLeaveStore;
