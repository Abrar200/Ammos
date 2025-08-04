import {
  BarChart3,
  Users,
  CreditCard,
  UserCheck,
  TrendingUp,
  Banknote,
  Settings,
  Home,
  Plug,
  FileText,
  ScanLine,
  Package,
  Calendar,
  Activity,
  Inbox,
  ClipboardList,
  Camera,
  ShoppingCart
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardNavProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'ordering', label: 'Ordering', icon: ShoppingCart },
  { id: 'outgoings', label: 'Outgoings', icon: BarChart3 },
  { id: 'suppliers', label: 'Suppliers', icon: Users },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  { id: 'staff', label: 'Staff & Wages', icon: UserCheck },
  { id: 'licenses', label: 'Licenses & Permits', icon: FileText },
  { id: 'invoice-ocr', label: 'Invoice OCR', icon: ScanLine },
  { id: 'inventory', label: 'Inventory Tracker', icon: Package },
  { id: 'roster', label: 'Staff Roster', icon: Calendar },
  { id: 'surveillance', label: 'Surveillance', icon: Camera },
  { id: 'health-score', label: 'Business Health', icon: Activity },
  { id: 'tasks', label: 'Tasks & Notes', icon: ClipboardList },
  { id: 'expense-inbox', label: 'Expense Inbox', icon: Inbox },
  { id: 'profit', label: 'Profit & Cash Flow', icon: TrendingUp },
  { id: 'transactions', label: 'Bank Transactions', icon: Banknote },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const DashboardNav = ({ currentPage, onPageChange }: DashboardNavProps) => {
  return (
    <nav className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Admin Dashboard</h2>
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onPageChange(item.id)}
                  className={cn(
                    "w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                    currentPage === item.id
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};