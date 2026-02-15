import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  FileText,
  Wallet,
  Building,
} from 'lucide-react';
import { format } from 'date-fns';

// ─── Types ───────────────────────────────────────────────────────────────────

interface WeeklyCost {
  id: string;
  week_start: string;
  week_end: string;
  // Bills
  bill_seafood: number;
  bill_meat: number;
  bill_produce: number;
  bill_wine_alcohol: number;
  bill_direct_debit: number;
  bill_dry_goods: number;
  bill_packaging: number;
  bill_utilities: number;
  bill_rent: number;
  bill_other: number;
  // Wages
  wages_gross: number;
  wages_tax: number;
  wages_super: number;
  // GST
  gst_amount: number;
  // Psila
  psila_spent: number;
  psila_notes: string | null;
  // General
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface WeeklyProfitSectionProps {
  weeklyGross: number;
  weekStart: Date;
  weekEnd: Date;
  onUpdate?: () => void;
}

// ─── Bill Categories Definition ──────────────────────────────────────────────

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

type BillCategoryKey = typeof BILL_CATEGORIES[number]['key'];

// ─── Bills Dialog ────────────────────────────────────────────────────────────

interface BillsDialogProps {
  open: boolean;
  currentValues: Record<BillCategoryKey, number>;
  onClose: () => void;
  onSave: (bills: Record<BillCategoryKey, number>) => Promise<void>;
}

function BillsDialog({ open, currentValues, onClose, onSave }: BillsDialogProps) {
  const [bills, setBills] = useState<Record<BillCategoryKey, string>>({} as any);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const initialBills: any = {};
      BILL_CATEGORIES.forEach(({ key }) => {
        initialBills[key] = currentValues[key] > 0 ? currentValues[key].toString() : '';
      });
      setBills(initialBills);
    }
  }, [open, currentValues]);

  const handleSave = async () => {
    const parsed: any = {};
    let hasError = false;

    BILL_CATEGORIES.forEach(({ key }) => {
      const val = bills[key]?.trim();
      if (val === '') {
        parsed[key] = 0;
      } else {
        const num = parseFloat(val);
        if (isNaN(num) || num < 0) {
          hasError = true;
        } else {
          parsed[key] = num;
        }
      }
    });

    if (hasError) return;

    setSaving(true);
    try {
      await onSave(parsed);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const total = Object.keys(bills).reduce((sum, key) => {
    const val = parseFloat(bills[key as BillCategoryKey]) || 0;
    return sum + val;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Bills for the Week
          </DialogTitle>
          <DialogDescription>
            Break down your weekly bills by category. Leave blank or enter 0 for categories you didn't spend on.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {BILL_CATEGORIES.map(({ key, label, icon }) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-2xl w-8 text-center">{icon}</span>
              <div className="flex-1">
                <Label htmlFor={key} className="text-sm">
                  {label}
                </Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    $
                  </span>
                  <Input
                    id={key}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={bills[key] || ''}
                    onChange={(e) => setBills({ ...bills, [key]: e.target.value })}
                    className="pl-7"
                  />
                </div>
              </div>
            </div>
          ))}

          <Separator className="my-4" />

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-blue-900">Total Bills</span>
              <span className="text-xl font-bold text-blue-700">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Bills
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Wages Dialog ────────────────────────────────────────────────────────────

interface WagesDialogProps {
  open: boolean;
  currentGross: number;
  currentTax: number;
  currentSuper: number;
  onClose: () => void;
  onSave: (gross: number, tax: number, superAmount: number) => Promise<void>;
}

function WagesDialog({ open, currentGross, currentTax, currentSuper, onClose, onSave }: WagesDialogProps) {
  const [gross, setGross] = useState('');
  const [tax, setTax] = useState('');
  const [superAmount, setSuperAmount] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setGross(currentGross > 0 ? currentGross.toString() : '');
      setTax(currentTax > 0 ? currentTax.toString() : '');
      setSuperAmount(currentSuper > 0 ? currentSuper.toString() : '');
    }
  }, [open, currentGross, currentTax, currentSuper]);

  const handleSave = async () => {
    const g = parseFloat(gross) || 0;
    const t = parseFloat(tax) || 0;
    const s = parseFloat(superAmount) || 0;

    if (g < 0 || t < 0 || s < 0) return;

    setSaving(true);
    try {
      await onSave(g, t, s);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const totalCost = (parseFloat(gross) || 0) + (parseFloat(tax) || 0) + (parseFloat(superAmount) || 0);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Wages for the Week
          </DialogTitle>
          <DialogDescription>
            Enter gross wages, tax withheld, and superannuation for this week.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="gross">Gross Wages ($)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                $
              </span>
              <Input
                id="gross"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={gross}
                onChange={(e) => setGross(e.target.value)}
                className="pl-7"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tax">Tax Withheld ($)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                $
              </span>
              <Input
                id="tax"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="super">Superannuation ($)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                $
              </span>
              <Input
                id="super"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={superAmount}
                onChange={(e) => setSuperAmount(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>

          <Separator />

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-blue-900">Total Wages Cost</span>
              <span className="text-xl font-bold text-blue-700">
                ${totalCost.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Wages
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── GST Dialog ──────────────────────────────────────────────────────────────

interface GSTDialogProps {
  open: boolean;
  currentGST: number;
  onClose: () => void;
  onSave: (gst: number) => Promise<void>;
}

function GSTDialog({ open, currentGST, onClose, onSave }: GSTDialogProps) {
  const [gst, setGST] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setGST(currentGST > 0 ? currentGST.toString() : '');
    }
  }, [open, currentGST]);

  const handleSave = async () => {
    const amount = parseFloat(gst) || 0;
    if (amount < 0) return;

    setSaving(true);
    try {
      await onSave(amount);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            GST Set Aside
          </DialogTitle>
          <DialogDescription>
            Enter the amount you're setting aside for GST this week.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="gst">GST Amount ($)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                $
              </span>
              <Input
                id="gst"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={gst}
                onChange={(e) => setGST(e.target.value)}
                className="pl-7"
                autoFocus
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save GST
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Psila Dialog ────────────────────────────────────────────────────────────

interface PsilaDialogProps {
  open: boolean;
  currentSpent: number;
  currentNotes: string;
  onClose: () => void;
  onSave: (spent: number, notes: string) => Promise<void>;
}

function PsilaDialog({ open, currentSpent, currentNotes, onClose, onSave }: PsilaDialogProps) {
  const [spent, setSpent] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSpent(currentSpent > 0 ? currentSpent.toString() : '');
      setNotes(currentNotes || '');
    }
  }, [open, currentSpent, currentNotes]);

  const handleSave = async () => {
    const amount = parseFloat(spent) || 0;
    if (amount < 0) return;

    setSaving(true);
    try {
      await onSave(amount, notes);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Psila Spending
          </DialogTitle>
          <DialogDescription>
            Document what you spent the Psila on for this week.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="psila-spent">Amount Spent ($)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                $
              </span>
              <Input
                id="psila-spent"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={spent}
                onChange={(e) => setSpent(e.target.value)}
                className="pl-7"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="psila-notes">What did you spend it on?</Label>
            <Textarea
              id="psila-notes"
              placeholder="e.g. Petty cash for supplies, staff tips, etc."
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
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Psila
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
  const [billsDialogOpen, setBillsDialogOpen] = useState(false);
  const [wagesDialogOpen, setWagesDialogOpen] = useState(false);
  const [gstDialogOpen, setGSTDialogOpen] = useState(false);
  const [psilaDialogOpen, setPsilaDialogOpen] = useState(false);

  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

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
  }, [weekStartStr, toast]);

  useEffect(() => {
    fetchCosts();
  }, [fetchCosts]);

  // ── Save handlers ────────────────────────────────────────────────────────

  const handleSaveBills = async (bills: Record<BillCategoryKey, number>) => {
    try {
      if (costRecord) {
        const { data, error } = await supabase
          .from('weekly_costs')
          .update(bills)
          .eq('id', costRecord.id)
          .select()
          .single();

        if (error) throw error;
        setCostRecord(data);
      } else {
        const insertPayload: any = {
          week_start: weekStartStr,
          week_end: weekEndStr,
          ...bills,
        };

        const { data, error } = await supabase
          .from('weekly_costs')
          .insert(insertPayload)
          .select()
          .single();

        if (error) throw error;
        setCostRecord(data);
      }

      toast({ title: 'Saved', description: 'Bills breakdown updated successfully.' });
      onUpdate?.();
    } catch (err: any) {
      console.error('Error saving bills:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to save bills',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const handleSaveWages = async (gross: number, tax: number, superAmount: number) => {
    try {
      const payload = {
        wages_gross: gross,
        wages_tax: tax,
        wages_super: superAmount,
      };

      if (costRecord) {
        const { data, error } = await supabase
          .from('weekly_costs')
          .update(payload)
          .eq('id', costRecord.id)
          .select()
          .single();

        if (error) throw error;
        setCostRecord(data);
      } else {
        const insertPayload: any = {
          week_start: weekStartStr,
          week_end: weekEndStr,
          ...payload,
        };

        const { data, error } = await supabase
          .from('weekly_costs')
          .insert(insertPayload)
          .select()
          .single();

        if (error) throw error;
        setCostRecord(data);
      }

      toast({ title: 'Saved', description: 'Wages breakdown updated successfully.' });
      onUpdate?.();
    } catch (err: any) {
      console.error('Error saving wages:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to save wages',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const handleSaveGST = async (gst: number) => {
    try {
      const payload = { gst_amount: gst };

      if (costRecord) {
        const { data, error } = await supabase
          .from('weekly_costs')
          .update(payload)
          .eq('id', costRecord.id)
          .select()
          .single();

        if (error) throw error;
        setCostRecord(data);
      } else {
        const insertPayload: any = {
          week_start: weekStartStr,
          week_end: weekEndStr,
          ...payload,
        };

        const { data, error } = await supabase
          .from('weekly_costs')
          .insert(insertPayload)
          .select()
          .single();

        if (error) throw error;
        setCostRecord(data);
      }

      toast({ title: 'Saved', description: 'GST amount updated successfully.' });
      onUpdate?.();
    } catch (err: any) {
      console.error('Error saving GST:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to save GST',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const handleSavePsila = async (spent: number, notes: string) => {
    try {
      const payload = {
        psila_spent: spent,
        psila_notes: notes.trim() || null,
      };

      if (costRecord) {
        const { data, error } = await supabase
          .from('weekly_costs')
          .update(payload)
          .eq('id', costRecord.id)
          .select()
          .single();

        if (error) throw error;
        setCostRecord(data);
      } else {
        const insertPayload: any = {
          week_start: weekStartStr,
          week_end: weekEndStr,
          ...payload,
        };

        const { data, error } = await supabase
          .from('weekly_costs')
          .insert(insertPayload)
          .select()
          .single();

        if (error) throw error;
        setCostRecord(data);
      }

      toast({ title: 'Saved', description: 'Psila spending updated successfully.' });
      onUpdate?.();
    } catch (err: any) {
      console.error('Error saving Psila:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to save Psila',
        variant: 'destructive',
      });
      throw err;
    }
  };

  // ── Calculations ─────────────────────────────────────────────────────────

  const totalBills = BILL_CATEGORIES.reduce(
    (sum, { key }) => sum + (costRecord?.[key] ?? 0),
    0
  );

  const totalWages =
    (costRecord?.wages_gross ?? 0) +
    (costRecord?.wages_tax ?? 0) +
    (costRecord?.wages_super ?? 0);

  const gst = costRecord?.gst_amount ?? 0;
  const psilaSpent = costRecord?.psila_spent ?? 0;

  const totalCosts = totalBills + totalWages + gst + psilaSpent;
  const profit = weeklyGross - totalCosts;
  const profitMargin = weeklyGross > 0 ? (profit / weeklyGross) * 100 : 0;
  const isProfitable = profit >= 0;

  const weekLabel = `${format(weekStart, 'dd MMM')} – ${format(weekEnd, 'dd MMM yyyy')}`;

  // Extract bill values for dialog
  const billValues: Record<BillCategoryKey, number> = {} as any;
  BILL_CATEGORIES.forEach(({ key }) => {
    billValues[key] = costRecord?.[key] ?? 0;
  });

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
              {/* ── Entry Cards Grid ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Bills */}
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-orange-600" />
                        <p className="text-sm font-medium text-orange-900">Bills</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setBillsDialogOpen(true)}
                        className="h-7 px-2 text-orange-700 hover:bg-orange-100"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="text-xl font-bold text-orange-700">
                      ${totalBills.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                    </p>
                    {totalBills > 0 && (
                      <p className="text-xs text-orange-600 mt-1">
                        {BILL_CATEGORIES.filter(({ key }) => (costRecord?.[key] ?? 0) > 0).length}{' '}
                        categories
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Wages */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <p className="text-sm font-medium text-blue-900">Wages</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setWagesDialogOpen(true)}
                        className="h-7 px-2 text-blue-700 hover:bg-blue-100"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="text-xl font-bold text-blue-700">
                      ${totalWages.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                    </p>
                    {totalWages > 0 && (
                      <p className="text-xs text-blue-600 mt-1">
                        +Tax +Super
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* GST */}
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-purple-600" />
                        <p className="text-sm font-medium text-purple-900">GST</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setGSTDialogOpen(true)}
                        className="h-7 px-2 text-purple-700 hover:bg-purple-100"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="text-xl font-bold text-purple-700">
                      ${gst.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">Set aside</p>
                  </CardContent>
                </Card>

                {/* Psila */}
                <Card className="bg-teal-50 border-teal-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-teal-600" />
                        <p className="text-sm font-medium text-teal-900">Psila Spent</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPsilaDialogOpen(true)}
                        className="h-7 px-2 text-teal-700 hover:bg-teal-100"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="text-xl font-bold text-teal-700">
                      ${psilaSpent.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                    </p>
                    {costRecord?.psila_notes && (
                      <p className="text-xs text-teal-600 mt-1 truncate">
                        {costRecord.psila_notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* ── Bills Breakdown Section ── */}
              {totalBills > 0 && (
                <Card className="bg-orange-50/30 border-orange-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-orange-900 flex items-center gap-2">
                      <Receipt className="h-5 w-5" />
                      Bills Breakdown for the Week
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {BILL_CATEGORIES.map(({ key, label, icon }) => {
                        const amount = costRecord?.[key] ?? 0;
                        if (amount === 0) return null;
                        return (
                          <Card key={key} className="bg-white border-orange-200">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl">{icon}</span>
                                <p className="text-xs font-medium text-gray-700">{label}</p>
                              </div>
                              <p className="text-lg font-bold text-orange-700">
                                ${amount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {((amount / totalBills) * 100).toFixed(1)}% of bills
                              </p>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                    
                    {/* Summary Bar */}
                    <div className="mt-4 bg-white border border-orange-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-orange-900">
                          Total Bills for Week
                        </span>
                        <span className="text-xl font-bold text-orange-700">
                          ${totalBills.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {BILL_CATEGORIES.filter(({ key }) => (costRecord?.[key] ?? 0) > 0).map(({ key, icon }) => (
                          <span key={key} className="text-lg">{icon}</span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ── Wages Breakdown Section ── */}
              {totalWages > 0 && (
                <Card className="bg-blue-50/30 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-blue-900 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Wages Breakdown for the Week
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {costRecord?.wages_gross > 0 && (
                        <Card className="bg-white border-blue-200">
                          <CardContent className="p-3">
                            <p className="text-xs font-medium text-gray-700 mb-1">Gross Wages</p>
                            <p className="text-lg font-bold text-blue-700">
                              ${costRecord.wages_gross.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {((costRecord.wages_gross / totalWages) * 100).toFixed(1)}% of total
                            </p>
                          </CardContent>
                        </Card>
                      )}
                      {costRecord?.wages_tax > 0 && (
                        <Card className="bg-white border-blue-200">
                          <CardContent className="p-3">
                            <p className="text-xs font-medium text-gray-700 mb-1">Tax Withheld</p>
                            <p className="text-lg font-bold text-blue-700">
                              ${costRecord.wages_tax.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {((costRecord.wages_tax / totalWages) * 100).toFixed(1)}% of total
                            </p>
                          </CardContent>
                        </Card>
                      )}
                      {costRecord?.wages_super > 0 && (
                        <Card className="bg-white border-blue-200">
                          <CardContent className="p-3">
                            <p className="text-xs font-medium text-gray-700 mb-1">Superannuation</p>
                            <p className="text-lg font-bold text-blue-700">
                              ${costRecord.wages_super.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {((costRecord.wages_super / totalWages) * 100).toFixed(1)}% of total
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                    
                    {/* Summary Bar */}
                    <div className="mt-4 bg-white border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-blue-900">
                          Total Wages Cost for Week
                        </span>
                        <span className="text-xl font-bold text-blue-700">
                          ${totalWages.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Includes gross pay, tax withheld, and superannuation
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Separator />

              {/* ── Summary Row ── */}
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
                    Bills + Wages + GST + Psila
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

              {totalCosts === 0 && (
                <p className="text-center text-sm text-gray-400 mt-2">
                  👆 Add bills, wages, GST, and Psila above to calculate your weekly profit
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Dialogs ── */}
      <BillsDialog
        open={billsDialogOpen}
        currentValues={billValues}
        onClose={() => setBillsDialogOpen(false)}
        onSave={handleSaveBills}
      />
      <WagesDialog
        open={wagesDialogOpen}
        currentGross={costRecord?.wages_gross ?? 0}
        currentTax={costRecord?.wages_tax ?? 0}
        currentSuper={costRecord?.wages_super ?? 0}
        onClose={() => setWagesDialogOpen(false)}
        onSave={handleSaveWages}
      />
      <GSTDialog
        open={gstDialogOpen}
        currentGST={gst}
        onClose={() => setGSTDialogOpen(false)}
        onSave={handleSaveGST}
      />
      <PsilaDialog
        open={psilaDialogOpen}
        currentSpent={psilaSpent}
        currentNotes={costRecord?.psila_notes ?? ''}
        onClose={() => setPsilaDialogOpen(false)}
        onSave={handleSavePsila}
      />
    </>
  );
}