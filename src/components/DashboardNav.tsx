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
  ShoppingCart,
  Calculator
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';

interface DashboardNavProps {}

const navItems = [
  { id: 'overview', label: 'Overview', icon: Home, path: '/', permission: 'dashboard' },
  { id: 'takings', label: 'Takings', icon: Calculator, path: '/takings', permission: 'takings' },
  { id: 'ordering', label: 'Ordering', icon: ShoppingCart, path: '/ordering', permission: 'ordering' },
  { id: 'outgoings', label: 'Outgoings', icon: BarChart3, path: '/outgoings', permission: 'outgoings' },
  { id: 'suppliers', label: 'Suppliers', icon: Users, path: '/suppliers', permission: 'suppliers' },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard, path: '/subscriptions', permission: 'subscriptions' },
  { id: 'staff', label: 'Staff & Wages', icon: UserCheck, path: '/staff', permission: 'staff' },
  { id: 'licenses', label: 'Licenses & Permits', icon: FileText, path: '/licenses', permission: 'licenses' },
  { id: 'invoice-ocr', label: 'Invoice OCR', icon: ScanLine, path: '/invoice-ocr', permission: 'invoice_ocr' },
  { id: 'roster', label: 'Staff Roster', icon: Calendar, path: '/roster', permission: 'roster' },
  { id: 'surveillance', label: 'Surveillance', icon: Camera, path: '/surveillance', permission: 'surveillance' },
  { id: 'health-score', label: 'Business Health', icon: Activity, path: '/health-score', permission: 'business_health' },
  { id: 'tasks', label: 'Tasks & Notes', icon: ClipboardList, path: '/tasks', permission: 'tasks' },
  { id: 'transactions', label: 'Bank Transactions', icon: Banknote, path: '/transactions', permission: 'transactions' },
  { id: 'integrations', label: 'Integrations', icon: Plug, path: '/integrations', permission: 'integrations' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings', permission: 'settings' },
];

export const DashboardNav = ({}: DashboardNavProps) => {
  const location = useLocation();

  return (
    <nav className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Admin Dashboard</h2>
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.id}>
                <Link
                  to={item.path}
                  className={cn(
                    "w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};