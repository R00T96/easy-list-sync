// config/navigationConfig.ts
import { Home, List, Shield, Plus } from 'lucide-react';
import { NavigationItem } from '../types/navigation';

export const mainNavigationItems: NavigationItem[] = [
  { 
    icon: Home, 
    label: 'Home', 
    path: '/',
    description: 'Main shopping list'
  },
  { 
    icon: List, 
    label: 'Open Lists', 
    path: '/open',
    description: 'Browse public lists'
  },
  { 
    icon: Shield, 
    label: 'Privacy', 
    path: '/privacy',
    description: 'Privacy policy'
  },
];

export const additionalNavigationItems: NavigationItem[] = [
  {
    icon: Plus,
    label: 'My Preferences',
    path: '/preferences',
    description: 'Coming soon'
  }
];