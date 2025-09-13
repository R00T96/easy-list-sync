// components/Sidebar/Sidebar.tsx
import React from 'react';
import { SidebarHeader } from './SidebarHeader';
import { NavigationSection } from './NavigationSection';
import { NavigationItem } from '../../types/navigation';

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
  navigationItems: NavigationItem[];
  additionalSections?: React.ReactNode;
  header?: {
    title?: string;
    logo?: React.ReactNode;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  isExpanded,
  onToggle,
  navigationItems,
  additionalSections,
  header
}) => {
  return (
    <div 
      className={`bg-card border-r border-border transition-all duration-300 ease-in-out flex flex-col ${
        isExpanded ? 'w-64' : 'w-16'
      }`}
    >
      <SidebarHeader
        isExpanded={isExpanded}
        onToggle={onToggle}
        title={header?.title}
        logo={header?.logo}
      />

      <nav className="flex-1 py-4">
        <NavigationSection
          items={navigationItems}
          isExpanded={isExpanded}
        />
        
        {additionalSections}
      </nav>
    </div>
  );
};