import { useState, useEffect } from 'react';
import { StatsCard } from '../StatsCard';
import { SupplierList } from '../SupplierList';
import { ExpenseChart } from '../ExpenseChart';
import { WeeklyTargetCard } from '../WeeklyTargetCard';
import { DollarSign, TrendingUp, TrendingDown, Users, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { mockExpenseData, mockStats, mockWeeklyData } from '@/data/mockData';
import { useRevenueData } from '@/hooks/useRevenueData';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Supplier } from '@/types/supplier';

export const OverviewPage = () => {
  const { data: revenueData, loading, error, lastUpdated, refetch } = useRevenueData(30000); // Update every 30 seconds
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [suppliersError, setSuppliersError] = useState<string | null>(null);

  // Fetch suppliers from backend
  const fetchSuppliers = async () => {
    try {
      setSuppliersLoading(true);
      setSuppliersError(null);
      
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5); // Only get the 5 most recent suppliers for overview

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setSuppliersError(error instanceof Error ? error.message : 'Failed to fetch suppliers');
    } finally {
      setSuppliersLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Calculate profit using live revenue data
  const totalRevenue = revenueData?.monthRevenue || mockStats.totalRevenue;
  
  // Calculate total expenses from real supplier data
  const totalSupplierExpenses = suppliers.reduce((sum, supplier) => sum + (supplier.monthly_total || 0), 0);
  // You can add other expense categories here if you have them
  const totalExpenses = totalSupplierExpenses; // + otherExpenses if you have them
  
  const profit = totalRevenue - totalExpenses;

  // Prepare revenue chart data with correct format for ExpenseChart
  const revenueChartData = revenueData ? [
    { name: 'Today', amount: revenueData.todayRevenue },
    { name: 'This Week', amount: revenueData.weekRevenue },
    { name: 'This Month', amount: revenueData.monthRevenue },
    { name: 'This Year', amount: revenueData.yearRevenue }
  ] : [
    { name: 'Today', amount: 2845 },
    { name: 'This Week', amount: 18320 },
    { name: 'This Month', amount: 85420 },
    { name: 'This Year', amount: 1250000 }
  ];

  // Prepare expense chart data from real supplier data
  const expensesByCategory = suppliers.reduce((acc, supplier) => {
    const category = supplier.supplier_type || 'Other';
    acc[category] = (acc[category] || 0) + (supplier.monthly_total || 0);
    return acc;
  }, {} as Record<string, number>);

  const expenseChartData = Object.entries(expensesByCategory).map(([name, amount]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    amount
  }));

  return (
    <div className="space-y-6">
      {/* Live Data Status */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Business Overview</h1>
          <Badge variant={error ? "destructive" : "default"} className="flex items-center gap-1">
            {error ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
            {error ? 'Offline Data' : 'Live Data'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetch();
              fetchSuppliers();
            }}
            disabled={loading || suppliersLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${(loading || suppliersLoading) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alerts */}
      {error && (
        <Alert>
          <AlertDescription>
            Unable to connect to Lightspeed POS: {error}. Displaying cached data.
          </AlertDescription>
        </Alert>
      )}

      {suppliersError && (
        <Alert variant="destructive">
          <AlertDescription>
            Unable to load supplier data: {suppliersError}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Today's Revenue"
          value={`$${(revenueData?.todayRevenue || 2845).toLocaleString('en-AU', { minimumFractionDigits: 2 })}`}
          change={`${revenueData?.todayTransactions || 45} transactions`}
          changeType="positive"
          icon={DollarSign}
          isLive={!error}
        />
        <StatsCard
          title="Monthly Revenue"
          value={`$${totalRevenue.toLocaleString('en-AU', { minimumFractionDigits: 2 })}`}
          change="+12% from last month"
          changeType="positive"
          icon={TrendingUp}
          isLive={!error}
        />
        <StatsCard
          title="Total Expenses"
          value={`$${totalExpenses.toLocaleString('en-AU', { minimumFractionDigits: 2 })}`}
          change={`${suppliers.length} suppliers`}
          changeType="neutral"
          icon={TrendingDown}
        />
        <StatsCard
          title="Net Profit"
          value={`$${profit.toLocaleString('en-AU', { minimumFractionDigits: 2 })}`}
          change={profit > 0 ? "+15% from last month" : "Needs attention"}
          changeType={profit > 0 ? "positive" : "negative"}
          icon={TrendingUp}
          isLive={!error}
        />
      </div>

      {/* Supplier Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Suppliers</h3>
          <p className="text-3xl font-bold text-blue-600">{suppliers.length}</p>
          <p className="text-sm text-gray-500 mt-1">Active supplier relationships</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Monthly Supplier Costs</h3>
          <p className="text-3xl font-bold text-red-600">
            ${totalSupplierExpenses.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-gray-500 mt-1">Total monthly commitments</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Average Cost per Supplier</h3>
          <p className="text-3xl font-bold text-purple-600">
            ${suppliers.length > 0 ? (totalSupplierExpenses / suppliers.length).toLocaleString('en-AU', { minimumFractionDigits: 2 }) : '0.00'}
          </p>
          <p className="text-sm text-gray-500 mt-1">Per supplier per month</p>
        </div>
      </div>

      {/* Weekly Target - Use live revenue data */}
      <div className="w-full">
        <WeeklyTargetCard
          weeklyTarget={mockWeeklyData.weeklyTarget}
          currentWeekRevenue={revenueData?.weekRevenue || mockWeeklyData.currentWeekRevenue}
          currentWeekExpenses={totalExpenses / 4.33} // Convert monthly to weekly estimate
          isLive={!error}
        />
      </div>

      {/* Live Revenue Metrics */}
      {revenueData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Order Value</h3>
            <p className="text-3xl font-bold text-green-600">
              ${revenueData.averageOrderValue.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Per transaction today</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Item</h3>
            <p className="text-lg font-bold text-blue-600">
              {revenueData.topSellingItems[0]?.name || 'No data'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {revenueData.topSellingItems[0]?.quantity || 0} sold this month
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h3>
            <p className="text-3xl font-bold text-purple-600">
              {revenueData.todayTransactions}
            </p>
            <p className="text-sm text-gray-500 mt-1">Transactions today</p>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {expenseChartData.length > 0 ? (
          <ExpenseChart data={expenseChartData} title="Expenses by Category" />
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h3>
            <div className="flex items-center justify-center h-64 text-gray-500">
              {suppliersLoading ? 'Loading expense data...' : 'No supplier data available'}
            </div>
          </div>
        )}
        <ExpenseChart data={revenueChartData} title="Revenue Overview" />
      </div>

      {/* Recent Suppliers */}
      <div>
        {suppliersLoading ? (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Suppliers</h3>
            <div className="flex items-center justify-center h-32 text-gray-500">
              Loading suppliers...
            </div>
          </div>
        ) : suppliers.length > 0 ? (
          <SupplierList suppliers={suppliers} />
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Suppliers</h3>
            <div className="flex items-center justify-center h-32 text-gray-500">
              No suppliers found. Add your first supplier to get started!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};