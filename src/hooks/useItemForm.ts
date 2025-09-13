// hooks/useItemForm.ts
import { useCallback, useState } from "react";

export function useItemForm(defaultQty = 1) {
  const [text, setText] = useState("");
  const [qty, setQty] = useState<number>(defaultQty);

  const reset = useCallback(() => {
    setText("");
    setQty(defaultQty);
  }, [defaultQty]);

  const canSubmit = text.trim().length > 0;

  return { text, setText, qty, setQty, reset, canSubmit };
}
