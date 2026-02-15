import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/DateRangePicker';
import { ExpenseChart } from '@/components/ExpenseChart';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, TrendingUp, CreditCard, Wallet, DollarSign, Building, 
  Receipt, Users, TrendingDown, FileText, ChevronDown, ChevronUp 
} from 'lucide-react';
import { TakingsSummary } from '@/types/takings';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface TakingsAnalyticsProps {
  onExport?: (data: any) => void;
  compact?: boolean;
}

// Helper to get Monday of current week (Adelaide time aware)
const getMondayOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // Monday = day 1
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

// Helper to get Sunday of current week
const getSundayOfWeek = (date: Date) => {
  const monday = getMondayOfWeek(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
};

// Helper to get previous week
const getPreviousWeek = (date: Date) => {
  const currentMonday = getMondayOfWeek(date);
  const previousMonday = new Date(currentMonday);
  previousMonday.setDate(currentMonday.getDate() - 7);
  
  const previousSunday = new Date(previousMonday);
  previousSunday.setDate(previousMonday.getDate() + 6);
  previousSunday.setHours(23, 59, 59, 999);
  
  return { from: previousMonday, to: previousSunday };
};

const BILL_CATEGORIES = [
  { key: 'bill_seafood', label: 'Seafood', icon: '🐟' },
  { key: 'bill_meat', label: 'Meat', icon: '🥩' },
  { key: 'bill_produce', label: 'Produce', icon: '🥬' },
  { key: 'bill_wine_alcohol', label: 'Wine/Alcohol', icon: '🍷' },
  { key: 'bill_direct_debit', label: 'Direct Debit', icon: '💳' },
  { key: 'bill_dry_goods', label: 'Dry Goods', icon: '📦' },
  { key: 'bill_packaging', label: 'Packaging', icon: '📄' },
  { key: 'bill_utilities', label: 'Utilities', icon: '⚡' },
  { key: 'bill_rent', label: 'Rent', icon: '🏠' },
  { key: 'bill_other', label: 'Other', icon: '📝' },
] as const;

export default function TakingsAnalytics({ onExport, compact = false }: TakingsAnalyticsProps) {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState({
    from: getMondayOfWeek(new Date()),
    to: getSundayOfWeek(new Date())
  });
  const [summary, setSummary] = useState<TakingsSummary>({
    totalGross: 0,
    totalPOS: 0,
    totalEFT: 0,
    totalCash: 0,
    totalPsila: 0
  });
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [paymentSplit, setPaymentSplit] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Weekly costs for profit calculation
  const [weeklyCosts, setWeeklyCosts] = useState<{
    bills: number;
    wages: number;
    gst: number;
    psila: number;
    billBreakdown: Record<string, number>;
  } | null>(null);

  const [billsExpanded, setBillsExpanded] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    if (compact) {
      fetchWeeklyCosts();
    }
  }, [dateRange, compact]);

  const fetchWeeklyCosts = async () => {
    try {
      const weekStartStr = format(getMondayOfWeek(new Date()), 'yyyy-MM-dd');
      const { data } = await supabase
        .from('weekly_costs')
        .select('*')
        .eq('week_start', weekStartStr)
        .maybeSingle();

      if (data) {
        const billBreakdown: Record<string, number> = {};
        let totalBills = 0;

        BILL_CATEGORIES.forEach(({ key, label }) => {
          const amount = data[key] ?? 0;
          billBreakdown[label] = amount;
          totalBills += amount;
        });

        const totalWages =
          (data.wages_gross ?? 0) +
          (data.wages_tax ?? 0) +
          (data.wages_super ?? 0);

        setWeeklyCosts({
          bills: totalBills,
          wages: totalWages,
          gst: data.gst_amount ?? 0,
          psila: data.psila_spent ?? 0,
          billBreakdown,
        });
      } else {
        setWeeklyCosts(null);
      }
    } catch (err) {
      console.error('Error fetching weekly costs:', err);
    }
  };

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

      const summaryData: TakingsSummary = {
        totalGross: 0,
        totalPOS: 0,
        totalEFT: 0,
        totalCash: 0,
        totalPsila: 0
      };

      const daily = data?.map(entry => ({
        name: format(new Date(entry.entry_date), 'MMM dd'),
        amount: entry.gross_takings,
        date: entry.entry_date,
        gross: entry.gross_takings,
        pos: entry.pos_amount,
        eft: entry.eft_amount,
        cash: entry.cash_amount,
        psila: entry.cash_to_bank
      })) || [];

      data?.forEach(entry => {
        summaryData.totalGross += entry.gross_takings;
        summaryData.totalPOS += entry.pos_amount;
        summaryData.totalEFT += entry.eft_amount;
        summaryData.totalCash += entry.cash_amount;
        summaryData.totalPsila += entry.cash_to_bank;
      });

      const total = summaryData.totalGross;
      const split = [
        { name: 'EFT', amount: summaryData.totalEFT, percentage: total > 0 ? (summaryData.totalEFT / total) * 100 : 0 },
        { name: 'Psila', amount: summaryData.totalPsila, percentage: total > 0 ? (summaryData.totalPsila / total) * 100 : 0 }
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
      onExport({ summary, dailyData, paymentSplit, dateRange });
    }
  };

  const quickDateRanges = [
    { 
      label: 'Today', 
      getRange: () => {
        const today = new Date();
        return { from: today, to: today };
      }
    },
    { 
      label: 'Yesterday', 
      getRange: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return { from: yesterday, to: yesterday };
      }
    },
    { 
      label: 'This Week', 
      getRange: () => ({
        from: getMondayOfWeek(new Date()),
        to: getSundayOfWeek(new Date())
      })
    },
    { 
      label: 'Last Week', 
      getRange: () => {
        const lastWeekRange = getPreviousWeek(new Date());
        return { from: lastWeekRange.from, to: lastWeekRange.to };
      }
    },
    { 
      label: 'This Month', 
      getRange: () => ({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date())
      })
    },
  ];

  // COMPACT MODE (Dashboard)
  if (compact) {
    const bills = weeklyCosts?.bills ?? 0;
    const wages = weeklyCosts?.wages ?? 0;
    const gst = weeklyCosts?.gst ?? 0;
    const psilaSpent = weeklyCosts?.psila ?? 0;
    const totalCosts = bills + wages + gst + psilaSpent;
    const profit = summary.totalGross - totalCosts;
    const hasCosts = bills > 0 || wages > 0 || gst > 0 || psilaSpent > 0;

    return (
      <div className="space-y-3">
        {/* Takings Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3">
              <p className="text-xs font-medium text-green-800">Gross Takings</p>
              <p className="text-lg font-bold text-green-600">
                ${summary.totalGross.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-green-600">EFT + Psila</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3">
              <p className="text-xs font-medium text-blue-800">EFT</p>
              <p className="text-lg font-bold text-blue-600">
                ${summary.totalEFT.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-3">
              <p className="text-xs font-medium text-purple-800">Psila</p>
              <p className="text-lg font-bold text-purple-600">
                ${summary.totalPsila.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-purple-600">Cash - $300</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-3">
              <p className="text-xs font-medium text-gray-800">POS</p>
              <p className="text-lg font-bold text-gray-600">
                ${summary.totalPOS.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-600">Expected</p>
            </CardContent>
          </Card>
        </div>

        {/* Cost Breakdown Row */}
        <div className="border-t border-gray-100 pt-2">
          <Collapsible open={billsExpanded} onOpenChange={setBillsExpanded}>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {/* Bills Card with Expandable Breakdown */}
              <CollapsibleTrigger asChild>
                <Card className="bg-orange-50 border-orange-200 cursor-pointer hover:bg-orange-100 transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-orange-500 shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-orange-800">Bills</p>
                          <p className="text-base font-bold text-orange-600">
                            {hasCosts ? `$${bills.toFixed(2)}` : '—'}
                          </p>
                        </div>
                      </div>
                      {hasCosts && bills > 0 && (
                        billsExpanded ? 
                          <ChevronUp className="h-3 w-3 text-orange-600" /> : 
                          <ChevronDown className="h-3 w-3 text-orange-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleTrigger>

              {/* Other Cost Cards */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-blue-800">Wages</p>
                    <p className="text-base font-bold text-blue-600">
                      {hasCosts ? `$${wages.toFixed(2)}` : '—'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-500 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-purple-800">GST</p>
                    <p className="text-base font-bold text-purple-600">
                      {hasCosts ? `$${gst.toFixed(2)}` : '—'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-teal-50 border-teal-200">
                <CardContent className="p-3 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-teal-500 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-teal-800">Psila Spent</p>
                    <p className="text-base font-bold text-teal-600">
                      {hasCosts ? `$${psilaSpent.toFixed(2)}` : '—'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className={`border ${profit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-100 border-red-300'}`}>
                <CardContent className="p-3 flex items-center gap-2">
                  <DollarSign className={`h-4 w-4 shrink-0 ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
                  <div>
                    <p className={`text-xs font-medium ${profit >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>
                      Net Profit
                    </p>
                    <p className={`text-base font-bold ${profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {hasCosts ? `${profit < 0 ? '-' : ''}$${Math.abs(profit).toFixed(2)}` : '—'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bill Category Breakdown */}
            <CollapsibleContent className="mt-3">
              {weeklyCosts?.billBreakdown && (
                <Card className="bg-orange-50/50 border-orange-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-orange-900">
                      Bills Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {Object.entries(weeklyCosts.billBreakdown)
                        .filter(([_, amount]) => amount > 0)
                        .map(([category, amount]) => {
                          const cat = BILL_CATEGORIES.find(c => c.label === category);
                          return (
                            <div key={category} className="bg-white rounded p-2 border border-orange-200">
                              <div className="flex items-center gap-1 mb-1">
                                <span className="text-lg">{cat?.icon}</span>
                                <p className="text-xs font-medium text-gray-700">{category}</p>
                              </div>
                              <p className="text-sm font-bold text-orange-700">
                                ${amount.toFixed(2)}
                              </p>
                            </div>
                          );
                        })}
                    </div>
                    {Object.values(weeklyCosts.billBreakdown).every(v => v === 0) && (
                      <p className="text-sm text-gray-500 text-center py-2">
                        No bills recorded yet
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>

        {!hasCosts && (
          <p className="text-xs text-gray-400 text-center">
            Add bills, wages, GST &amp; Psila on the Takings page to see your weekly profit here
          </p>
        )}
      </div>
    );
  }

  // FULL MODE (Takings Page)
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
            onClear={() => setDateRange({
              from: getMondayOfWeek(new Date()),
              to: getSundayOfWeek(new Date())
            })}
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Takings</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summary.totalGross.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">EFT + Psila</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">EFT Total</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summary.totalEFT.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Westpac terminal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Psila</CardTitle>
            <Building className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summary.totalPsila.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Cash - $300 float</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">POS Total</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summary.totalPOS.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Lightspeed POS</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Gross Takings</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyData.length > 0 ? (
              <div style={{ height: '300px' }}>
                <ExpenseChart data={dailyData} title="" />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                {loading ? 'Loading...' : 'No data available for selected period'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Split</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentSplit.length > 0 ? (
              <div style={{ height: '300px' }}>
                <ExpenseChart data={paymentSplit} title="" />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                {loading ? 'Loading...' : 'No data available for selected period'}
              </div>
            )}
            
            {paymentSplit.length > 0 && (
              <div className="mt-4 space-y-2">
                {paymentSplit.map((item) => (
                  <div key={item.name} className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.name === 'EFT' ? '#3b82f6' : '#8b5cf6' }}
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