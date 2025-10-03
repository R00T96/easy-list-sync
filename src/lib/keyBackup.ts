// Encrypted backup and restore for quantum keys

export interface EncryptedBackup {
  version: number;
  pin: string;
  kdf: {
    type: string;
    iterations: number;
    salt: number[];
  };
  cipher: {
    algo: string;
    iv: number[];
  };
  data: string;
  createdAt: string;
}

export async function exportEncryptedBackup(
  pin: string,
  keyBytes: Uint8Array,
  passphrase: string,
  deviceId?: string
): Promise<EncryptedBackup> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Derive key from passphrase
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 250000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // Prepare payload
  const payload = JSON.stringify({
    pin,
    deviceId: deviceId || null,
    createdAt: new Date().toISOString(),
    keyBase64: btoa(String.fromCharCode(...keyBytes)),
  });

  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encoder.encode(payload)
  );

  return {
    version: 1,
    pin,
    kdf: {
      type: 'PBKDF2-SHA256',
      iterations: 250000,
      salt: Array.from(salt),
    },
    cipher: {
      algo: 'AES-GCM',
      iv: Array.from(iv),
    },
    data: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    createdAt: new Date().toISOString(),
  };
}

export async function importEncryptedBackup(
  backup: EncryptedBackup,
  passphrase: string
): Promise<{ pin: string; keyBytes: Uint8Array; deviceId?: string }> {
  if (backup.version !== 1) {
    throw new Error('Unsupported backup version');
  }

  const encoder = new TextEncoder();
  const salt = new Uint8Array(backup.kdf.salt);
  const iv = new Uint8Array(backup.cipher.iv);

  // Derive key from passphrase
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: backup.kdf.iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  // Decrypt
  const ciphertext = Uint8Array.from(atob(backup.data), c => c.charCodeAt(0));
  
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      ciphertext
    );

    const payload = JSON.parse(new TextDecoder().decode(decrypted));
    const keyBytes = Uint8Array.from(atob(payload.keyBase64), c => c.charCodeAt(0));

    return {
      pin: payload.pin,
      keyBytes,
      deviceId: payload.deviceId,
    };
  } catch (error) {
    throw new Error('Invalid passphrase or corrupted backup');
  }
}

export function downloadBackup(backup: EncryptedBackup, filename?: string): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `quantum-key-${backup.pin}-backup.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function readBackupFile(file: File): Promise<EncryptedBackup> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target?.result as string);
        resolve(backup);
      } catch (error) {
        reject(new Error('Invalid backup file format'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
