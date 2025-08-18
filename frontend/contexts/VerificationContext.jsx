// this is a temporary file to provide a context for verifying password

import React, { createContext, useContext, useState } from 'react';

const VerificationContext = createContext({
  verifyingPassword: false,
  setVerifyingPassword: (v) => {},
});

export const VerificationProvider = ({ children }) => {
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  return (
    <VerificationContext.Provider value={{ verifyingPassword, setVerifyingPassword }}>
      {children}
    </VerificationContext.Provider>
  );
};

export const useVerification = () => useContext(VerificationContext);
