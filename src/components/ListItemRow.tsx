import { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RotateCcw, Check, X, ExternalLink, ArrowRight, Mail, Phone, Calendar } from "lucide-react";
import type { ShoppingItem } from "@/store/shoppingList";
import { ItemParser, ParsedItem, ItemAction } from '@/lib/item-parser';

type ListItemRowProps = {
  item: ShoppingItem;
  onToggleDone: (id: string) => void;
  onUpdateQty: (id: string, delta: number) => void;
  onRestore: (id: string) => void;
  onUpdateText?: (id: string, newText: string) => void;
  onNavigateToList?: (listName: string) => void;
  onCalendarAction?: (action: string) => void;
  showQuantity?: boolean;
};

// Initialize parser once
const parser = new ItemParser();

// Action Icon Component
const ActionIcon = ({ type, className = "h-4 w-4" }: { type: ItemAction['type']; className?: string }) => {
  switch (type) {
    case 'link': return <ExternalLink className={className} />;
    case 'list-nav': return <ArrowRight className={className} />;
    case 'email': return <Mail className={className} />;
    case 'phone': return <Phone className={className} />;
    case 'calendar': return <Calendar className={className} />;
    default: return null;
  }
};

// Get href for clickable actions
const getActionHref = (action: ItemAction): string | null => {
  switch (action.type) {
    case 'link':
      return action.url;
    case 'email':
      const subject = action.subject ? `?subject=${encodeURIComponent(action.subject)}` : '';
      return `mailto:${action.address}${subject}`;
    case 'phone':
      return `tel:${action.number.replace(/\D/g, '')}`;
    default:
      return null;
  }
};

export const ListItemRow = ({ 
  item, 
  onToggleDone, 
  onUpdateQty, 
  onRestore, 
  onUpdateText,
  onNavigateToList,
  onCalendarAction,
  showQuantity = true 
}: ListItemRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);

  // Parse the item text
  const parsed = useMemo(() => parser.parse(item.text), [item.text]);

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

  const handleActionClick = (e: React.MouseEvent) => {
    if (item.deleted) return;

    const action = parsed.action;
    
    if (action.type === 'list-nav' && onNavigateToList) {
      e.preventDefault();
      onNavigateToList(action.listName);
    } else if (action.type === 'calendar' && onCalendarAction) {
      e.preventDefault();
      onCalendarAction(action.action);
    } else if (action.type === 'text') {
      // Plain text - trigger edit mode
      setIsEditing(true);
    }
  };

  // Render the item content based on parsed action
  const renderItemContent = () => {
    const action = parsed.action;
    const href = getActionHref(action);
    const hasInteractiveAction = action.type !== 'text';
    
    // Base classes
    const baseClasses = `font-medium leading-none transition-colors ${item.deleted ? 'line-through' : ''}`;
    const interactiveClasses = hasInteractiveAction 
      ? 'hover:text-primary' 
      : 'cursor-pointer hover:text-primary';

    // Content to display
    const displayContent = (
      <span className="flex items-center gap-2">
        {parsed.emoji && <span>{parsed.emoji}</span>}
        {hasInteractiveAction && <ActionIcon type={action.type} />}
        <span>
          {action.type === 'link' && action.display}
          {action.type === 'list-nav' && `→ ${action.display}`}
          {action.type === 'email' && action.display}
          {action.type === 'phone' && action.display}
          {action.type === 'calendar' && action.display}
          {action.type === 'text' && action.content}
        </span>
      </span>
    );

    // If there's an href (link, email, phone), render as anchor
    if (href) {
      return (
        <a
          href={href}
          target={action.type === 'link' ? '_blank' : undefined}
          rel={action.type === 'link' ? 'noopener noreferrer' : undefined}
          className={`${baseClasses} text-blue-600 hover:text-blue-800 underline`}
          onClick={(e) => e.stopPropagation()}
        >
          {displayContent}
        </a>
      );
    }

    // Otherwise render as clickable div/span
    return (
      <div
        className={`${baseClasses} ${interactiveClasses}`}
        onClick={handleActionClick}
      >
        {displayContent}
      </div>
    );
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
              {renderItemContent()}
              {showQuantity && (
                <p className="text-xs text-muted-foreground mt-1">
                  Qty: {item.qty} {item.deleted && '• Removed'}
                </p>
              )}
              {!showQuantity && item.deleted && (
                <p className="text-xs text-muted-foreground mt-1">Removed</p>
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