// pages/OpenList.tsx
import { useState } from "react";
import { Header } from "@/components/Header";
import { PinGateStage } from "@/components/PinGateStage";
import { ListStage } from "@/components/ListStage";
import { AppFooter } from "@/components/AppFooter";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import { ShoppingListProvider, useShoppingList } from "@/contexts/ShoppingListContext";
import { usePin } from "@/hooks/usePin";
import { useSync } from "@/hooks/useSync";                // expects { isOnline,isSyncing,syncNow(opts),syncSoon,clientId }
import { useServerMerges } from "@/hooks/useServerMerges";
import { useRealtimeSync } from "@/hooks/useRealtimeSync"; // onSubscribed runs once-per-pin in our usage here
import { useUrlPin } from "@/hooks/useUrlPin";
import { useSEO } from "@/hooks/useSEO";
import { toast } from "@/hooks/use-toast";

// If you don't have this yet, keep your previous local state instead.
// The hook should expose: { text, setText, qty, setQty, reset, canSubmit }
import { useItemForm } from "@/hooks/useItemForm";

function OpenListInner() {
  const [showAllItems, setShowAllItems] = useState(false);
  const { pin, savePin } = usePin();
  const { urlPin, clearUrlPin } = useUrlPin();
  const form = useItemForm(1);

  const { items, addItemLocal, toggleDoneLocal, updateQtyLocal, clearCompletedLocal, restoreItemLocal } = useShoppingList();
  const { isOnline, isSyncing, syncNow, syncSoon, clientId } = useSync();
  const { upsertFromServer, applyServerDelete } = useServerMerges(clientId);

  // SEO
  useSEO(
    pin ? `Our List: ${pin}` : "Our List — From last-minute chaos to group calm in seconds",
    "Share one simple list. No logins. Works offline. Syncs when online."
  );

  // Realtime → debounced silent catch-up once per pin
  useRealtimeSync(pin, upsertFromServer, applyServerDelete, () => {
    // first subscribe for this pin: do a silent, debounced catch-up
    syncSoon(300, true);
  });

  const handlePinSet = (newPin: string) => {
    savePin(newPin);
    clearUrlPin();
    // tiny delay to let providers settle, then background sync
    syncSoon(250, true);
  };

  const roomItems   = pin ? items.filter(i => i.list_id === pin) : [];
  const activeItems = roomItems.filter(i => !i.deleted);
  const itemsForList = showAllItems ? roomItems : activeItems;
  const completedCount = itemsForList.filter(i => i.done).length;


  const actions = {
    addItem: () => {
      if (!pin) {
        toast({ title: "Join Room", description: "Pick a room first to add items." });
        return;
      }
      if (!form.canSubmit) return;
      addItemLocal({
        list_id: pin,
        text: form.text.trim(),
        qty: form.qty,
        done: false,
        deleted: false,
        client_id: clientId,
      });
      form.reset();
      // background push; user doesn’t need a toast here
      syncSoon(250, { silent: true, toastOnPush: true });
    },
    updateQty: (id: string, delta: number) => {
      updateQtyLocal(id, delta);
      // coalesce rapid taps; still shows "Synced" toast on push completion
      syncSoon(120, { silent: true, toastOnPush: true });
    },
    toggleDone: (id: string) => {
      toggleDoneLocal(id);
      syncSoon(250, { silent: true, toastOnPush: true });
    },
    clearCompleted: () => {
      if (!pin) return;
      const cleared = clearCompletedLocal(pin);
      if (cleared) {
        toast({
          title: "Progress cleared",
          description: "Completed items removed for everyone.",
        });
      }
      syncSoon(250, { silent: true, toastOnPush: true });
    },
    restoreItem: (id: string) => {
      restoreItemLocal(id);
      syncSoon(250, { silent: true, toastOnPush: true });
    },
  };

  // Manual “Sync” button should be a foreground, non-silent sync so the user gets feedback
  const requestSync = () => {
    if (!isOnline) {
      toast({
        title: "You’re offline",
        description: "Changes will sync the moment you’re back online.",
      });
      return;
    }
    syncNow({ silent: false });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <Header isOnline={isOnline} requestSync={requestSync} isSyncing={isSyncing} />
      </header>
      <main className="container px-4 py-6 sm:py-10">
        {!pin || urlPin ? (
          <PinGateStage onPinSet={handlePinSet} urlPin={urlPin ?? undefined} />
        ) : (
          <ListStage
            isOnline={isOnline}
            showAllItems={showAllItems}
            setShowAllItems={setShowAllItems}
            items={itemsForList}
            allItems={roomItems}
            text={form.text}
            setText={form.setText}
            completedCount={completedCount}
            actions={actions}
          />
        )}
        <AppFooter />
      </main>
    </div>
  );
}

export default function OpenList() {
  return (
    <ErrorBoundary>
      <ShoppingListProvider>
        <OpenListInner />
      </ShoppingListProvider>
    </ErrorBoundary>
  );
}
