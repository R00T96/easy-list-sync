// components/Sidebar/SidebarHeader.tsx
import React from 'react';
import { ChevronLeft, Menu } from 'lucide-react';

interface SidebarHeaderProps {
  isExpanded: boolean;
  onToggle: () => void;
  title?: string;
  logo?: React.ReactNode;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  isExpanded,
  onToggle,
  title = "Our List",
  logo
}) => {
  const defaultLogo = (
    <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center">
      <span className="text-primary-foreground text-xs font-bold">OL</span>
    </div>
  );

  return (
    <div className="flex items-center justify-between p-3 border-b border-border">
      {isExpanded && (
        <div className="flex items-center space-x-2">
          {logo || defaultLogo}
          <span className="text-foreground font-medium">{title}</span>
        </div>
      )}
      <button
        onClick={onToggle}
        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
      >
        {isExpanded ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <Menu className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};