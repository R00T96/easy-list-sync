// components/Layout/Layout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '../../contexts/SidebarContext';
import { Sidebar } from '../Sidebar/Sidebar';
import { NavigationSection } from '../Sidebar/NavigationSection';
import { useSidebarState } from '../../hooks/useSidebarState';
import { mainNavigationItems, additionalNavigationItems } from '../../config/navigationConfig';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const sidebarState = useSidebarState();

  const additionalSections = (
    <>
      <div className="my-4 mx-3 border-t border-border" />
      <NavigationSection
        items={additionalNavigationItems}
        isExpanded={sidebarState.isExpanded}
      />
    </>
  );

  return (
    <SidebarProvider value={sidebarState}>
      <div className="flex h-screen bg-background">
        <Sidebar
          isExpanded={sidebarState.isExpanded}
          onToggle={sidebarState.toggleSidebar}
          navigationItems={mainNavigationItems}
          additionalSections={additionalSections}
        />
        
        <div className="flex-1 overflow-auto">
          {children || <Outlet />}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;