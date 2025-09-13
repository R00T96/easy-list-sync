// hooks/useSEO.ts
import { useEffect } from "react";

export function useSEO(title: string, description?: string) {
  useEffect(() => {
    document.title = title;
    if (description) {
      const node = document.querySelector('meta[name="description"]');
      if (node) node.setAttribute("content", description);
    }
  }, [title, description]);
}
