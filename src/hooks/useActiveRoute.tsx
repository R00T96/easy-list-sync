// hooks/useActiveRoute.ts
import { useLocation } from 'react-router-dom';

export const useActiveRoute = () => {
  const location = useLocation();

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return { currentPath: location.pathname, isActivePath };
};