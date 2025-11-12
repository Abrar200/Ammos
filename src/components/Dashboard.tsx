import { useState } from 'react';
import { DashboardHeader } from './DashboardHeader';
import { DashboardNav } from './DashboardNav';
import { OverviewPage } from './pages/OverviewPage';
import { OrderingPage } from './pages/OrderingPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { OutgoingsPage } from './pages/OutgoingsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { StaffWagesPage } from './pages/StaffWagesPage';
import LicensesPage from './pages/LicensesPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import { InvoiceOCRPage } from './pages/InvoiceOCRPage';
import { InventoryTrackerPage } from './pages/InventoryTrackerPage';
import { StaffRosterPage } from './pages/StaffRosterPage';
import { BusinessHealthPage } from './pages/BusinessHealthPage';
import { TasksNotesPage } from './pages/TasksNotesPage';
import { SurveillancePage } from './pages/SurveillancePage';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import TakingsPage from './pages/TakingsPage';

export const Dashboard = () => {
  const [currentPage, setCurrentPage] = useState('overview');
  const { signOut, user } = useAuth();

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <ProtectedRoute permission="dashboard"><OverviewPage /></ProtectedRoute>;
      case 'takings': // Add this case
        return <ProtectedRoute permission="takings"><TakingsPage /></ProtectedRoute>;
      case 'ordering':
        return <ProtectedRoute permission="ordering"><OrderingPage /></ProtectedRoute>;
      case 'suppliers':
        return <ProtectedRoute permission="suppliers"><SuppliersPage /></ProtectedRoute>;
      case 'outgoings':
        return <ProtectedRoute permission="outgoings"><OutgoingsPage /></ProtectedRoute>;
      case 'transactions':
        return <ProtectedRoute permission="transactions"><TransactionsPage /></ProtectedRoute>;
      case 'integrations':
        return <ProtectedRoute permission="integrations"><IntegrationsPage /></ProtectedRoute>;
      case 'staff':
        return <ProtectedRoute permission="staff"><StaffWagesPage /></ProtectedRoute>;
      case 'licenses':
        return <ProtectedRoute permission="licenses"><LicensesPage /></ProtectedRoute>;
      case 'subscriptions':
        return <ProtectedRoute permission="subscriptions"><SubscriptionsPage /></ProtectedRoute>;
      case 'invoice-ocr':
        return <ProtectedRoute permission="invoice_ocr"><InvoiceOCRPage /></ProtectedRoute>;
      case 'inventory':
        return <ProtectedRoute permission="inventory"><InventoryTrackerPage /></ProtectedRoute>;
      case 'roster':
        return <ProtectedRoute permission="roster"><StaffRosterPage /></ProtectedRoute>;
      case 'health-score':
        return <ProtectedRoute permission="business_health"><BusinessHealthPage /></ProtectedRoute>;
      case 'tasks':
        return <ProtectedRoute permission="tasks"><TasksNotesPage /></ProtectedRoute>;
      case 'surveillance':
        return <ProtectedRoute permission="surveillance"><SurveillancePage /></ProtectedRoute>;
      case 'settings':
        return <ProtectedRoute permission="settings"><div className="p-8 text-center text-gray-500">Settings page coming soon...</div></ProtectedRoute>;
      default:
        return <ProtectedRoute permission="dashboard"><OverviewPage /></ProtectedRoute>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardNav currentPage={currentPage} onPageChange={setCurrentPage} />

      <div className="flex-1 flex flex-col">
        <DashboardHeader user={user} onLogout={signOut} />

        <main className="flex-1 p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};