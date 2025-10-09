// password verification state using zustand

import { create } from "zustand";
import { devtools } from "zustand/middleware";

const useVerificationStore = create(
  devtools(
    (set) => ({
      isVerifying: false,

      setVerifying: (status) => {
        set({ isVerifying: status }, false, "verification/setVerifying");
      },
    }),
    { name: "VerificationStore" }
  )
);

export default useVerificationStore;
