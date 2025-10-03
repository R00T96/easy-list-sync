// Crypto utilities for quantum key protection
// Uses Node.js crypto for Deno compatibility

export async function hashKeyArgon2id(
  key: Uint8Array,
  salt: Uint8Array,
  context: string
): Promise<Uint8Array> {
  // Combine key + context for domain separation
  const combined = new Uint8Array(key.length + context.length);
  combined.set(key);
  combined.set(new TextEncoder().encode(context), key.length);

  // Use PBKDF2 as Argon2id isn't available in Deno std
  // In production, you'd use argon2 via npm:@stablelib/argon2id
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    combined,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 250000, // High iteration count for security
      hash: 'SHA-256',
    },
    keyMaterial,
    256 // 32 bytes
  );

  return new Uint8Array(derivedBits);
}

export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

export function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

export function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function bytesToBase64(bytes: Uint8Array): string {
  const binaryString = String.fromCharCode(...bytes);
  return btoa(binaryString);
}
