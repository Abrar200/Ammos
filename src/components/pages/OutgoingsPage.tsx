import { useState, useMemo } from 'react';
import { Search, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DateRangePicker } from '@/components/DateRangePicker';
import { exportToCSV, filterByDateRange, type ExportableOutgoing } from '@/utils/exportUtils';

const mockOutgoings: ExportableOutgoing[] = [
  { id: 1, date: '2024-01-15', description: 'Office Supplies', category: 'office', amount: 250, supplier: 'Officeworks' },
  { id: 2, date: '2024-01-14', description: 'Software License', category: 'software', amount: 99, supplier: 'Adobe' },
  { id: 3, date: '2024-01-13', description: 'Cleaning Services', category: 'cleaning', amount: 180, supplier: 'CleanCorp' },
  { id: 4, date: '2024-01-12', description: 'Food Supplies', category: 'food', amount: 450, supplier: 'Food Distributor' },
  { id: 5, date: '2024-01-11', description: 'Electricity Bill', category: 'utilities', amount: 320, supplier: 'AGL' },
  { id: 6, date: '2024-01-10', description: 'Gas Bill', category: 'utilities', amount: 180, supplier: 'Origin Energy' },
  { id: 7, date: '2024-01-09', description: 'Meat Supplies', category: 'food', amount: 680, supplier: 'Premium Meats' },
  { id: 8, date: '2024-01-08', description: 'Seafood Delivery', category: 'food', amount: 520, supplier: 'Ocean Fresh' },
  { id: 9, date: '2024-01-07', description: 'Wine & Spirits', category: 'beverages', amount: 340, supplier: 'Wine Merchants' },
  { id: 10, date: '2024-01-06', description: 'Linen Service', category: 'cleaning', amount: 120, supplier: 'Fresh Linens' },
];

export const OutgoingsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('monthly');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const categories = ['all', 'food', 'beverages', 'cleaning', 'software', 'utilities', 'office'];
  
  const filteredOutgoings = useMemo(() => {
    let filtered = mockOutgoings;

    // Apply date filter
    if (dateRange.from || dateRange.to) {
      filtered = filterByDateRange(filtered, dateRange.from, dateRange.to);
    }

    // Apply search filter
    filtered = filtered.filter(outgoing => {
      const matchesSearch = outgoing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           outgoing.supplier.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || outgoing.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    return filtered;
  }, [searchTerm, selectedCategory, dateRange]);

  // Calculate breakdown by category
  const categoryBreakdown = categories.slice(1).map(category => {
    const categoryOutgoings = filteredOutgoings.filter(outgoing => outgoing.category === category);
    const total = categoryOutgoings.reduce((sum, outgoing) => sum + outgoing.amount, 0);
    return { category, total, count: categoryOutgoings.length };
  }).filter(item => item.total > 0);

  const grandTotal = filteredOutgoings.reduce((sum, outgoing) => sum + outgoing.amount, 0);

  const handleExportCSV = () => {
    exportToCSV(filteredOutgoings, 'outgoings');
  };

  const handleClearDateRange = () => {
    setDateRange({ from: '', to: '' });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      food: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      beverages: 'bg-blue-50 text-blue-700 border-blue-200',
      cleaning: 'bg-purple-50 text-purple-700 border-purple-200',
      software: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      utilities: 'bg-orange-50 text-orange-700 border-orange-200',
      office: 'bg-gray-50 text-gray-700 border-gray-200',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

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
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onClear={handleClearDateRange}
          />
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        {['weekly', 'monthly', 'annually'].map(mode => (
          <Button
            key={mode}
            variant={viewMode === mode ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode(mode)}
            className={viewMode === mode ? "bg-slate-900 hover:bg-slate-800" : "border-gray-300 hover:bg-gray-50"}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </Button>
        ))}
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
              <div className="text-3xl font-bold mb-2 text-white">${grandTotal.toFixed(2)}</div>
              <div className="text-slate-300 text-sm">
                {filteredOutgoings.length} transactions
                {(dateRange.from || dateRange.to) && (
                  <span className="block mt-1">
                    {dateRange.from && dateRange.to 
                      ? `${dateRange.from} - ${dateRange.to}`
                      : dateRange.from 
                        ? `From ${dateRange.from}`
                        : `Until ${dateRange.to}`
                    }
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
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
      </div>

      {/* Outgoings Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900">
            All Outgoings
            {filteredOutgoings.length !== mockOutgoings.length && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({filteredOutgoings.length} of {mockOutgoings.length} shown)
              </span>
            )}
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
                <TableHead className="text-right text-gray-600">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOutgoings.map((outgoing) => (
                <TableRow key={outgoing.id} className="border-gray-100 hover:bg-gray-50/50">
                  <TableCell className="text-gray-900">{outgoing.date}</TableCell>
                  <TableCell className="text-gray-900">{outgoing.description}</TableCell>
                  <TableCell className="text-gray-700">{outgoing.supplier}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`capitalize ${getCategoryColor(outgoing.category)}`}>
                      {outgoing.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium text-gray-900">
                    ${outgoing.amount.toFixed(2)}
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