import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/DateRangePicker';
import { ExpenseChart } from '@/components/ExpenseChart';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Download, TrendingUp, CreditCard, Wallet, DollarSign, Building } from 'lucide-react'; // Replaced Bank with Building
import { TakingsSummary } from '@/types/takings';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

interface TakingsAnalyticsProps {
  onExport?: (data: any) => void;
  compact?: boolean; // Add compact mode for Overview page
}

export default function TakingsAnalytics({ onExport, compact = false }: TakingsAnalyticsProps) {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState({
    from: startOfWeek(new Date()),
    to: endOfWeek(new Date())
  });
  const [summary, setSummary] = useState<TakingsSummary>({
    totalGross: 0,
    totalPOS: 0,
    totalEFT: 0,
    totalCash: 0,
    totalCashToBank: 0
  });
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [paymentSplit, setPaymentSplit] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('takings')
        .select('*')
        .gte('entry_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('entry_date', format(dateRange.to, 'yyyy-MM-dd'))
        .order('entry_date', { ascending: true });

      if (error) throw error;

      // Calculate summary
      const summaryData: TakingsSummary = {
        totalGross: 0,
        totalPOS: 0,
        totalEFT: 0,
        totalCash: 0,
        totalCashToBank: 0
      };

      const daily = data?.map(entry => ({
        name: format(new Date(entry.entry_date), 'MMM dd'),
        amount: entry.gross_takings,
        date: entry.entry_date,
        gross: entry.gross_takings,
        pos: entry.pos_amount,
        eft: entry.eft_amount,
        cash: entry.cash_amount
      })) || [];

      data?.forEach(entry => {
        summaryData.totalGross += entry.gross_takings;
        summaryData.totalPOS += entry.pos_amount;
        summaryData.totalEFT += entry.eft_amount;
        summaryData.totalCash += entry.cash_amount;
        summaryData.totalCashToBank += (entry.cash_amount - 300);
      });

      // Calculate payment split
      const total = summaryData.totalGross;
      const split = [
        { name: 'POS', amount: summaryData.totalPOS, percentage: total > 0 ? (summaryData.totalPOS / total) * 100 : 0 },
        { name: 'EFT', amount: summaryData.totalEFT, percentage: total > 0 ? (summaryData.totalEFT / total) * 100 : 0 },
        { name: 'Cash', amount: summaryData.totalCash, percentage: total > 0 ? (summaryData.totalCash / total) * 100 : 0 }
      ].filter(item => item.amount > 0);

      setSummary(summaryData);
      setDailyData(daily);
      setPaymentSplit(split);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (onExport) {
      onExport({
        summary,
        dailyData,
        paymentSplit,
        dateRange
      });
    }
  };

  const quickDateRanges = [
    { label: 'Today', getRange: () => ({ from: new Date(), to: new Date() }) },
    { label: 'Yesterday', getRange: () => ({ from: subDays(new Date(), 1), to: subDays(new Date(), 1) }) },
    { label: 'This Week', getRange: () => ({ from: startOfWeek(new Date()), to: endOfWeek(new Date()) }) },
    { label: 'This Month', getRange: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  ];

  // If compact mode, show only summary cards
  if (compact) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3">
              <p className="text-xs font-medium text-green-800">Gross Takings</p>
              <p className="text-lg font-bold text-green-600">${summary.totalGross.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3">
              <p className="text-xs font-medium text-blue-800">POS</p>
              <p className="text-lg font-bold text-blue-600">${summary.totalPOS.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3">
              <p className="text-xs font-medium text-green-800">EFT</p>
              <p className="text-lg font-bold text-green-600">${summary.totalEFT.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-3">
              <p className="text-xs font-medium text-yellow-800">Cash</p>
              <p className="text-lg font-bold text-yellow-600">${summary.totalCash.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-3">
              <p className="text-xs font-medium text-purple-800">To Bank</p>
              <p className="text-lg font-bold text-purple-600">${summary.totalCashToBank.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range Picker */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Takings Analytics</h2>
          <p className="text-gray-600">Summary and insights from daily takings</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Quick Date Range Buttons */}
          <div className="flex flex-wrap gap-2">
            {quickDateRanges.map((range) => (
              <Button
                key={range.label}
                variant="outline"
                size="sm"
                onClick={() => setDateRange(range.getRange())}
                className="text-xs"
              >
                {range.label}
              </Button>
            ))}
          </div>
          
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onClear={() => setDateRange({ from: null, to: null })}
            className="w-full sm:w-auto"
          />

          
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Takings</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.totalGross.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">POS Total</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.totalPOS.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Lightspeed POS</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">EFT Total</CardTitle>
            <CreditCard className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.totalEFT.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Westpac terminal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Total</CardTitle>
            <Wallet className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.totalCash.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Physical cash</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash to Bank</CardTitle>
            <Building className="h-4 w-4 text-purple-600" /> {/* Changed from Bank to Building */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.totalCashToBank.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">After float</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Takings Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Gross Takings</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyData.length > 0 ? (
              <div style={{ height: '300px' }}>
                <ExpenseChart 
                  data={dailyData} 
                  title=""
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                {loading ? 'Loading...' : 'No data available for selected period'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Method Split */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method Split</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentSplit.length > 0 ? (
              <div style={{ height: '300px' }}>
                <ExpenseChart 
                  data={paymentSplit} 
                  title=""
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                {loading ? 'Loading...' : 'No data available for selected period'}
              </div>
            )}
            
            {/* Split Details */}
            {paymentSplit.length > 0 && (
              <div className="mt-4 space-y-2">
                {paymentSplit.map((item, index) => (
                  <div key={item.name} className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ 
                          backgroundColor: index === 0 ? '#3b82f6' : index === 1 ? '#10b981' : '#f59e0b' 
                        }}
                      />
                      {item.name}
                    </span>
                    <span className="font-medium">
                      ${item.amount.toFixed(2)} ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}