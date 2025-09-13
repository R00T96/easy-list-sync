// components/Sidebar/NavigationItem.tsx
import React from 'react';
import { NavigationItem as NavigationItemType } from '../../types/navigation';

interface NavigationItemProps {
  item: NavigationItemType;
  isActive: boolean;
  isExpanded: boolean;
  onClick: (path: string) => void;
}

export const NavigationItem: React.FC<NavigationItemProps> = ({
  item,
  isActive,
  isExpanded,
  onClick
}) => {
  return (
    <button
      onClick={() => onClick(item.path)}
      className={`w-full mx-2 mb-1 rounded-lg hover:bg-accent transition-colors cursor-pointer group relative ${
        isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      <div className="flex items-center p-3">
        <div className="flex-shrink-0">
          <item.icon className="w-5 h-5" />
        </div>

        {isExpanded && (
          <div className="ml-3 flex-1 min-w-0">
            <span className="text-sm truncate block text-left">
              {item.label}
            </span>
          </div>
        )}
      </div>

      {!isExpanded && (
        <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-popover text-popover-foreground text-sm px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap border border-border shadow-lg">
          <div className="font-medium">{item.label}</div>
          <div className="text-xs text-muted-foreground">{item.description}</div>
        </div>
      )}
    </button>
  );
};