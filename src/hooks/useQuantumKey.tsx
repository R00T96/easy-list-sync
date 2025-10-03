import { useState, useEffect } from "react";
import { toast } from "sonner";
import { usePinPreferences } from "@/context/PinPreferencesContext";
import { supabase } from "@/integrations/supabase/client";
import {
  storeQuantumKey,
  getQuantumKey,
  removeQuantumKey as removeStoredKey,
  hasQuantumKey as checkStoredKey,
  keyToBase64,
} from "@/lib/quantumKeyStorage";
import { getDeviceId } from "@/lib/deviceFingerprint";
import {
  exportEncryptedBackup,
  importEncryptedBackup,
  downloadBackup,
  readBackupFile,
} from "@/lib/keyBackup";

const QRNG_API = "https://qrng.anu.edu.au/API/jsonI.php?length=9&type=hex16&size=6";

export const useQuantumKey = (pin: string | null) => {
  const { setIsProtected, isProtected } = usePinPreferences();
  const [hasQuantumKey, setHasQuantumKey] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [canEdit, setCanEdit] = useState(true);

  // Check for stored key on mount
  useEffect(() => {
    if (!pin) return;
    checkStoredKey(pin).then(setHasQuantumKey);
  }, [pin]);

  // Verify edit permission when protection status changes
  useEffect(() => {
    if (!pin) return;
    verifyEditPermission();
  }, [pin, isProtected, hasQuantumKey]);

  const verifyEditPermission = async () => {
    if (!pin) {
      setCanEdit(true);
      return;
    }

    try {
      const keyBytes = await getQuantumKey(pin);
      const quantumKeyBase64 = keyBytes ? keyToBase64(keyBytes) : null;

      const { data, error } = await supabase.functions.invoke("verify-pin", {
        body: { pin, quantumKeyBase64 },
      });

      if (error) throw error;
      setCanEdit(data.canEdit);
    } catch (error) {
      console.error("Error verifying edit permission:", error);
      setCanEdit(!isProtected); // Fallback: allow if unprotected
    }
  };

  const generateQuantumKey = async () => {
    if (!pin) return;

    setIsGenerating(true);
    try {
      // Generate quantum random bytes
      let keyBytes: Uint8Array;
      try {
        const response = await fetch(QRNG_API);
        const data = await response.json();
        if (data.success && data.data) {
          const quantumData = data.data.join("");
          const encoder = new TextEncoder();
          keyBytes = encoder.encode(quantumData);
        } else {
          throw new Error("QRNG failed");
        }
      } catch {
        // Fallback to crypto.getRandomValues
        keyBytes = crypto.getRandomValues(new Uint8Array(32));
      }

      // Get device fingerprint
      const deviceId = await getDeviceId();

      // Call edge function to claim protection
      const { data, error } = await supabase.functions.invoke("protect-pin", {
        body: {
          pin,
          quantumKeyBase64: keyToBase64(keyBytes),
          deviceId,
        },
      });

      if (error || !data?.success) {
        if (error?.message?.includes("already protected") || data?.error?.includes("already protected")) {
          toast.error("⚠️ PIN Already Protected", {
            description: "This PIN is already protected by another device.",
          });
        } else if (error?.message?.includes("Too many attempts")) {
          toast.error("Rate Limited", {
            description: "Too many attempts. Please try again later.",
          });
        } else {
          throw error || new Error(data?.error || "Failed to protect PIN");
        }
        return;
      }

      // Store key locally in IndexedDB
      await storeQuantumKey(pin, keyBytes, deviceId);
      setHasQuantumKey(true);
      await setIsProtected(true);

      toast.success("🔐 Quantum Key Generated", {
        description: "This list is now locked. Only you can edit it on this device.",
      });
    } catch (error) {
      console.error("Quantum key generation error:", error);
      toast.error("Failed to generate quantum key");
    } finally {
      setIsGenerating(false);
    }
  };

  const removeQuantumKeyProtection = async () => {
    if (!pin) return;

    try {
      const keyBytes = await getQuantumKey(pin);
      if (!keyBytes) {
        toast.error("No key found on this device");
        return;
      }

      const { data, error } = await supabase.functions.invoke("remove-protection", {
        body: {
          pin,
          quantumKeyBase64: keyToBase64(keyBytes),
        },
      });

      if (error || !data?.success) {
        if (error?.message?.includes("Invalid key")) {
          toast.error("❌ Cannot Remove", {
            description: "Only the key holder can remove protection.",
          });
        } else {
          throw error || new Error(data?.error || "Failed to remove protection");
        }
        return;
      }

      await removeStoredKey(pin);
      setHasQuantumKey(false);
      await setIsProtected(false);

      toast.success("🔓 Protection Removed", {
        description: "This list is now public. Anyone can edit it.",
      });
    } catch (error) {
      console.error("Error removing protection:", error);
      toast.error("Failed to remove protection");
    }
  };

  const downloadQuantumKey = async () => {
    if (!pin) return;

    const keyBytes = await getQuantumKey(pin);
    if (!keyBytes) {
      toast.error("No key found on this device");
      return;
    }

    // Prompt for passphrase
    const passphrase = prompt(
      "Enter a passphrase to encrypt the backup:\n(Keep this safe - you'll need it to restore)"
    );
    if (!passphrase) return;

    try {
      const deviceId = await getDeviceId();
      const backup = await exportEncryptedBackup(pin, keyBytes, passphrase, deviceId);
      downloadBackup(backup);

      toast.success("🔑 Backup Downloaded", {
        description: "Keep this file and passphrase safe to restore on other devices.",
      });
    } catch (error) {
      console.error("Error creating backup:", error);
      toast.error("Failed to create backup");
    }
  };

  const restoreQuantumKey = async (file: File) => {
    if (!pin) return;

    try {
      const backup = await readBackupFile(file);

      if (backup.pin !== pin) {
        toast.error("Wrong PIN", {
          description: `This backup is for PIN ${backup.pin}, not ${pin}`,
        });
        return;
      }

      const passphrase = prompt("Enter the passphrase for this backup:");
      if (!passphrase) return;

      const { keyBytes, deviceId } = await importEncryptedBackup(backup, passphrase);

      // Verify the key works
      const { data, error } = await supabase.functions.invoke("verify-pin", {
        body: { pin, quantumKeyBase64: keyToBase64(keyBytes) },
      });

      if (error || !data?.canEdit) {
        toast.error("❌ Invalid Key", {
          description: "This backup doesn't match the protected PIN.",
        });
        return;
      }

      // Store the key
      await storeQuantumKey(pin, keyBytes, deviceId);
      setHasQuantumKey(true);

      toast.success("✅ Key Restored", {
        description: "You can now edit this list on this device.",
      });
    } catch (error: any) {
      console.error("Error restoring key:", error);
      if (error.message?.includes("passphrase")) {
        toast.error("Wrong Passphrase", {
          description: "The passphrase is incorrect.",
        });
      } else {
        toast.error("Failed to restore key");
      }
    }
  };

  return {
    hasQuantumKey,
    isGenerating,
    canEdit,
    generateQuantumKey,
    removeQuantumKey: removeQuantumKeyProtection,
    downloadQuantumKey,
    restoreQuantumKey,
    verifyEditPermission,
  };
};
