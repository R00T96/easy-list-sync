import { useState, useEffect } from "react";
import { toast } from "sonner";
import { usePinPreferences } from "@/context/PinPreferencesContext";

const QRNG_API = "https://qrng.anu.edu.au/API/jsonI.php?length=9&type=hex16&size=6";

type QuantumKeyData = {
  key: string;
  timestamp: number;
};

export const useQuantumKey = (pin: string | null) => {
  const { setIsProtected } = usePinPreferences();
  const [hasQuantumKey, setHasQuantumKey] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!pin) return;
    const stored = localStorage.getItem(`quantum-key-${pin}`);
    setHasQuantumKey(!!stored);
  }, [pin]);

  const generateQuantumKey = async () => {
    if (!pin) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch(QRNG_API);
      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error("Failed to generate quantum key");
      }

      // Create a hash from the quantum random data
      const quantumData = data.data.join("");
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(quantumData);
      const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      const keyData: QuantumKeyData = {
        key: hashHex,
        timestamp: Date.now()
      };

      localStorage.setItem(`quantum-key-${pin}`, JSON.stringify(keyData));
      setHasQuantumKey(true);
      await setIsProtected(true);
      
      toast.success("🔐 Quantum Key Generated", {
        description: "This list is now locked. Only you can edit it on this device."
      });
    } catch (error) {
      console.error("Quantum key generation error:", error);
      toast.error("Failed to generate quantum key");
    } finally {
      setIsGenerating(false);
    }
  };

  const removeQuantumKey = async () => {
    if (!pin) return;
    localStorage.removeItem(`quantum-key-${pin}`);
    setHasQuantumKey(false);
    await setIsProtected(false);
    toast.success("🔓 Quantum Key Removed", {
      description: "This list is now public. Anyone can edit it."
    });
  };

  const downloadQuantumKey = () => {
    if (!pin) return;
    const stored = localStorage.getItem(`quantum-key-${pin}`);
    if (!stored) return;

    const blob = new Blob([stored], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quantum-key-${pin}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Quantum Key Downloaded", {
      description: "Keep this file safe to restore your key on other devices."
    });
  };

  return {
    hasQuantumKey,
    isGenerating,
    generateQuantumKey,
    removeQuantumKey,
    downloadQuantumKey
  };
};
