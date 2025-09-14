// services/realtimeService.ts
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function subscribeShoppingItems(pin: string, onEvent: (e: any) => void): RealtimeChannel {
  console.log('[subscribeShoppingItems] Subscribing to channel:', `shopping_items_${pin}`);
  console.log('[subscribeShoppingItems] Subscription parameters:', {
    schema: 'public',
    table: 'shopping_items',
    event: '*',
    pin,
  });

  const channel = supabase
    .channel(`shopping_items_${pin}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'shopping_items'
    }, (e) => {
      console.log('[subscribeShoppingItems] Event received:', e);
      onEvent(e);
    })
    .subscribe((status, err) => {
      console.log('[subscribeShoppingItems] Subscribe status:', status, 'Error:', err);
      if (status === 'CHANNEL_ERROR') {
        console.error('[subscribeShoppingItems] CHANNEL_ERROR occurred. Retrying...');
        setTimeout(() => subscribeShoppingItems(pin, onEvent), 1000); // Retry after 1 second
      }
    });
  return channel;
}