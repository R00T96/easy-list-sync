// usePin.ts
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type PinContextType = {
  pin: string | null;
  savePin: (p: string) => void;
  clearPin: () => void;
};

const PinContext = createContext<PinContextType | undefined>(undefined);

export const PinProvider = ({ children }: { children: ReactNode }) => {
  const [pin, setPin] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("shopping-pin");
    }
    return null;
  });

  const savePin = (p: string) => {
    localStorage.setItem("shopping-pin", p);
    setPin(p);
  };

  const clearPin = () => {
    localStorage.removeItem("shopping-pin");
    setPin(null);
  };

  return (
    <PinContext.Provider value={{ pin, savePin, clearPin }}>
      {children}
    </PinContext.Provider>
  );
};

export const usePin = (): PinContextType => {
  const context = useContext(PinContext);
  if (context === undefined) {
    throw new Error("usePin must be used within a PinProvider");
  }
  return context;
};