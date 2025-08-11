import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Cloud } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { loadItems, saveItems, type ShoppingItem, type SyncStatus } from "@/store/shoppingList";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [text, setText] = useState("");
  const [qty, setQty] = useState<number>(1);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const PENDING: SyncStatus = "pending";
  const [isSyncing, setIsSyncing] = useState(false);

  // SEO
  useEffect(() => {
    document.title = "Offline Shopping List — Sync Ready";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Super simple offline-first shopping list with optional cloud sync.");
  }, []);

  useEffect(() => {
    setItems(loadItems());
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Auto-sync when coming back online if there are pending changes
  useEffect(() => {
    if (!isOnline) return;
    if (!items.some(i => i.syncStatus === PENDING)) return;
    setTimeout(() => {
      syncNow();
    }, 0);
  }, [isOnline]);

  const visibleItems = useMemo(() => items.filter(i => !i.deleted), [items]);
  const completedCount = useMemo(() => visibleItems.filter(i => i.done).length, [visibleItems]);

  const addItem = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const next: ShoppingItem = {
      id: crypto.randomUUID(),
      list_id: "default",
      text: trimmed,
      qty: Math.max(1, qty || 1),
      done: false,
      updated_at: new Date().toISOString(),
      deleted: false,
      syncStatus: PENDING,
    };
    const updated = [next, ...items];
    setItems(updated);
    saveItems(updated);
    setText("");
    setQty(1);
  };

  const toggleDone = (id: string) => {
    const updated = items.map(i => i.id === id ? { ...i, done: !i.done, updated_at: new Date().toISOString(), syncStatus: PENDING } : i);
    setItems(updated);
    saveItems(updated);
  };

  const updateQty = (id: string, delta: number) => {
    const updated = items.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta), updated_at: new Date().toISOString(), syncStatus: PENDING } : i);
    setItems(updated);
    saveItems(updated);
  };

  const clearCompleted = () => {
    if (completedCount === 0) return;
    const updated = items.map(i => i.done && !i.deleted ? { ...i, deleted: true, updated_at: new Date().toISOString(), syncStatus: PENDING } : i);
    setItems(updated);
    saveItems(updated);
    toast({ title: "Cleared completed", description: "Completed items marked for deletion (pending sync)." });
  };

  const syncNow = async () => {
    if (!isOnline) {
      toast({ title: "Offline", description: "Connect to the internet to sync." });
      return;
    }
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const listId = "default";
      const localItems = items;
      const pending = localItems.filter(i => i.syncStatus === PENDING);

      if (pending.length > 0) {
        const toPush = pending.map(({ syncStatus, ...rest }) => rest);
        const { error: upsertError } = await supabase
          .from("shopping_items")
          .upsert(toPush, { onConflict: "id" });
        if (upsertError) throw upsertError;
      }

      const { data: serverItems, error } = await supabase
        .from("shopping_items")
        .select("*")
        .eq("list_id", listId);
      if (error) throw error;

      const byId = new Map<string, ShoppingItem>();
      for (const li of localItems) byId.set(li.id, li);
      for (const si of serverItems ?? []) {
        const serverItem: ShoppingItem = {
          id: si.id as string,
          list_id: si.list_id as string,
          text: si.text as string,
          qty: Number(si.qty),
          done: Boolean(si.done),
          updated_at: new Date(si.updated_at as string).toISOString(),
          deleted: Boolean(si.deleted),
          syncStatus: "synced",
        };
        const local = byId.get(serverItem.id);
        if (!local) {
          byId.set(serverItem.id, serverItem);
        } else {
          const serverTime = new Date(serverItem.updated_at).getTime();
          const localTime = new Date(local.updated_at).getTime();
          if (serverTime >= localTime) {
            byId.set(serverItem.id, serverItem);
          } else {
            const { syncStatus, ...payload } = local as any;
            await supabase.from("shopping_items").upsert([payload], { onConflict: "id" });
            byId.set(serverItem.id, { ...local, syncStatus: "synced" });
          }
        }
      }

      const merged = Array.from(byId.values()).map(i => ({ ...i, syncStatus: "synced" as SyncStatus }));
      setItems(merged);
      saveItems(merged);
      toast({ title: "Synced", description: "Local changes merged with cloud (last-write wins)." });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Sync failed", description: e?.message || "Please try again." });
    } finally {
      setIsSyncing(false);
    }
  };

  const requestSync = () => {
    if (!isOnline) {
      toast({ title: "Offline", description: "Connect to the internet to sync." });
      return;
    }
    syncNow();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container px-4 py-4 flex items-center justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-bold">Offline Shopping List</h1>
          <div className="flex items-center gap-2">
            <Badge variant={isOnline ? "default" : "secondary"}>{isOnline ? "Online" : "Offline"}</Badge>
            <Button variant="secondary" size="sm" onClick={requestSync} disabled={!isOnline || isSyncing} aria-label="Sync with cloud" aria-busy={isSyncing}>
              <Cloud className="mr-2 h-4 w-4" /> Sync
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 sm:py-10">
        <section aria-labelledby="list-heading" className="mx-auto max-w-2xl">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle id="list-heading">Your List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 mb-6 sm:flex-row sm:items-stretch">
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Add an item..."
                  aria-label="Item name"
                  onKeyDown={(e) => { if (e.key === 'Enter') addItem(); }}
                  className="w-full"
                  autoComplete="off"
                  enterKeyHint="done"
                />
                <Button onClick={addItem} aria-label="Add item" className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" /> Add
                </Button>
              </div>

              <ul className="space-y-3">
                {visibleItems.length === 0 && (
                  <li className="text-muted-foreground text-sm">Your list is empty. Add your first item!</li>
                )}
                {visibleItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between p-3 rounded-md border">
                    <div className="flex items-center gap-3">
                      <Checkbox checked={item.done} onCheckedChange={() => toggleDone(item.id)} aria-label={`Toggle ${item.text}`} />
                      <div>
                        <p className="font-medium leading-none">{item.text}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.qty}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => updateQty(item.id, -1)} aria-label="Decrease quantity">-</Button>
                      <Button variant="ghost" size="sm" onClick={() => updateQty(item.id, +1)} aria-label="Increase quantity">+</Button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">Completed: {completedCount}</p>
                <Button variant="destructive" onClick={clearCompleted} disabled={completedCount === 0} aria-label="Clear completed" className="w-full sm:w-auto">
                  <Trash2 className="mr-2 h-4 w-4" /> Clear completed
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Index;
