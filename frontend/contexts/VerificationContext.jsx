// this is a temporary file to provide a context for verifying password

import React, { createContext, useContext } from 'react';

const VerificationContext = createContext({});

export function VerificationProvider({ children }) {
  return <VerificationContext.Provider value={{}}>{children}</VerificationContext.Provider>;
}


export function useVerificationContext() {
  return useContext(VerificationContext);
}

// Alias for compatibility with existing imports
export const useVerification = useVerificationContext;
