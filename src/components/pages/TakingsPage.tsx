import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import TakingsEntryDialog from '@/components/TakingsEntryDialog';
import TakingsAnalytics from '@/components/TakingsAnalytics';
import WeeklyProfitSection from '@/components/WeeklyProfitSection';
import { Plus, Search, Download, Edit, Calendar, Calculator } from 'lucide-react';
import { Taking } from '@/types/takings';
import { format, startOfISOWeek, endOfISOWeek } from 'date-fns';

// Returns Monday of the current week (ISO: week starts Monday)
const getMondayOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Returns Sunday of the current week
const getSundayOfWeek = (date: Date): Date => {
  const monday = getMondayOfWeek(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
};

export default function TakingsPage() {
  const { toast } = useToast();
  const [takings, setTakings] = useState<Taking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTaking, setEditingTaking] = useState<Taking | null>(null);

  // Weekly gross for profit section — derived from this week's takings
  const [weeklyGross, setWeeklyGross] = useState(0);
  const weekStart = getMondayOfWeek(new Date());
  const weekEnd = getSundayOfWeek(new Date());

  useEffect(() => {
    fetchTakings();
  }, []);

  const fetchTakings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('takings')
        .select('*')
        .order('entry_date', { ascending: false });

      if (error) throw error;

      const allTakings = data || [];
      setTakings(allTakings);

      // Compute this week's gross for the profit section
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
      const thisWeekGross = allTakings
        .filter((t) => t.entry_date >= weekStartStr && t.entry_date <= weekEndStr)
        .reduce((sum, t) => sum + (t.gross_takings || 0), 0);
      setWeeklyGross(thisWeekGross);
    } catch (error) {
      console.error('Error fetching takings:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch takings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (taking: Taking) => {
    setEditingTaking(taking);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingTaking(null);
  };

  const handleExport = () => {
    const headers = ['Date', 'POS', 'EFT', 'Cash', 'Gross Takings', 'Cash to Bank', 'Notes'];
    const csvData = takings.map((taking) => [
      taking.entry_date,
      (taking.pos_amount || 0).toFixed(2),
      (taking.eft_amount || 0).toFixed(2),
      (taking.cash_amount || 0).toFixed(2),
      (taking.gross_takings || 0).toFixed(2),
      (taking.cash_to_bank || 0).toFixed(2),
      taking.notes || '',
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `takings-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({ title: 'Success', description: 'Takings exported to CSV' });
  };

  const filteredTakings = takings.filter(
    (taking) =>
      taking.entry_date.toLowerCase().includes(searchTerm.toLowerCase()) ||
      taking.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-6">Loading takings...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Daily Takings</h1>
          <p className="text-gray-600">Manual entry of daily revenue and cash management</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Takings
          </Button>
        </div>
      </div>

      {/* ── Analytics Section (date-range picker, charts, summary cards) ── */}
      <TakingsAnalytics onExport={handleExport} />

      {/* ── Weekly Profit Breakdown ── */}
      <WeeklyProfitSection
        weeklyGross={weeklyGross}
        weekStart={weekStart}
        weekEnd={weekEnd}
        onUpdate={fetchTakings}
      />

      {/* ── Takings History Table ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Takings History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by date or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>POS</TableHead>
                  <TableHead>EFT</TableHead>
                  <TableHead>Cash</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Psila</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTakings.map((taking) => (
                  <TableRow key={taking.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {format(new Date(taking.entry_date), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>${(taking.pos_amount || 0).toFixed(2)}</TableCell>
                    <TableCell>${(taking.eft_amount || 0).toFixed(2)}</TableCell>
                    <TableCell>${(taking.cash_amount || 0).toFixed(2)}</TableCell>
                    <TableCell className="font-semibold">
                      ${(taking.gross_takings || 0).toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={taking.cash_to_bank >= 0 ? 'text-green-600' : 'text-red-600'}
                    >
                      ${(taking.cash_to_bank || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          taking.cash_amount < 300
                            ? 'destructive'
                            : taking.gross_takings >= taking.pos_amount
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {taking.cash_amount < 300
                          ? 'Low Cash'
                          : taking.gross_takings >= taking.pos_amount
                          ? 'Good'
                          : 'Check'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{taking.notes || '-'}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(taking)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredTakings.length === 0 && (
            <div className="text-center py-12">
              <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No takings found</h3>
              <p className="text-gray-500 mt-2">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Get started by adding your first takings entry'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsDialogOpen(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Takings
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Entry Dialog ── */}
      <TakingsEntryDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        editingTaking={editingTaking}
        onSuccess={() => {
          fetchTakings();
          handleDialogClose();
        }}
      />
    </div>
  );
}