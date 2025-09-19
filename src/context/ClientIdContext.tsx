import React, { createContext, useContext, useEffect, useState } from "react";

// Context type
interface ClientIdContextValue {
  clientId: string;
  setClientId: (id: string) => void;
}

const ClientIdContext = createContext<ClientIdContextValue | undefined>(undefined);

// Helper to get or generate a client id (uuid)
function getInitialClientId() {
  // In the future, check for logged-in user and use their email or id
  const stored = localStorage.getItem("client-id");
  if (stored) return stored;
  const uuid = crypto.randomUUID();
  localStorage.setItem("client-id", uuid);
  return uuid;
}

export const ClientIdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clientId, setClientIdState] = useState<string>(getInitialClientId());

  // Keep localStorage in sync if clientId changes
  useEffect(() => {
    if (clientId) localStorage.setItem("client-id", clientId);
  }, [clientId]);

  // Expose setter for future login integration
  const setClientId = (id: string) => {
    setClientIdState(id);
    localStorage.setItem("client-id", id);
  };

  return (
    <ClientIdContext.Provider value={{ clientId, setClientId }}>
      {children}
    </ClientIdContext.Provider>
  );
};

export function useClientId() {
  const ctx = useContext(ClientIdContext);
  if (!ctx) throw new Error("useClientId must be used within a ClientIdProvider");
  return ctx;
}
