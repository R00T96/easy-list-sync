import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RotateCcw, Check, X } from "lucide-react";
import type { ShoppingItem } from "@/store/shoppingList";

type ListItemRowProps = {
  item: ShoppingItem;
  onToggleDone: (id: string) => void;
  onUpdateQty: (id: string, delta: number) => void;
  onRestore: (id: string) => void;
  onUpdateText?: (id: string, newText: string) => void;
  showQuantity?: boolean;
};

const isUrl = (text: string) => {
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
};

export const ListItemRow = ({ 
  item, 
  onToggleDone, 
  onUpdateQty, 
  onRestore, 
  onUpdateText,
  showQuantity = true 
}: ListItemRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);

  const handleSave = () => {
    if (editText.trim() && editText !== item.text && onUpdateText) {
      onUpdateText(item.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(item.text);
    setIsEditing(false);
  };

  return (
    <li className={`flex items-center justify-between p-3 rounded-md border ${item.deleted ? 'opacity-60 bg-muted/30' : ''}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {!item.deleted && (
          <Checkbox 
            checked={item.done} 
            onCheckedChange={() => onToggleDone(item.id)} 
            aria-label={`Toggle ${item.text}`} 
          />
        )}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
                className="h-8"
                autoFocus
              />
              <Button variant="ghost" size="sm" onClick={handleSave}>
                <Check className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              {isUrl(item.text) ? (
                <a
                  href={item.text}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`font-medium leading-none text-blue-600 hover:text-blue-800 underline ${item.deleted ? 'line-through' : ''}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.text}
                </a>
              ) : (
                <p 
                  className={`font-medium leading-none cursor-pointer hover:text-primary transition-colors ${item.deleted ? 'line-through' : ''}`}
                  onClick={() => !item.deleted && setIsEditing(true)}
                >
                  {item.text}
                </p>
              )}
              {showQuantity && (
                <p className="text-xs text-muted-foreground">
                  Qty: {item.qty} {item.deleted && '• Removed'}
                </p>
              )}
              {!showQuantity && item.deleted && (
                <p className="text-xs text-muted-foreground">Removed</p>
              )}
            </>
          )}
        </div>
      </div>
      {!isEditing && (
        <div className="flex items-center gap-1">
          {item.deleted ? (
            <Button variant="outline" size="sm" onClick={() => onRestore(item.id)} aria-label="Add back to list">
              <RotateCcw className="mr-1 h-3 w-3" />
              Add Back
            </Button>
          ) : (
            <>
              {showQuantity && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => onUpdateQty(item.id, -1)} aria-label="Decrease quantity">-</Button>
                  <Button variant="ghost" size="sm" onClick={() => onUpdateQty(item.id, +1)} aria-label="Increase quantity">+</Button>
                </>
              )}
            </>
          )}
        </div>
      )}
    </li>
  );
};