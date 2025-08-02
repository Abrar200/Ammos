import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

interface Staff {
  id: string;
  name: string;
  email: string;
  position: string;
  hourly_rate: number;
  employment_type: string;
}

interface PayrollDialogProps {
  staff: Staff | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const PayrollDialog = ({ staff, open, onOpenChange, onSuccess }: PayrollDialogProps) => {
  const [formData, setFormData] = useState({
    payPeriodStart: '',
    payPeriodEnd: '',
    hoursWorked: '',
    overtimeHours: '0'
  });
  const [loading, setLoading] = useState(false);

  if (!staff) return null;

  const calculatePay = () => {
    const hours = parseFloat(formData.hoursWorked) || 0;
    const overtime = parseFloat(formData.overtimeHours) || 0;
    const regularHours = Math.max(0, hours - overtime);
    
    const regularPay = regularHours * staff.hourly_rate;
    const overtimePay = overtime * staff.hourly_rate * 1.5;
    const grossPay = regularPay + overtimePay;
    
    const taxRate = 0.20; // 20% tax
    const superRate = 0.105; // 10.5% superannuation
    
    const taxDeductions = grossPay * taxRate;
    const superContributions = grossPay * superRate;
    const netPay = grossPay - taxDeductions;

    return {
      regularHours,
      overtimeHours: overtime,
      grossPay,
      taxDeductions,
      superContributions,
      netPay
    };
  };

  const payCalculation = calculatePay();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('payroll_records')
        .insert({
          staff_id: staff.id,
          pay_period_start: formData.payPeriodStart,
          pay_period_end: formData.payPeriodEnd,
          hours_worked: parseFloat(formData.hoursWorked),
          regular_hours: payCalculation.regularHours,
          overtime_hours: payCalculation.overtimeHours,
          gross_pay: payCalculation.grossPay,
          tax_deductions: payCalculation.taxDeductions,
          super_contributions: payCalculation.superContributions,
          net_pay: payCalculation.netPay
        });

      if (error) throw error;

      toast({
        title: "Payroll Created",
        description: `Payroll record created for ${staff.name}`,
      });

      onSuccess();
      onOpenChange(false);
      setFormData({ payPeriodStart: '', payPeriodEnd: '', hoursWorked: '', overtimeHours: '0' });
      // Send payslip
      await supabase.functions.invoke('send-payslip', {
        body: { 
          payrollRecord: {
            ...payCalculation,
            pay_period_start: formData.payPeriodStart,
            pay_period_end: formData.payPeriodEnd,
            hours_worked: parseFloat(formData.hoursWorked)
          },
          staffMember: staff
        }
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create payroll record",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Payroll - {staff.name}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payPeriodStart">Pay Period Start</Label>
              <Input
                id="payPeriodStart"
                type="date"
                value={formData.payPeriodStart}
                onChange={(e) => setFormData(prev => ({ ...prev, payPeriodStart: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="payPeriodEnd">Pay Period End</Label>
              <Input
                id="payPeriodEnd"
                type="date"
                value={formData.payPeriodEnd}
                onChange={(e) => setFormData(prev => ({ ...prev, payPeriodEnd: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hoursWorked">Total Hours Worked</Label>
              <Input
                id="hoursWorked"
                type="number"
                step="0.5"
                value={formData.hoursWorked}
                onChange={(e) => setFormData(prev => ({ ...prev, hoursWorked: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="overtimeHours">Overtime Hours</Label>
              <Input
                id="overtimeHours"
                type="number"
                step="0.5"
                value={formData.overtimeHours}
                onChange={(e) => setFormData(prev => ({ ...prev, overtimeHours: e.target.value }))}
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pay Calculation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Regular Hours ({payCalculation.regularHours}h @ ${staff.hourly_rate}/h):</span>
                <span>${(payCalculation.regularHours * staff.hourly_rate).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Overtime Hours ({payCalculation.overtimeHours}h @ ${(staff.hourly_rate * 1.5).toFixed(2)}/h):</span>
                <span>${(payCalculation.overtimeHours * staff.hourly_rate * 1.5).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Gross Pay:</span>
                <span>${payCalculation.grossPay.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Tax Deductions (20%):</span>
                <span>-${payCalculation.taxDeductions.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-blue-600">
                <span>Superannuation (10.5%):</span>
                <span>${payCalculation.superContributions.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Net Pay:</span>
                <span>${payCalculation.netPay.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Payroll & Send Payslip'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};