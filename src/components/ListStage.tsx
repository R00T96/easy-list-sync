import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, History } from "lucide-react";
import { ListItemRow } from "./ListItemRow";
import { usePin } from "@/hooks/usePin";
import type { ShoppingItem } from "@/store/shoppingList";

type ListActions = {
  addItem: () => void;
  updateQty: (id: string, delta: number) => void;
  toggleDone: (id: string) => void;
  clearCompleted: () => void;
  restoreItem: (id: string) => void;
};

type ListStageProps = {
  isOnline: boolean;
  showAllItems: boolean;
  setShowAllItems: (show: boolean) => void;
  items: ShoppingItem[];
  allItems: ShoppingItem[];
  text: string;
  setText: (text: string) => void;
  completedCount: number;
  actions: ListActions;
};

export const ListStage = ({
  isOnline,
  showAllItems,
  setShowAllItems,
  items,
  allItems,
  text,
  setText,
  completedCount,
  actions
}: ListStageProps) => {
  const { pin } = usePin();
  return (
    <section aria-labelledby="list-heading" className="mx-auto max-w-2xl">
      <Card className="shadow-sm">

        <CardHeader>
            <CardTitle id="list-heading">
              Just type. Hit add. Everyone sees it live.
            </CardTitle>
            <CardDescription id="list-description">
              Tap [✓] when it's done — no repeats, no missed items.
            </CardDescription>
          </CardHeader>
        
        <CardContent>
          {/* Inline guidance banner for new users */}
          <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-muted">
            <p className="text-sm text-muted-foreground">
              💡 <b>Stuck?</b> Try groceries, chores, party prep, trip plans, to-dos, errands…
            </p>
          </div>
          <div className="flex flex-col gap-2 mb-6 sm:flex-row sm:items-stretch">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add something for the crew…"
              aria-label="Item name"
              onKeyDown={(e) => { if (e.key === 'Enter') actions.addItem(); }}
              className="w-full"
              autoComplete="off"
              enterKeyHint="done"
            />
            <Button onClick={actions.addItem} aria-label="Add item" className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
          </div>

          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowAllItems(!showAllItems)}
              className="text-sm"
            >
              <History className="mr-2 h-4 w-4" />
              {showAllItems ? "Show Active Only" : "View All Items"}
            </Button>
            {showAllItems && (
              <p className="text-xs text-muted-foreground">
                Showing {allItems.length} total items
              </p>
            )}
          </div>

          <ul className="space-y-3">
            {items.length === 0 && (
              <li className="text-muted-foreground text-sm">Your list is empty. Add your first item!</li>
            )}
            {items.map((item) => (
              <ListItemRow
                key={item.id}
                item={item}
                onToggleDone={actions.toggleDone}
                onUpdateQty={actions.updateQty}
                onRestore={actions.restoreItem}
              />
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Done: {completedCount} — {completedCount > 0 ? "Keep going!" : "Keep going"}
            </p>
            <Button variant="destructive" onClick={actions.clearCompleted} disabled={completedCount === 0} aria-label="Clear completed" className="w-full sm:w-auto">
              <Trash2 className="mr-2 h-4 w-4" /> Clear completed
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};