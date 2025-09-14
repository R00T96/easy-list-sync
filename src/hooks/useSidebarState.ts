// hooks/useSidebarState.ts
import { useState } from 'react';

export const useSidebarState = () => {
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('sidebar-expanded');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleSidebar = () => {
    const newState = !isExpanded; // whats saved in localStorage -> flip it
    setIsExpanded(newState); // update the flipped state
    localStorage.setItem('sidebar-expanded', JSON.stringify(newState)); // persist the new state
  };

  return { isExpanded, toggleSidebar };
};