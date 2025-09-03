import { useState, useEffect } from "react";

export const usePin = () => {
  const [pin, setPin] = useState<string | null>(() => localStorage.getItem("shopping-pin"));

  const savePin = (p: string) => {
    localStorage.setItem("shopping-pin", p);
    setPin(p);
  };

  const clearPin = () => {
    localStorage.removeItem("shopping-pin");
    setPin(null);
  };

  return { pin, savePin, clearPin };
};