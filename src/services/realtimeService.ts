// services/realtimeService.ts
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function subscribeShoppingItems(pin: string, onEvent: (e: any) => void): RealtimeChannel {
  return supabase
    .channel(`shopping_items_${pin}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_items', filter: `list_id=eq.${pin}` }, onEvent)
    .subscribe();
}