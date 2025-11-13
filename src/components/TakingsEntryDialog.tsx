import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Calculator, AlertTriangle, DollarSign, CreditCard, Wallet } from 'lucide-react';
import { TakingsFormData } from '@/types/takings';

interface TakingsEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTaking?: any;
  onSuccess: () => void;
}

export default function TakingsEntryDialog({ open, onOpenChange, editingTaking, onSuccess }: TakingsEntryDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TakingsFormData>({
    entry_date: new Date().toISOString().split('T')[0],
    pos_amount: 0,
    eft_amount: 0,
    cash_amount: 0,
    notes: ''
  });

  const CASH_FLOAT = 300.00;

  useEffect(() => {
    if (editingTaking) {
      setFormData({
        entry_date: editingTaking.entry_date,
        pos_amount: editingTaking.pos_amount,
        eft_amount: editingTaking.eft_amount,
        cash_amount: editingTaking.cash_amount,
        notes: editingTaking.notes || ''
      });
    } else {
      // Default to today's date for new entries
      setFormData({
        entry_date: new Date().toISOString().split('T')[0],
        pos_amount: 0,
        eft_amount: 0,
        cash_amount: 0,
        notes: ''
      });
    }
  }, [editingTaking, open]);

  const calculateGross = () => {
    return (formData.eft_amount || 0) + ((formData.cash_amount || 0) - CASH_FLOAT);
  };
  
  const calculateCashToBank = () => {
    return (formData.cash_amount || 0) - CASH_FLOAT;
  };

  const isCashBelowFloat = () => {
    return (formData.cash_amount || 0) < CASH_FLOAT;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate positive numbers
      if (formData.pos_amount < 0 || formData.eft_amount < 0 || formData.cash_amount < 0) {
        throw new Error('All amounts must be positive numbers');
      }

      const takingData = {
        entry_date: formData.entry_date,
        pos_amount: formData.pos_amount,
        eft_amount: formData.eft_amount,
        cash_amount: formData.cash_amount,
        cash_float: CASH_FLOAT,
        notes: formData.notes || null,
        updated_at: new Date().toISOString()
      };

      let error;
      if (editingTaking) {
        const { error: updateError } = await supabase
          .from('takings')
          .update(takingData)
          .eq('id', editingTaking.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('takings')
          .insert([takingData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Takings ${editingTaking ? 'updated' : 'added'} successfully`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving takings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save takings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const grossTakings = calculateGross();
  const cashToBank = calculateCashToBank();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {editingTaking ? 'Edit Takings Entry' : 'Add Daily Takings'}
          </DialogTitle>
          <DialogDescription>
            Enter daily takings for {new Date(formData.entry_date).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Input */}
          <div>
            <Label htmlFor="entry_date" className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4" />
              Date *
            </Label>
            <Input
              id="entry_date"
              type="date"
              value={formData.entry_date}
              onChange={(e) => setFormData({...formData, entry_date: e.target.value})}
              required
              className="w-full"
            />
          </div>

          {/* Amount Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* POS Amount */}
            <div className="space-y-2">
              <Label htmlFor="pos_amount" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                POS Amount *
              </Label>
              <Input
                id="pos_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.pos_amount || ''}
                onChange={(e) => setFormData({...formData, pos_amount: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
                required
                className="w-full"
              />
              <p className="text-xs text-gray-500">Lightspeed POS total</p>
            </div>

            {/* EFT Amount */}
            <div className="space-y-2">
              <Label htmlFor="eft_amount" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-green-600" />
                EFT Amount *
              </Label>
              <Input
                id="eft_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.eft_amount || ''}
                onChange={(e) => setFormData({...formData, eft_amount: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
                required
                className="w-full"
              />
              <p className="text-xs text-gray-500">Westpac terminal total</p>
            </div>

            {/* Cash Amount */}
            <div className="space-y-2">
              <Label htmlFor="cash_amount" className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-yellow-600" />
                Cash Amount *
              </Label>
              <Input
                id="cash_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.cash_amount || ''}
                onChange={(e) => setFormData({...formData, cash_amount: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
                required
                className="w-full"
              />
              <p className="text-xs text-gray-500">Physical cash counted</p>
            </div>
          </div>

          {/* Cash Below Float Warning */}
          {isCashBelowFloat() && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Cash is below float (${CASH_FLOAT}). Current cash: ${formData.cash_amount.toFixed(2)}
              </AlertDescription>
            </Alert>
          )}

          {/* Calculations Display */}
          <Card>
            <CardContent className="p-4">
                <h4 className="font-semibold mb-3">Auto Calculations</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                    <p className="text-gray-600">Gross Takings</p>
                    <p className="text-lg font-bold text-green-600">
                    ${calculateGross().toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">EFT + Psila</p>
                </div>
                <div>
                    <p className="text-gray-600">Cash Float</p>
                    <p className="text-lg font-mono">${CASH_FLOAT.toFixed(2)}</p>
                </div>
                <div>
                    <p className="text-gray-600">Psila</p>
                    <p className={`text-lg font-bold ${calculateCashToBank() >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                    ${calculateCashToBank().toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">Cash - $300</p>
                </div>
                <div>
                    <p className="text-gray-600">POS vs Actual</p>
                    <p className={`text-lg font-bold ${calculateGross() >= formData.pos_amount ? 'text-green-600' : 'text-red-600'}`}>
                    ${(calculateGross() - formData.pos_amount).toFixed(2)}
                    </p>
                </div>
                </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Any additional notes or comments..."
              rows={3}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (editingTaking ? 'Update Takings' : 'Add Takings')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}