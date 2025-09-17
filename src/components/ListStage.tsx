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

  
  // Demo seed lists
  const seedLists = [
    {
      category: "Student Research",
      items: [
        { text: "📚 Find journal articles on AI ethics" },
        { text: "📝 Summarize lecture notes" },
        { text: "📊 Collect data for statistics assignment" },
        { text: "🔍 Verify sources for essay" }
      ]
    },
    {
      category: "Wellbeing & Energy",
      items: [
        { text: "💧 Drink 2L water (remind your group!)" },
        { text: "🧘 10 min meditation together" },
        { text: "🎶 Play a focus playlist for all" },
        { text: "🌳 Walk outside for fresh air (sync break)" }
      ]
    },
    {
      category: "Money Watchlist",
      items: [
        { text: "💳 Check credit card statement (group review)" },
        { text: "📉 Track investment losses (share insights)" },
        { text: "⚠️ Review pending bills (remind each other)" },
        { text: "🛑 Avoid unnecessary purchases (accountability!)" }
      ]
    },
    {
      category: "Opportunities",
      items: [
        { text: "🚀 Apply for freelance gig (share progress)" },
        { text: "💡 Pitch new app feature (get feedback)" },
        { text: "🤝 Connect with mentor on LinkedIn (invite a friend)" },
        { text: "📈 Explore passive income idea (brainstorm together)" }
      ]
    },
    {
      category: "App Builder’s Sandbox",
      items: [
        { text: "🛠 Prototype new feature (pair up!)" },
        { text: "📱 Test list sync on two devices" },
        { text: "🎨 Sketch UI improvements (collab mode)" },
        { text: "🧩 Brainstorm integrations (Notion, Slack...)" }
      ]
    },
    {
      category: "Weekly Planning",
      items: [
        { text: "🗓 Review calendar for week (sync with team)" },
        { text: "✅ Prioritize top 3 tasks per day (together)" },
        { text: "📤 Share checklist with team (real-time updates)" },
        { text: "📌 Reflect on wins & lessons (group share)" }
      ]
    }
  ];

// move to LiveList component. 
  function seedDemo(category) {
    const found = seedLists.find(l => l.category === category);
    if (!found) return;
    found.items.forEach(item => {setText(item.text); });
  }

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
                  <Button variant="outline" size="sm" onClick={() => seedDemo('Student Research')} className="min-w-[140px]">📚 Student Research</Button>
                  <Button variant="outline" size="sm" onClick={() => seedDemo('Wellbeing & Energy')} className="min-w-[140px]">🧘 Wellbeing & Energy</Button>
                  <Button variant="outline" size="sm" onClick={() => seedDemo('Money Watchlist')} className="min-w-[140px]">💳 Money Watchlist</Button>
                  <Button variant="outline" size="sm" onClick={() => seedDemo('Opportunities')} className="min-w-[140px]">🚀 Opportunities</Button>
                  <Button variant="outline" size="sm" onClick={() => seedDemo("App Builder’s Sandbox")} className="min-w-[140px]">🛠 App Builder’s Sandbox</Button>
                  <Button variant="outline" size="sm" onClick={() => seedDemo('Weekly Planning')} className="min-w-[140px]">🗓 Weekly Planning</Button>
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