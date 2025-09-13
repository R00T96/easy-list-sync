// services/syncService.ts
import { createSupabaseWithHeaders } from "@/integrations/supabase/client";
import type { ShoppingItem } from "@/store/shoppingList";

export type SyncDeps = {
  pin: string;
  clientId: string;
  getLocal: () => ShoppingItem[];
};

export async function syncNowService({ pin, clientId, getLocal }: SyncDeps): Promise<ShoppingItem[]> {
  const sb = createSupabaseWithHeaders({ "x-list-id": pin });

  const allLocal = getLocal();
  const local = allLocal.filter(i => i.list_id === pin);
  const pending = local.filter(i => i.syncStatus === "pending");

  // Push pending (attach client_id)
  if (pending.length) {
    const toPush = pending.map(({ syncStatus, ...rest }) => ({ ...rest, client_id: clientId }));
    const { error: upsertErr } = await sb.from("shopping_items").upsert(toPush, { onConflict: "id" }).select();
    if (upsertErr) throw upsertErr;
  }

  // Fetch server rows for this pin
  const { data: serverRows, error: fetchErr } = await sb.from("shopping_items").select("*").eq("list_id", pin);
  if (fetchErr) throw fetchErr;

  // Build id → item map seeded with local
  const byId = new Map<string, ShoppingItem>();
  for (const li of local) byId.set(li.id, li);

  const justPushedIds = new Set(pending.map(p => p.id));

  for (const s of serverRows ?? []) {
    const serverItem: ShoppingItem = {
      id: String(s.id),
      list_id: String(s.list_id),
      text: String(s.text),
      qty: Number(s.qty),
      done: Boolean(s.done),
      updated_at: new Date(String(s.updated_at)).toISOString(),
      deleted: Boolean(s.deleted),
      syncStatus: "synced", // server's view
    };

    const localItem = byId.get(serverItem.id);

    if (!localItem) {
      byId.set(serverItem.id, serverItem);
      continue;
    }

    // Don't let a server echo of a just-pushed id clobber the local value in THIS round
    if (justPushedIds.has(serverItem.id)) continue;

    // If local is pending, decide using timestamps:
    if (localItem.syncStatus === "pending") {
      const serverTime = +new Date(serverItem.updated_at);
      const localTime  = +new Date(localItem.updated_at);
      if (localTime >= serverTime) {
        // local newer: re-push (attach client_id) and keep local
        const { syncStatus, ...payload } = localItem as any;
        await sb.from("shopping_items").upsert([{ ...payload, client_id: clientId }], { onConflict: "id" });
        byId.set(serverItem.id, { ...localItem }); // keep as pending; status handled by caller
      } else {
        // server newer: accept server
        byId.set(serverItem.id, serverItem);
      }
      continue;
    }

    // Both sides "synced": last-write-wins
    const serverTime = +new Date(serverItem.updated_at);
    const localTime  = +new Date(localItem.updated_at);
    byId.set(serverItem.id, serverTime > localTime ? serverItem : localItem);
  }

  // Return only this pin's items (caller merges other pins and sets statuses)
  return Array.from(byId.values());
}
