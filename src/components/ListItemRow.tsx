import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import type { ShoppingItem } from "@/store/shoppingList";

type ListItemRowProps = {
  item: ShoppingItem;
  onToggleDone: (id: string) => void;
  onUpdateQty: (id: string, delta: number) => void;
  onRestore: (id: string) => void;
};

export const ListItemRow = ({ item, onToggleDone, onUpdateQty, onRestore }: ListItemRowProps) => {
  return (
    <li className={`flex items-center justify-between p-3 rounded-md border ${item.deleted ? 'opacity-60 bg-muted/30' : ''}`}>
      <div className="flex items-center gap-3">
        {!item.deleted && (
          <Checkbox 
            checked={item.done} 
            onCheckedChange={() => onToggleDone(item.id)} 
            aria-label={`Toggle ${item.text}`} 
          />
        )}
        <div>
          <p className={`font-medium leading-none ${item.deleted ? 'line-through' : ''}`}>
            {item.text}
          </p>
          <p className="text-xs text-muted-foreground">
            Qty: {item.qty} {item.deleted && '• Removed'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {item.deleted ? (
          <Button variant="outline" size="sm" onClick={() => onRestore(item.id)} aria-label="Add back to list">
            <RotateCcw className="mr-1 h-3 w-3" />
            Add Back
          </Button>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={() => onUpdateQty(item.id, -1)} aria-label="Decrease quantity">-</Button>
            <Button variant="ghost" size="sm" onClick={() => onUpdateQty(item.id, +1)} aria-label="Increase quantity">+</Button>
          </>
        )}
      </div>
    </li>
  );
};