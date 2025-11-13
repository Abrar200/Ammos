import { Outlet } from 'react-router-dom';
import { DashboardHeader } from './DashboardHeader';
import { DashboardNav } from './DashboardNav';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';

export const DashboardLayout = () => {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardNav />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader user={user} onLogout={signOut} />
        
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};