// Generate a semi-stable device fingerprint
// Note: This is for UX only, not security!

export async function generateDeviceFingerprint(): Promise<string> {
  const components: string[] = [];

  // User agent
  components.push(navigator.userAgent);

  // Screen resolution
  components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Language
  components.push(navigator.language);

  // Hardware concurrency
  components.push(String(navigator.hardwareConcurrency || 0));

  // Canvas fingerprint (simple version)
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('fingerprint', 2, 2);
      components.push(canvas.toDataURL());
    }
  } catch (e) {
    // Canvas fingerprinting blocked
  }

  // Combine and hash
  const combined = components.join('|');
  const encoder = new TextEncoder();
  const data = encoder.encode(combined);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

// Get or create persistent device ID
export async function getDeviceId(): Promise<string> {
  const storageKey = 'quantum-device-id';
  
  // Try to get existing ID from localStorage
  let deviceId = localStorage.getItem(storageKey);
  
  if (!deviceId) {
    // Generate new fingerprint-based ID
    const fingerprint = await generateDeviceFingerprint();
    
    // Add random component to ensure uniqueness across reinstalls
    const randomPart = crypto.getRandomValues(new Uint8Array(8));
    const randomHex = Array.from(randomPart)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    deviceId = `${fingerprint.substring(0, 32)}-${randomHex}`;
    localStorage.setItem(storageKey, deviceId);
  }
  
  return deviceId;
}
