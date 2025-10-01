import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, History, Heart } from "lucide-react";
import { ListItemRow } from "./ListItemRow";
import { ListSettingsDialog } from "./ListSettingsDialog";
import { usePin } from "@/hooks/usePin";
import { usePinPreferences } from "@/context/PinPreferencesContext";
import type { ShoppingItem } from "@/store/shoppingList";
import { FeedbackButton } from './FeedbackButton';

type ListActions = {
  addItem: () => void;
  updateQty: (id: string, delta: number) => void;
  toggleDone: (id: string) => void;
  clearCompleted: () => void;
  restoreItem: (id: string) => void;
  updateText: (id: string, newText: string) => void;
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
  const { listType } = usePinPreferences();
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

  const headerOptions = [
    {
      title: "Everyone instantly sees what you add.",
      description: "Tap [✓] to check off. No repeats, nothing missed."
    },
    {
      title: "Perfect for group planning.",
      description: "Share groceries, chores, or event planning with friends."
    },
    {
      title: "Real-time collaboration made simple.",
      description: "Add items, assign tasks, stay organized together."
    },
    {
      title: "Never forget anything again.",
      description: "Live sync means everyone stays on the same page."
    },
    {
      title: "From shopping to planning.",
      description: "Organize anything with your team in real-time."
    },
    {
      title: "One list, everyone connected.",
      description: "Changes appear instantly for all collaborators."
    },
    {
      title: "Teamwork just got easier.",
      description: "Share tasks, track progress, get things done together."
    }
  ];
  
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [headerIdx, setHeaderIdx] = useState(0);
  
  useEffect(() => {
    if (text) return; // Don't rotate if user is typing
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % placeholderOptions.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [text]);

  useEffect(() => {
    // Rotate headers independently from placeholders, slightly offset timing
    const interval = setInterval(() => {
      setHeaderIdx((i) => (i + 1) % headerOptions.length);
    }, 3500); // Slightly longer interval for headers
    return () => clearInterval(interval);
  }, []);

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

  const getProgressEncouragement = (completedCount: number, totalCount: number) => {
    const percentage = (completedCount / totalCount) * 100;
    
    if (percentage >= 75) {
      return "Almost there! 🎯";
    } else if (percentage >= 50) {
      return "Halfway done! 💪";
    } else if (percentage >= 25) {
      return "Great start! ⭐";
    } else {
      return "Keep going! 🚀";
    }
  };

  const activeItems = allItems.filter(item => !item.done).length;
  const totalItems = allItems.length;
  const progressPercentage = totalItems > 0 ? (allItems.filter(item => item.done).length / totalItems) * 100 : 0;
  const [showCelebration, setShowCelebration] = useState(false);
  const [previousProgress, setPreviousProgress] = useState(0);
  
  // Trigger celebration when reaching 100%
  useEffect(() => {
    if (progressPercentage === 100 && previousProgress < 100 && totalItems > 0) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 4000); // Hide after 4 seconds
    }
    setPreviousProgress(progressPercentage);
  }, [progressPercentage, previousProgress, totalItems]);

  return (
    <>
      {/* Celebration overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="text-center animate-pulse">
            <div className="text-8xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-4xl font-bold text-primary mb-2 animate-fade-in">
              All Done!
            </h2>
            <p className="text-xl text-muted-foreground animate-fade-in">
              Great work completing everything on your list!
            </p>
            <div className="mt-6 flex justify-center space-x-4">
              <span className="text-3xl animate-bounce" style={{ animationDelay: '0.1s' }}>✨</span>
              <span className="text-3xl animate-bounce" style={{ animationDelay: '0.2s' }}>🎊</span>
              <span className="text-3xl animate-bounce" style={{ animationDelay: '0.3s' }}>🎈</span>
              <span className="text-3xl animate-bounce" style={{ animationDelay: '0.4s' }}>🎆</span>
              <span className="text-3xl animate-bounce" style={{ animationDelay: '0.5s' }}>✨</span>
            </div>
            {/* <div className="mt-8">
              <Button 
                className="bg-pink-500 hover:bg-pink-600 text-white animate-pulse"
                onClick={() => {
                  // You can customize this to open a feedback form, email, or survey
                  window.open('mailto:feedback@yourapp.com?subject=Loving the app!&body=Just completed my list and wanted to share some love! 🎉', '_blank');
                }}
              >
                <Heart className="mr-2 h-4 w-4" />
                Share the Love
              </Button>
            </div> */}
          </div>
        </div>
      )}
      
      <section aria-labelledby="list-heading" className="mx-auto max-w-2xl">
      <Card className="shadow-sm">

        {/* Progress bar at the top */}
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Progress
            </span>
            <span className="text-sm text-muted-foreground">
              {activeItems} items remaining
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          {completedCount > 0 && (
            <p className="text-xs text-muted-foreground mt-1 text-center">
              {getProgressEncouragement(completedCount, totalItems)}
            </p>
          )}
        </div>

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
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowAllItems(!showAllItems)}
                    className="text-sm"
                  >
                    <History className="mr-2 h-4 w-4" />
                    {showAllItems ? "Show Active Only" : "View All Items"}
                  </Button>
                  <ListSettingsDialog />
                </div>
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
                onUpdateText={actions.updateText}
                onNavigateToList={(listName) => {
                  // Navigate to the specified list
                  console.log('Navigate to:', listName);
                }}
                onCalendarAction={(action) => {
                  // Handle calendar action
                  console.log('Calendar action:', action);
                }}
                showQuantity={listType === 'shopping'}
              />
            ))}
          </ul>

          {completedCount > 0 && (
            <div className="mt-6 flex justify-end">
              <Button variant="destructive" onClick={actions.clearCompleted} disabled={completedCount === 0} aria-label="Clear completed" className="w-full sm:w-auto">
                <Trash2 className="mr-2 h-4 w-4" /> Clear completed
              </Button>
            </div>
          )}
        </CardContent>

        {/* Dynamic header/description moved to bottom */}
        <div className="px-6 pb-6">
          <div className="text-center border-t pt-4">
            <h3 className="font-medium text-sm transition-opacity duration-300 mb-1">
              {headerOptions[headerIdx].title}
            </h3>
            <p className="text-xs text-muted-foreground transition-opacity duration-300">
              {headerOptions[headerIdx].description}
            </p>
          </div>
        </div>
      </Card>
    </section>
    </>
  );
};