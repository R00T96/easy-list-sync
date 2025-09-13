// components/Sidebar/NavigationSection.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NavigationItem } from './NavigationItem';
import { NavigationItem as NavigationItemType } from '../../types/navigation';
import { useActiveRoute } from '../../hooks/useActiveRoute';

interface NavigationSectionProps {
  items: NavigationItemType[];
  isExpanded: boolean;
  title?: string;
}

export const NavigationSection: React.FC<NavigationSectionProps> = ({
  items,
  isExpanded,
  title
}) => {
  const navigate = useNavigate();
  const { isActivePath } = useActiveRoute();

  const handleItemClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="py-2">
      {title && isExpanded && (
        <div className="px-5 pb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </span>
        </div>
      )}
      {items.map((item) => (
        <NavigationItem
          key={item.path}
          item={item}
          isActive={isActivePath(item.path)}
          isExpanded={isExpanded}
          onClick={handleItemClick}
        />
      ))}
    </div>
  );
};
