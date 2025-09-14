// services/syncService.ts
import { createSupabaseWithHeaders } from "@/integrations/supabase/client";
import type { ShoppingItem, SyncStatus } from "@/store/shoppingList";

export type SyncDeps = {
  pin: string;              // require non-null here
  clientId: string;
  getLocal: () => ShoppingItem[];
};

export async function syncNowService({ pin, clientId, getLocal }: SyncDeps): Promise<ShoppingItem[]> {
  if (!pin) throw new Error("Missing pin");
  if (!clientId) throw new Error("Missing clientId");
  
  const sb = createSupabaseWithHeaders({ "x-list-id": pin });

  const local = getLocal().filter(i => i.list_id === pin);
  const pending = local.filter(i => i.syncStatus === "pending");

  if (pending.length) {
    const toPush = pending.map(({ syncStatus, ...rest }) => ({ ...rest, client_id: clientId }));
    const { error: upsertError } = await sb.from("shopping_items").upsert(toPush, { onConflict: "id" }).select();
    if (upsertError) throw upsertError;
  }

  const { data: server, error } = await sb.from("shopping_items").select("*").eq("list_id", pin);
  if (error) throw error;

  // Merge
  const byId = new Map<string, ShoppingItem>();
  const justPushedIds = new Set(pending.map(p => p.id));

  for (const li of local) {
    const wasPending = justPushedIds.has(li.id);
    byId.set(li.id, { ...li, syncStatus: wasPending ? "synced" as SyncStatus : li.syncStatus });
  }

  for (const s of server ?? []) {
    const serverItem: ShoppingItem = {
      id: String(s.id), list_id: String(s.list_id), text: String(s.text), qty: Number(s.qty),
      done: Boolean(s.done), updated_at: new Date(String(s.updated_at)).toISOString(),
      deleted: Boolean(s.deleted), syncStatus: "synced",
    };
    const localItem = byId.get(serverItem.id);
    if (!localItem) {
      byId.set(serverItem.id, serverItem);
      continue;
    }
    if (justPushedIds.has(serverItem.id)) continue; // keep just-pushed
    // LWW merge
    if (new Date(serverItem.updated_at).getTime() > new Date(localItem.updated_at).getTime()) {
      byId.set(serverItem.id, serverItem);
    } else if (localItem.syncStatus === "pending") {
      const { syncStatus, ...payload } = localItem as any;
      await sb.from("shopping_items").upsert([payload], { onConflict: "id" });
      byId.set(serverItem.id, { ...localItem, syncStatus: "synced" });
    }
  }

  return Array.from(byId.values()).map(i => ({ ...i, syncStatus: "synced" as SyncStatus }));
}
