// hooks/useUrlPin.ts
import { useEffect, useState } from "react";

const PIN_REGEX = /^[A-Za-z0-9]{6}$/;

export function useUrlPin() {
  const [urlPin, setUrlPin] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const raw = url.searchParams.get("pin");
    if (!raw) return;

    const candidate = raw.trim().toUpperCase();
    if (!PIN_REGEX.test(candidate)) return;

    setUrlPin(candidate);

    // clean URL
    url.searchParams.delete("pin");
    window.history.replaceState({}, document.title, url.toString());
  }, []);

  const clearUrlPin = () => setUrlPin(null);

  return { urlPin, clearUrlPin };
}
