// types/navigation.ts
import { LucideIcon } from 'lucide-react';

export interface NavigationItem {
  icon: LucideIcon;
  label: string;
  path: string;
  description: string;
}