import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  permission?: string;
  action?: string;
  fallback?: ReactNode;
}

export const ProtectedRoute = ({ 
  children, 
  permission, 
  action = 'view',
  fallback 
}: ProtectedRouteProps) => {
  // Always allow access since login is disabled
  return <>{children}</>;
};