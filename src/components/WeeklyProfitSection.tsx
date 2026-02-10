import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  Receipt,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Pencil,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { format, startOfISOWeek, endOfISOWeek } from 'date-fns';

// ─── Types ───────────────────────────────────────────────────────────────────

interface WeeklyCost {
  id: string;
  week_start: string;
  week_end: string;
  bills_amount: number;
  wages_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface WeeklyProfitSectionProps {
  /** Gross takings (EFT + Psila) for the selected week */
  weeklyGross: number;
  /** The Monday date of the currently-displayed week */
  weekStart: Date;
  /** The Sunday date of the currently-displayed week */
  weekEnd: Date;
  /** Optional: called after a save so parent can re-fetch if needed */
  onUpdate?: () => void;
}

// ─── Dialog for entering Bills or Wages ──────────────────────────────────────

interface EntryDialogProps {
  open: boolean;
  mode: 'bills' | 'wages';
  currentValue: number;
  currentNotes: string;
  onClose: () => void;
  onSave: (amount: number, notes: string) => Promise<void>;
}

function EntryDialog({ open, mode, currentValue, currentNotes, onClose, onSave }: EntryDialogProps) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Sync with current values when dialog opens
  useEffect(() => {
    if (open) {
      setAmount(currentValue > 0 ? currentValue.toString() : '');
      setNotes(currentNotes || '');
    }
  }, [open, currentValue, currentNotes]);

  const handleSave = async () => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed < 0) return;
    setSaving(true);
    try {
      await onSave(parsed, notes);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const label = mode === 'bills' ? 'Bills' : 'Wages';
  const Icon = mode === 'bills' ? Receipt : Users;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {currentValue > 0 ? `Edit ${label}` : `Add ${label}`} for the Week
          </DialogTitle>
          <DialogDescription>
            Enter the total {label.toLowerCase()} cost for this week. This will be used to
            calculate your weekly profit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="amount">
              {label} Amount ($)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                $
              </span>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder={`e.g. ${mode === 'bills' ? 'Rent + utilities + food invoices' : 'All staff including casual'}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || amount === '' || isNaN(parseFloat(amount))}
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save {label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WeeklyProfitSection({
  weeklyGross,
  weekStart,
  weekEnd,
  onUpdate,
}: WeeklyProfitSectionProps) {
  const { toast } = useToast();
  const [costRecord, setCostRecord] = useState<WeeklyCost | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'bills' | 'wages'>('bills');

  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

  // ── Fetch existing record for this week ──────────────────────────────────
  const fetchCosts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('weekly_costs')
        .select('*')
        .eq('week_start', weekStartStr)
        .maybeSingle();

      if (error) throw error;
      setCostRecord(data);
    } catch (err) {
      console.error('Error fetching weekly costs:', err);
      toast({
        title: 'Error',
        description: 'Failed to load weekly costs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [weekStartStr]);

  useEffect(() => {
    fetchCosts();
  }, [fetchCosts]);

  // ── Upsert handler (called by both Bills and Wages dialogs) ──────────────
  const handleSave = async (field: 'bills_amount' | 'wages_amount', amount: number, notes: string) => {
    try {
      if (costRecord) {
        // Update existing record
        const updatePayload: any = { [field]: amount };
        // Merge notes: only overwrite if the user typed something
        if (notes.trim()) updatePayload.notes = notes;

        const { data, error } = await supabase
          .from('weekly_costs')
          .update(updatePayload)
          .eq('id', costRecord.id)
          .select()
          .single();

        if (error) throw error;
        setCostRecord(data);
      } else {
        // Insert new record
        const insertPayload: any = {
          week_start: weekStartStr,
          week_end: weekEndStr,
          bills_amount: field === 'bills_amount' ? amount : 0,
          wages_amount: field === 'wages_amount' ? amount : 0,
          notes: notes.trim() || null,
        };

        const { data, error } = await supabase
          .from('weekly_costs')
          .insert(insertPayload)
          .select()
          .single();

        if (error) throw error;
        setCostRecord(data);
      }

      toast({
        title: 'Saved',
        description: `Weekly ${field === 'bills_amount' ? 'bills' : 'wages'} updated successfully.`,
      });

      onUpdate?.();
    } catch (err: any) {
      console.error('Error saving weekly costs:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to save weekly costs',
        variant: 'destructive',
      });
      throw err; // re-throw so dialog stays open
    }
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const bills = costRecord?.bills_amount ?? 0;
  const wages = costRecord?.wages_amount ?? 0;
  const totalCosts = bills + wages;
  const profit = weeklyGross - totalCosts;
  const profitMargin = weeklyGross > 0 ? (profit / weeklyGross) * 100 : 0;
  const isProfitable = profit >= 0;

  const weekLabel = `${format(weekStart, 'dd MMM')} – ${format(weekEnd, 'dd MMM yyyy')}`;

  // ── Open dialog helpers ──────────────────────────────────────────────────
  const openBillsDialog = () => { setDialogMode('bills'); setDialogOpen(true); };
  const openWagesDialog = () => { setDialogMode('wages'); setDialogOpen(true); };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Weekly Profit Breakdown
              </CardTitle>
              <CardDescription>{weekLabel}</CardDescription>
            </div>
            <Badge
              variant={isProfitable ? 'default' : 'destructive'}
              className="w-fit flex items-center gap-1 text-sm px-3 py-1"
            >
              {isProfitable ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {isProfitable ? 'Profitable Week' : 'Loss Making Week'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading weekly costs…
            </div>
          ) : (
            <div className="space-y-4">
              {/* ── Cost Entry Row ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Bills */}
                <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-100 p-2 rounded-full">
                      <Receipt className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-orange-900">Bills for the Week</p>
                      <p className="text-xl font-bold text-orange-700">
                        ${bills.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                      </p>
                      {costRecord?.notes && bills > 0 && (
                        <p className="text-xs text-orange-600 mt-0.5 max-w-[160px] truncate">
                          {costRecord.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openBillsDialog}
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    {bills > 0 ? 'Edit' : 'Add'}
                  </Button>
                </div>

                {/* Wages */}
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">Wages for the Week</p>
                      <p className="text-xl font-bold text-blue-700">
                        ${wages.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openWagesDialog}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    {wages > 0 ? 'Edit' : 'Add'}
                  </Button>
                </div>
              </div>

              {/* ── Summary Row ── */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Gross Turnover */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <p className="text-xs font-medium text-green-700 uppercase tracking-wide">
                      Gross Turnover
                    </p>
                    <p className="text-2xl font-bold text-green-800">
                      ${weeklyGross.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-green-600 mt-0.5">EFT + Psila</p>
                  </div>

                  {/* Total Costs */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <TrendingDown className="h-5 w-5 text-red-500 mx-auto mb-1" />
                    <p className="text-xs font-medium text-red-700 uppercase tracking-wide">
                      Total Costs
                    </p>
                    <p className="text-2xl font-bold text-red-700">
                      ${totalCosts.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-red-500 mt-0.5">
                      Bills + Wages
                    </p>
                  </div>

                  {/* Net Profit */}
                  <div
                    className={`rounded-lg p-4 text-center border ${
                      isProfitable
                        ? 'bg-emerald-50 border-emerald-300'
                        : 'bg-red-100 border-red-400'
                    }`}
                  >
                    <DollarSign
                      className={`h-5 w-5 mx-auto mb-1 ${
                        isProfitable ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    />
                    <p
                      className={`text-xs font-medium uppercase tracking-wide ${
                        isProfitable ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      Net Profit
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        isProfitable ? 'text-emerald-800' : 'text-red-800'
                      }`}
                    >
                      {isProfitable ? '' : '-'}$
                      {Math.abs(profit).toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                    </p>
                    {weeklyGross > 0 && (
                      <p
                        className={`text-xs mt-0.5 ${
                          isProfitable ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {Math.abs(profitMargin).toFixed(1)}% margin
                      </p>
                    )}
                  </div>
                </div>

                {/* Hint when no data entered yet */}
                {bills === 0 && wages === 0 && (
                  <p className="text-center text-sm text-gray-400 mt-3">
                    👆 Add bills and wages above to calculate your weekly profit
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Entry Dialogs ── */}
      <EntryDialog
        open={dialogOpen && dialogMode === 'bills'}
        mode="bills"
        currentValue={bills}
        currentNotes={costRecord?.notes ?? ''}
        onClose={() => setDialogOpen(false)}
        onSave={async (amount, notes) => handleSave('bills_amount', amount, notes)}
      />
      <EntryDialog
        open={dialogOpen && dialogMode === 'wages'}
        mode="wages"
        currentValue={wages}
        currentNotes={''}
        onClose={() => setDialogOpen(false)}
        onSave={async (amount, notes) => handleSave('wages_amount', amount, notes)}
      />
    </>
  );
}