// Secure quantum key storage using IndexedDB

const DB_NAME = 'QuantumKeys';
const STORE_NAME = 'keys';
const DB_VERSION = 1;

interface StoredKey {
  pin: string;
  keyBytes: Uint8Array;
  timestamp: number;
  deviceId?: string;
}

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'pin' });
      }
    };
  });
}

export async function storeQuantumKey(
  pin: string,
  keyBytes: Uint8Array,
  deviceId?: string
): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  const data: StoredKey = {
    pin,
    keyBytes,
    timestamp: Date.now(),
    deviceId,
  };

  return new Promise((resolve, reject) => {
    const request = store.put(data);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getQuantumKey(pin: string): Promise<Uint8Array | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(pin);
      request.onsuccess = () => {
        const data = request.result as StoredKey | undefined;
        resolve(data ? data.keyBytes : null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting quantum key:', error);
    return null;
  }
}

export async function removeQuantumKey(pin: string): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.delete(pin);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function hasQuantumKey(pin: string): Promise<boolean> {
  const key = await getQuantumKey(pin);
  return key !== null;
}

// Utility to convert Uint8Array to base64
export function keyToBase64(key: Uint8Array): string {
  return btoa(String.fromCharCode(...key));
}

// Utility to convert base64 to Uint8Array
export function base64ToKey(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
