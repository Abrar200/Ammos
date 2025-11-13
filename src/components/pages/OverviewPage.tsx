import { useState, useEffect } from 'react';
import { StatsCard } from '../StatsCard';
import { SupplierList } from '../SupplierList';
import { ExpenseChart } from '../ExpenseChart';
import { WeeklyTargetCard } from '../WeeklyTargetCard';
import { DollarSign, TrendingUp, TrendingDown, Users, RefreshCw, Wifi, WifiOff, Calculator, Calendar } from 'lucide-react';
import { mockWeeklyData } from '@/data/mockData';
import { useRevenueData } from '@/hooks/useRevenueData';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Supplier } from '@/types/supplier';
import TakingsAnalytics from '../TakingsAnalytics';

export const OverviewPage = () => {
  const { data: revenueData, loading, error, lastUpdated, refetch } = useRevenueData(30000);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<any[]>([]);
  const [takingsData, setTakingsData] = useState<any>(null);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [takingsLoading, setTakingsLoading] = useState(true);
  const [suppliersError, setSuppliersError] = useState<string | null>(null);

  // Fetch all data sources for expense calculation
  const fetchAllExpenseData = async () => {
    try {
      setExpensesLoading(true);
      setSuppliersError(null);
      
      // Fetch suppliers
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (suppliersError) throw suppliersError;
      setSuppliers(suppliersData || []);

      // Fetch subscriptions
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'active');

      if (subscriptionsError) {
        console.warn('Subscriptions fetch error:', subscriptionsError);
        setSubscriptions([]);
      } else {
        setSubscriptions(subscriptionsData || []);
      }

      // Fetch current month payroll records
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data: payrollData, error: payrollError } = await supabase
        .from('payroll_records')
        .select('gross_pay, superannuation')
        .gte('pay_period_start', firstDayOfMonth.toISOString().split('T')[0])
        .lte('pay_period_end', lastDayOfMonth.toISOString().split('T')[0]);

      if (payrollError) {
        console.warn('Payroll fetch error:', payrollError);
        setPayrollRecords([]);
      } else {
        setPayrollRecords(payrollData || []);
      }

    } catch (error) {
      console.error('Error fetching expense data:', error);
      setSuppliersError(error instanceof Error ? error.message : 'Failed to fetch expense data');
    } finally {
      setExpensesLoading(false);
      setSuppliersLoading(false);
    }
  };

  // Fetch takings data for revenue calculations
  const fetchTakingsData = async () => {
    try {
      setTakingsLoading(true);
      
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // Get start of current week (Sunday)
      const firstDayOfWeek = new Date(now);
      firstDayOfWeek.setDate(now.getDate() - now.getDay());
      firstDayOfWeek.setHours(0, 0, 0, 0);
      
      // Get end of current week (Saturday)
      const lastDayOfWeek = new Date(firstDayOfWeek);
      lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
      lastDayOfWeek.setHours(23, 59, 59, 999);

      // Fetch this month's takings
      const { data: monthlyTakings, error: monthlyError } = await supabase
        .from('takings')
        .select('*')
        .gte('entry_date', firstDayOfMonth.toISOString().split('T')[0])
        .lte('entry_date', lastDayOfMonth.toISOString().split('T')[0]);

      // Fetch this week's takings
      const { data: weeklyTakings, error: weeklyError } = await supabase
        .from('takings')
        .select('*')
        .gte('entry_date', firstDayOfWeek.toISOString().split('T')[0])
        .lte('entry_date', lastDayOfWeek.toISOString().split('T')[0]);

      // Fetch today's takings
      const today = new Date().toISOString().split('T')[0];
      const { data: todayTakings, error: todayError } = await supabase
        .from('takings')
        .select('*')
        .eq('entry_date', today);

      if (monthlyError || weeklyError || todayError) {
        console.error('Error fetching takings:', monthlyError || weeklyError || todayError);
        return;
      }

      // Calculate totals
      const monthlyRevenue = monthlyTakings?.reduce((sum, taking) => sum + taking.gross_takings, 0) || 0;
      const weeklyRevenue = weeklyTakings?.reduce((sum, taking) => sum + taking.gross_takings, 0) || 0;
      const todayRevenue = todayTakings?.[0]?.gross_takings || 0;

      // Calculate weekly POS total for the change text
      const weeklyPOSTotal = weeklyTakings?.reduce((sum, taking) => sum + taking.pos_amount, 0) || 0;

      setTakingsData({
        monthlyRevenue,
        weeklyRevenue,
        todayRevenue,
        weeklyPOSTotal,
        monthlyTakings: monthlyTakings || [],
        weeklyTakings: weeklyTakings || [],
        todayTakings: todayTakings?.[0] || null
      });

    } catch (error) {
      console.error('Error fetching takings data:', error);
    } finally {
      setTakingsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllExpenseData();
    fetchTakingsData();
  }, []);

  // Calculate total expenses from all sources
  const calculateTotalExpenses = () => {
    // 1. Supplier expenses (monthly_total field)
    const totalSupplierExpenses = suppliers.reduce((sum, supplier) => {
      return sum + (supplier.monthly_total || 0);
    }, 0);

    // 2. Subscription expenses (convert billing cycle to monthly)
    const totalSubscriptionExpenses = subscriptions.reduce((sum, sub) => {
      let monthlyCost = 0;
      const cost = parseFloat(sub.cost) || 0;
      
      switch (sub.billing_cycle?.toLowerCase()) {
        case 'monthly':
          monthlyCost = cost;
          break;
        case 'weekly':
          monthlyCost = cost * 4.33; // Average weeks per month
          break;
        case 'yearly':
        case 'annual':
          monthlyCost = cost / 12;
          break;
        case 'quarterly':
          monthlyCost = cost / 3;
          break;
        default:
          monthlyCost = cost; // Assume monthly if not specified
      }
      
      return sum + monthlyCost;
    }, 0);

    // 3. Payroll expenses (gross pay + superannuation for current month)
    const totalPayrollExpenses = payrollRecords.reduce((sum, record) => {
      const grossPay = parseFloat(record.gross_pay) || 0;
      const super_amount = parseFloat(record.superannuation) || 0;
      return sum + grossPay + super_amount;
    }, 0);

    return {
      suppliers: totalSupplierExpenses,
      subscriptions: totalSubscriptionExpenses,
      payroll: totalPayrollExpenses,
      total: totalSupplierExpenses + totalSubscriptionExpenses + totalPayrollExpenses
    };
  };

  const expenses = calculateTotalExpenses();
  const totalExpenses = expenses.total;

  // Calculate revenue and profit using takings data
  const monthlyRevenue = takingsData?.monthlyRevenue || 0;
  const weeklyRevenue = takingsData?.weeklyRevenue || 0;
  const profit = monthlyRevenue - totalExpenses;

  // Prepare revenue chart data
  const revenueChartData = [
    { name: 'Today', amount: takingsData?.todayRevenue || 0 },
    { name: 'This Week', amount: weeklyRevenue },
    { name: 'This Month', amount: monthlyRevenue },
    { name: 'This Year', amount: revenueData?.yearRevenue || (monthlyRevenue * 12) }
  ];

  // Prepare expense chart data by category
  const expenseChartData = [
    { name: 'Suppliers', amount: expenses.suppliers },
    { name: 'Subscriptions', amount: expenses.subscriptions },
    { name: 'Payroll', amount: expenses.payroll }
  ].filter(item => item.amount > 0);

  const handleRefresh = () => {
    refetch();
    fetchAllExpenseData();
    fetchTakingsData();
  };

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
            onClick={handleRefresh}
            disabled={loading || expensesLoading || takingsLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${(loading || expensesLoading || takingsLoading) ? 'animate-spin' : ''}`} />
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
            Unable to load expense data: {suppliersError}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Weekly Revenue"
          value={`$${weeklyRevenue.toLocaleString('en-AU', { minimumFractionDigits: 2 })}`}
          change={takingsData?.weeklyPOSTotal ? `${takingsData.weeklyPOSTotal.toFixed(2)} POS` : 'No data this week'}
          changeType={weeklyRevenue > 0 ? "positive" : "neutral"}
          icon={Calendar}
          isLive={!error}
        />
        <StatsCard
          title="Monthly Revenue"
          value={`$${monthlyRevenue.toLocaleString('en-AU', { minimumFractionDigits: 2 })}`}
          change={`${takingsData?.monthlyTakings?.length || 0} days recorded`}
          changeType={monthlyRevenue > 0 ? "positive" : "neutral"}
          icon={TrendingUp}
          isLive={!error}
        />
        <StatsCard
          title="Monthly Expenses"
          value={`$${totalExpenses.toLocaleString('en-AU', { minimumFractionDigits: 2 })}`}
          change={expensesLoading ? 'Calculating...' : 'Real-time data'}
          changeType="neutral"
          icon={TrendingDown}
        />
        <StatsCard
          title="Monthly Profit"
          value={`$${profit.toLocaleString('en-AU', { minimumFractionDigits: 2 })}`}
          change={profit > 0 ? `${((profit / monthlyRevenue) * 100).toFixed(1)}% margin` : "Needs attention"}
          changeType={profit > 0 ? "positive" : "negative"}
          icon={DollarSign}
          isLive={!error}
        />
      </div>

      {/* Takings Summary Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            This Week's Takings Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TakingsAnalytics compact={true} />
        </CardContent>
      </Card>

      {/* Expense Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Supplier Costs</h3>
          <p className="text-3xl font-bold text-blue-600">
            ${expenses.suppliers.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-gray-500 mt-1">{suppliers.length} active suppliers</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Subscriptions</h3>
          <p className="text-3xl font-bold text-purple-600">
            ${expenses.subscriptions.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-gray-500 mt-1">{subscriptions.length} active subscriptions</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Payroll (This Month)</h3>
          <p className="text-3xl font-bold text-red-600">
            ${expenses.payroll.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-gray-500 mt-1">{payrollRecords.length} payroll records</p>
        </div>
      </div>

      {/* Weekly Target */}
      <div className="w-full">
        <WeeklyTargetCard
          weeklyTarget={mockWeeklyData.weeklyTarget}
          currentWeekRevenue={weeklyRevenue}
          currentWeekExpenses={totalExpenses / 4.33}
          isLive={!error}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {expenseChartData.length > 0 ? (
          <ExpenseChart data={expenseChartData} title="Monthly Expenses by Category" />
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Expenses by Category</h3>
            <div className="flex items-center justify-center h-64 text-gray-500">
              {expensesLoading ? 'Loading expense data...' : 'No expense data available'}
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
          <SupplierList suppliers={suppliers.slice(0, 5)} />
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