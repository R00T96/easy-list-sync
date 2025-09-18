import { useEffect, useRef, useState } from "react";
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
  seedDemo: (category: string) => void;
};

type DemoCategory = {
  category: string;
  emoji: string;
  count: number;
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
  availableCategories: DemoCategory[];
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
  actions,
  availableCategories
}: ListStageProps) => {
  const { pin } = usePin();
  const inputRef = useRef<HTMLInputElement>(null);
  const placeholderOptions = [
    "Add milk to the list…",
    "Plan a group dinner…",
    "Assign a chore to someone…",
    "Add a party supply…",
    "Suggest a movie night…",
    "Add a travel item…",
    "Add a to-do for everyone…",
    "Try: groceries, chores, party prep…",
    "Try: trip plans, errands, to-dos…"
  ];
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  
  useEffect(() => {
    if (text) return; // Don't rotate if user is typing
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % placeholderOptions.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [text]);

  useEffect(() => {
    // Auto-focus add item input when ListStage loads
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleAddItem = () => {
    actions.addItem();
    // Maintain focus after adding item
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };

  return (
    <section aria-labelledby="list-heading" className="mx-auto max-w-2xl">
      <Card className="shadow-sm">

        <CardHeader>
          <CardTitle id="list-heading">
            Add an item. Everyone sees it instantly.
          </CardTitle>
          <CardDescription id="list-description">
            Tap [✓] to check off. No repeats, nothing missed.
          </CardDescription>
        </CardHeader>

        <CardContent>

          <div className="flex flex-col gap-2 mb-6 sm:flex-row sm:items-stretch">
            <Input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={placeholderOptions[placeholderIdx]}
              aria-label="Item name"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddItem(); }}
              className="w-full"
              autoComplete="off"
              enterKeyHint="done"
            />
            <Button onClick={handleAddItem} aria-label="Add item" className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
          </div>
          {items.length > 0 && (
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
            )}
          
          <ul className="space-y-3">
            {items.length === 0 && (
              <li className="text-muted-foreground text-sm flex flex-col gap-3 items-center">
                <span className="mb-2">Your list is empty. Get a head start with a demo list:</span>
                <div className="flex flex-wrap gap-2 justify-center">
                  {availableCategories.map(({ category, emoji, count }) => (
                    <Button 
                      key={category}
                      variant="outline" 
                      size="sm" 
                      onClick={() => actions.seedDemo(category)} 
                      className="min-w-[140px]"
                      title={`Add ${count} ${category.toLowerCase()} items`}
                    >
                      {emoji} {category}
                    </Button>
                  ))}
                </div>
                <span className="mt-2 text-xs text-muted-foreground">Try sharing a demo list with a friend to see live sync in action!</span>
              </li>
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