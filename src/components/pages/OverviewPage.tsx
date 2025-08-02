import { useState, useEffect } from 'react';
import { StatsCard } from '../StatsCard';
import { SupplierList } from '../SupplierList';
import { ExpenseChart } from '../ExpenseChart';
import { WeeklyTargetCard } from '../WeeklyTargetCard';
import { DollarSign, TrendingUp, TrendingDown, Users, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { mockSuppliers, mockExpenseData, mockStats, mockWeeklyData } from '@/data/mockData';
import { useRevenueData } from '@/hooks/useRevenueData';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export const OverviewPage = () => {
  const { data: revenueData, loading, error, lastUpdated, refetch } = useRevenueData(30000); // Update every 30 seconds

  // Calculate profit using live revenue data
  const totalRevenue = revenueData?.monthRevenue || mockStats.totalRevenue;
  const profit = totalRevenue - mockStats.totalExpenses;

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
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert>
          <AlertDescription>
            Unable to connect to Lightspeed POS: {error}. Displaying cached data.
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
          value={`$${mockStats.totalExpenses.toLocaleString('en-AU', { minimumFractionDigits: 2 })}`}
          change="+3% from last month"
          changeType="negative"
          icon={TrendingDown}
        />
        <StatsCard
          title="Net Profit"
          value={`$${profit.toLocaleString('en-AU', { minimumFractionDigits: 2 })}`}
          change="+15% from last month"
          changeType="positive"
          icon={TrendingUp}
          isLive={!error}
        />
      </div>

      {/* Weekly Target - Use live revenue data */}
      <div className="w-full">
        <WeeklyTargetCard
          weeklyTarget={mockWeeklyData.weeklyTarget}
          currentWeekRevenue={revenueData?.weekRevenue || mockWeeklyData.currentWeekRevenue}
          currentWeekExpenses={mockWeeklyData.currentWeekExpenses}
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
        <ExpenseChart data={mockExpenseData} title="Expenses by Category" />
        <ExpenseChart data={revenueChartData} title="Revenue Overview" />
      </div>

      {/* Recent Suppliers */}
      <div>
        <SupplierList suppliers={mockSuppliers.slice(0, 5)} />
      </div>
    </div>
  );
};