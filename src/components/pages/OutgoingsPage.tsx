import { useState, useEffect, useMemo } from 'react';
import { Search, Download, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DateRangePicker } from '@/components/DateRangePicker';
import { exportToCSV } from '@/utils/exportUtils';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Outgoing, OutgoingSummary } from '@/types/outgoing';
import { DateRange } from '@/components/DateRangePicker';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export const OutgoingsPage = () => {
  const [outgoings, setOutgoings] = useState<Outgoing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: new Date()
  });
  const { toast } = useToast();

  const categories = ['all', 'food', 'beverages', 'cleaning', 'software', 'utilities', 'office', 'staff', 'equipment'];
  const types = ['all', 'supplier', 'subscription', 'payroll', 'other'];

  useEffect(() => {
    fetchAllOutgoings();
  }, []);

  const fetchAllOutgoings = async () => {
    try {
      setLoading(true);
      
      // Fetch data from all sources
      const [
        { data: suppliers },
        { data: subscriptions },
        { data: payrollRecords },
        { data: expenses }
      ] = await Promise.all([
        supabase
          .from('suppliers')
          .select('id, name, supplier_type, monthly_total, payment_frequency, created_at'),
        
        supabase
          .from('subscriptions')
          .select('id, name, category, cost, billing_cycle, status, created_at'),
        
        supabase
          .from('payroll_records')
          .select('id, staff_id, pay_period_start, gross_pay, superannuation, created_at'),
        
        supabase
          .from('expenses')
          .select('id, supplier_name, invoice_date, total_amount, category, subcategory, description, created_at')
      ]);

      const allOutgoings: Outgoing[] = [];

      // Process suppliers
      suppliers?.forEach(supplier => {
        const category = mapSupplierTypeToCategory(supplier.supplier_type);
        allOutgoings.push({
          id: `supplier_${supplier.id}`,
          date: supplier.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          description: supplier.name,
          category,
          amount: supplier.monthly_total || 0,
          supplier: supplier.name,
          type: 'supplier',
          payment_frequency: supplier.payment_frequency
        });
      });

      // Process subscriptions
      subscriptions?.forEach(subscription => {
        if (subscription.status === 'active') {
          const monthlyCost = calculateMonthlyCost(
            parseFloat(subscription.cost) || 0,
            subscription.billing_cycle
          );
          
          allOutgoings.push({
            id: `subscription_${subscription.id}`,
            date: subscription.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            description: subscription.name,
            category: mapSubscriptionCategory(subscription.category),
            amount: monthlyCost,
            supplier: subscription.name,
            type: 'subscription',
            payment_frequency: subscription.billing_cycle
          });
        }
      });

      // Process payroll records (current month only)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      payrollRecords?.forEach(payroll => {
        const payrollDate = new Date(payroll.pay_period_start);
        if (payrollDate.getMonth() === currentMonth && payrollDate.getFullYear() === currentYear) {
          const grossPay = parseFloat(payroll.gross_pay) || 0;
          const superannuation = parseFloat(payroll.superannuation) || 0;
          const total = grossPay + superannuation;
          
          allOutgoings.push({
            id: `payroll_${payroll.id}`,
            date: payroll.pay_period_start,
            description: 'Staff Wages & Super',
            category: 'staff',
            amount: total,
            type: 'payroll',
            notes: `Pay period: ${payroll.pay_period_start}`
          });
        }
      });

      // Process other expenses
      expenses?.forEach(expense => {
        allOutgoings.push({
          id: `expense_${expense.id}`,
          date: expense.invoice_date,
          description: expense.description || `Expense from ${expense.supplier_name}`,
          category: expense.category || 'other',
          amount: parseFloat(expense.total_amount) || 0,
          supplier: expense.supplier_name,
          type: 'other',
          notes: expense.subcategory ? `Subcategory: ${expense.subcategory}` : undefined
        });
      });

      setOutgoings(allOutgoings);
    } catch (error) {
      console.error('Error fetching outgoings:', error);
      toast({
        title: "Error",
        description: "Failed to load outgoings data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const mapSupplierTypeToCategory = (supplierType: string): string => {
    const mapping: Record<string, string> = {
      'Food & Beverage': 'food',
      'Beverages': 'beverages',
      'Cleaning': 'cleaning',
      'Equipment': 'equipment',
      'Software': 'software',
      'Utilities': 'utilities'
    };
    return mapping[supplierType] || 'other';
  };

  const mapSubscriptionCategory = (category: string): string => {
    const mapping: Record<string, string> = {
      'Software': 'software',
      'POS': 'software',
      'Accounting': 'software',
      'Marketing': 'software',
      'Utilities': 'utilities'
    };
    return mapping[category] || 'software';
  };

  const calculateMonthlyCost = (cost: number, billingCycle: string): number => {
    switch (billingCycle?.toLowerCase()) {
      case 'monthly':
        return cost;
      case 'weekly':
        return cost * 4.33;
      case 'yearly':
      case 'annual':
        return cost / 12;
      case 'quarterly':
        return cost / 3;
      default:
        return cost;
    }
  };

  const filteredOutgoings = useMemo(() => {
    let filtered = outgoings;

    // Apply date filter
    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter(outgoing => {
        const outgoingDate = new Date(outgoing.date);
        return outgoingDate >= dateRange.from && outgoingDate <= dateRange.to;
      });
    }

    // Apply search filter
    filtered = filtered.filter(outgoing => {
      const matchesSearch = outgoing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (outgoing.supplier && outgoing.supplier.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || outgoing.category === selectedCategory;
      const matchesType = selectedType === 'all' || outgoing.type === selectedType;
      return matchesSearch && matchesCategory && matchesType;
    });

    return filtered;
  }, [outgoings, searchTerm, selectedCategory, selectedType, dateRange]);

  // Calculate summary
  const summary: OutgoingSummary = useMemo(() => {
    const byCategory: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let total = 0;
    let count = 0;

    filteredOutgoings.forEach(outgoing => {
      total += outgoing.amount;
      count++;

      // Category breakdown
      byCategory[outgoing.category] = (byCategory[outgoing.category] || 0) + outgoing.amount;
      
      // Type breakdown
      byType[outgoing.type] = (byType[outgoing.type] || 0) + outgoing.amount;
    });

    return { total, count, byCategory, byType };
  }, [filteredOutgoings]);

  const categoryBreakdown = Object.entries(summary.byCategory)
    .map(([category, total]) => ({
      category,
      total,
      count: filteredOutgoings.filter(o => o.category === category).length
    }))
    .sort((a, b) => b.total - a.total);

  const handleExportCSV = () => {
    const exportData = filteredOutgoings.map(outgoing => ({
      Date: outgoing.date,
      Description: outgoing.description,
      Supplier: outgoing.supplier || '',
      Category: outgoing.category,
      Type: outgoing.type,
      Amount: outgoing.amount,
      'Payment Frequency': outgoing.payment_frequency || '',
      Notes: outgoing.notes || ''
    }));
    
    exportToCSV(exportData, 'outgoings');
    toast({
      title: "Success",
      description: "Outgoings exported to CSV",
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      food: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      beverages: 'bg-blue-50 text-blue-700 border-blue-200',
      cleaning: 'bg-purple-50 text-purple-700 border-purple-200',
      software: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      utilities: 'bg-orange-50 text-orange-700 border-orange-200',
      office: 'bg-gray-50 text-gray-700 border-gray-200',
      staff: 'bg-red-50 text-red-700 border-red-200',
      equipment: 'bg-amber-50 text-amber-700 border-amber-200',
      other: 'bg-slate-50 text-slate-700 border-slate-200'
    };
    return colors[category] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      supplier: 'bg-green-50 text-green-700 border-green-200',
      subscription: 'bg-blue-50 text-blue-700 border-blue-200',
      payroll: 'bg-red-50 text-red-700 border-red-200',
      other: 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colors[type] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Outgoings</h1>
          <Button variant="outline" disabled>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Outgoings</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="border-gray-300 hover:bg-gray-50"
            onClick={handleExportCSV}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            onClick={fetchAllOutgoings}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onClear={() => setDateRange({
              from: startOfMonth(new Date()),
              to: new Date()
            })}
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-gray-900">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryBreakdown.map(({ category, total, count }) => (
                <div key={category} className="flex justify-between items-center py-3 px-4 rounded-lg bg-gray-50/50 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`capitalize ${getCategoryColor(category)}`}>
                      {category}
                    </Badge>
                    <span className="text-sm text-gray-500">({count} items)</span>
                  </div>
                  <span className="font-semibold text-gray-900">${total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-white">Total Outgoings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2 text-white">${summary.total.toFixed(2)}</div>
              <div className="text-slate-300 text-sm mb-4">
                {summary.count} transactions
              </div>
              
              {/* Type Breakdown */}
              <div className="space-y-2 text-left">
                {Object.entries(summary.byType).map(([type, amount]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="capitalize text-slate-300">{type}</span>
                    <span className="text-white font-medium">${amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search outgoings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-gray-300 focus:border-slate-400 focus:ring-slate-400"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-2">
            <span className="text-sm text-gray-600 font-medium py-2">Category:</span>
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category 
                  ? "bg-slate-900 hover:bg-slate-800" 
                  : "border-gray-300 hover:bg-gray-50 text-gray-700"
                }
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>
          
          <div className="flex gap-2">
            <span className="text-sm text-gray-600 font-medium py-2">Type:</span>
            {types.map(type => (
              <Button
                key={type}
                variant={selectedType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(type)}
                className={selectedType === type 
                  ? "bg-blue-600 hover:bg-blue-700" 
                  : "border-gray-300 hover:bg-gray-50 text-gray-700"
                }
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Outgoings Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900">
            All Outgoings
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({filteredOutgoings.length} transactions)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-gray-600">Date</TableHead>
                <TableHead className="text-gray-600">Description</TableHead>
                <TableHead className="text-gray-600">Supplier</TableHead>
                <TableHead className="text-gray-600">Category</TableHead>
                <TableHead className="text-gray-600">Type</TableHead>
                <TableHead className="text-right text-gray-600">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOutgoings.map((outgoing) => (
                <TableRow key={outgoing.id} className="border-gray-100 hover:bg-gray-50/50">
                  <TableCell className="text-gray-900">
                    {format(new Date(outgoing.date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-gray-900">
                    <div>
                      {outgoing.description}
                      {outgoing.notes && (
                        <div className="text-xs text-gray-500 mt-1">{outgoing.notes}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-700">{outgoing.supplier || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`capitalize ${getCategoryColor(outgoing.category)}`}>
                      {outgoing.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`capitalize ${getTypeColor(outgoing.type)}`}>
                      {outgoing.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium text-gray-900">
                    ${outgoing.amount.toFixed(2)}
                    {outgoing.payment_frequency && (
                      <div className="text-xs text-gray-500">
                        {outgoing.payment_frequency}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredOutgoings.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No outgoings found matching your filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};