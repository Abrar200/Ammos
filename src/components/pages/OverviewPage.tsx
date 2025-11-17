import { useState, useEffect } from 'react';
import { StatsCard } from '../StatsCard';
import { SupplierList } from '../SupplierList';
import { ExpenseChart } from '../ExpenseChart';
import { WeeklyTargetCard } from '../WeeklyTargetCard';
import { DollarSign, TrendingUp, TrendingDown, Users, RefreshCw, Wifi, WifiOff, Calculator, Calendar } from 'lucide-react';
import { mockWeeklyData } from '@/data/mockData';
import { useRevenueData } from '@/hooks/useRevenueData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Supplier } from '@/types/supplier';
import TakingsAnalytics from '../TakingsAnalytics';
import { toast } from "@/components/ui/use-toast"

// Helper function to get Monday of current week in UTC
const getMondayOfWeek = (date: Date) => {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utcDate.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
  const monday = new Date(utcDate);
  const diff = day === 0 ? -6 : 1 - day;
  monday.setUTCDate(utcDate.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
};

// Helper function to get Sunday of current week in UTC
const getSundayOfWeek = (date: Date) => {
  const monday = getMondayOfWeek(date);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);
  return sunday;
};

// Helper to convert local date to UTC date string for Supabase
const toUTCDateString = (date: Date) => {
  return date.toISOString().split('T')[0];
};

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
  const [weeklyTrend, setWeeklyTrend] = useState<number>(0);

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

  const fetchTakingsData = async () => {
    try {
      setTakingsLoading(true);
      
      const now = new Date();
      
      // Get dates in UTC for consistent timezone handling
      const firstDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const lastDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
      
      // Get current week (Monday to Sunday) in UTC
      const currentWeekStart = getMondayOfWeek(now);
      const currentWeekEnd = getSundayOfWeek(now);
  
      // Get previous week for trend calculation
      const previousWeekStart = new Date(currentWeekStart);
      const previousWeekEnd = new Date(currentWeekEnd);
      previousWeekStart.setUTCDate(currentWeekStart.getUTCDate() - 7);
      previousWeekEnd.setUTCDate(currentWeekEnd.getUTCDate() - 7);
  
      console.log('=== UTC DATE RANGES ===');
      console.log('Current Week:', currentWeekStart.toUTCString(), 'to', currentWeekEnd.toUTCString());
      console.log('Previous Week:', previousWeekStart.toUTCString(), 'to', previousWeekEnd.toUTCString());
      console.log('Today (local):', now.toString());
  
      // Fetch all data using UTC date strings
      const [
        { data: monthlyTakings, error: monthlyError },
        { data: currentWeekTakings, error: currentWeekError },
        { data: previousWeekTakings, error: previousWeekError }
      ] = await Promise.all([
        supabase
          .from('takings')
          .select('*')
          .gte('entry_date', toUTCDateString(firstDayOfMonth))
          .lte('entry_date', toUTCDateString(lastDayOfMonth)),
        supabase
          .from('takings')
          .select('*')
          .gte('entry_date', toUTCDateString(currentWeekStart))
          .lte('entry_date', toUTCDateString(currentWeekEnd))
          .order('entry_date', { ascending: true }),
        supabase
          .from('takings')
          .select('*')
          .gte('entry_date', toUTCDateString(previousWeekStart))
          .lte('entry_date', toUTCDateString(previousWeekEnd))
          .order('entry_date', { ascending: true })
      ]);
  
      // Handle errors
      const errors = [monthlyError, currentWeekError, previousWeekError].filter(Boolean);
      if (errors.length > 0) {
        console.error('Errors fetching takings:', errors);
        throw new Error(`Failed to fetch takings data: ${errors[0]?.message}`);
      }
  
      console.log('=== FETCHED DATA ===');
      console.log('Current week takings:', currentWeekTakings?.map(t => ({
        date: t.entry_date,
        amount: t.gross_takings,
        localDate: new Date(t.entry_date).toString()
      })));
  
      // Calculate today's date in UTC for comparison
      const todayUTC = toUTCDateString(new Date());
      
      // Filter to only include days up to today (no future dates)
      const actualCurrentWeekTakings = currentWeekTakings?.filter(taking => 
        taking.entry_date <= todayUTC
      ) || [];
  
      console.log('=== FILTERED DATA ===');
      console.log('Actual current week takings:', actualCurrentWeekTakings?.map(t => ({
        date: t.entry_date,
        amount: t.gross_takings
      })));
  
      // Calculate totals
      const monthlyRevenue = monthlyTakings?.reduce((sum, taking) => sum + taking.gross_takings, 0) || 0;
      const currentWeekRevenue = actualCurrentWeekTakings?.reduce((sum, taking) => sum + taking.gross_takings, 0) || 0;
      const previousWeekRevenue = previousWeekTakings?.reduce((sum, taking) => sum + taking.gross_takings, 0) || 0;
      const todayRevenue = actualCurrentWeekTakings?.find(t => t.entry_date === todayUTC)?.gross_takings || 0;
  
      console.log('=== CALCULATIONS ===');
      console.log('Current week revenue:', currentWeekRevenue);
      console.log('Previous week revenue:', previousWeekRevenue);
      console.log('Days with data this week:', actualCurrentWeekTakings.length);
  
      // Calculate weekly trend
      const trend = previousWeekRevenue > 0 
        ? ((currentWeekRevenue - previousWeekRevenue) / previousWeekRevenue) * 100 
        : currentWeekRevenue > 0 ? 100 : 0;
  
      // Calculate weekly POS total
      const weeklyPOSTotal = actualCurrentWeekTakings?.reduce((sum, taking) => sum + taking.pos_amount, 0) || 0;
  
      setTakingsData({
        monthlyRevenue,
        weeklyRevenue: currentWeekRevenue,
        todayRevenue,
        weeklyPOSTotal,
        weeklyTrend: trend,
        monthlyTakings: monthlyTakings || [],
        weeklyTakings: actualCurrentWeekTakings,
        previousWeekTakings: previousWeekTakings || [],
        todayTakings: actualCurrentWeekTakings?.find(t => t.entry_date === todayUTC) || null
      });
  
      setWeeklyTrend(trend);
  
    } catch (error) {
      console.error('Error fetching takings data:', error);
      toast({
        title: "Error",
        description: "Failed to load takings data",
        variant: "destructive",
      });
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

  // Format trend text for weekly revenue
  const getWeeklyTrendText = () => {
    if (weeklyTrend === 0) return 'Same as last week';
    const direction = weeklyTrend > 0 ? 'up' : 'down';
    const percentage = Math.abs(weeklyTrend).toFixed(1);
    return `${percentage}% ${direction} from last week`;
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
          change={
            takingsData?.weeklyTakings?.length > 0 
              ? `${takingsData.weeklyTakings.length} day${takingsData.weeklyTakings.length !== 1 ? 's' : ''} recorded` 
              : 'No data this week'
          }
          changeType={
            weeklyTrend > 5 ? "positive" : 
            weeklyTrend < -5 ? "negative" : "neutral"
          }
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
            This Week's Takings Summary (Mon-Sun)
          </CardTitle>
          <CardDescription>
            Showing data from {takingsData?.weeklyTakings?.length || 0} day{takingsData?.weeklyTakings?.length !== 1 ? 's' : ''} recorded this week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TakingsAnalytics compact={true} />
        </CardContent>
      </Card>

      {/* Rest of the component remains the same */}
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