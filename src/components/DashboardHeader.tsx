import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface DashboardHeaderProps {
  onLogout: () => void;
  user: SupabaseUser | null;
}

export const DashboardHeader = ({ onLogout, user }: DashboardHeaderProps) => {
  return (
    <header className="bg-white shadow-sm border-b" style={{ borderColor: '#E1D9CD' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <img
              src="https://d64gsuwffb70l.cloudfront.net/685afce20bfda24fc0f1d36c_1753796540506_1ce0d419.png"
              alt="Ammos Greek Bistro"
              className="h-10 w-auto"
            />
            <div className="h-8 w-px bg-gray-300"></div>
            <h1 className="text-2xl font-bold" style={{ color: '#102E47' }}>
              Admin Panel
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2" style={{ color: '#102E47' }}>
              <User className="h-5 w-5" />
              <span className="text-sm">{user?.email || 'Admin User'}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="flex items-center space-x-2"
              style={{
                borderColor: '#102E47',
                color: '#102E47'
              }}
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};