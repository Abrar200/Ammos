import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { emailService } from '@/lib/emailService';
import { useToast } from '@/hooks/use-toast';
import { Calculator, Mail, DollarSign, Clock, FileText, Send } from 'lucide-react';
import type { Staff } from '@/types/staff';

interface PayrollDialogProps {
  staff: Staff | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface PayrollCalculation {
  regularHours: number;
  overtimeHours: number;
  doubleTimeHours: number;
  publicHolidayHours: number;
  regularPay: number;
  overtimePay: number;
  doubleTimePay: number;
  publicHolidayPay: number;
  grossPay: number;
  superannuation: number;
  taxWithheld: number;
  netPay: number;
}

// Australian tax brackets for 2024-25 (simplified)
const calculateTax = (grossPay: number, payPeriod: 'weekly' | 'fortnightly' | 'monthly'): number => {
  // Convert to annual for calculation
  let annualGross = grossPay;
  if (payPeriod === 'weekly') annualGross *= 52;
  if (payPeriod === 'fortnightly') annualGross *= 26;
  if (payPeriod === 'monthly') annualGross *= 12;

  let annualTax = 0;
  if (annualGross > 18200) {
    if (annualGross <= 45000) {
      annualTax = (annualGross - 18200) * 0.19;
    } else if (annualGross <= 120000) {
      annualTax = 5092 + (annualGross - 45000) * 0.325;
    } else if (annualGross <= 180000) {
      annualTax = 29467 + (annualGross - 120000) * 0.37;
    } else {
      annualTax = 51667 + (annualGross - 180000) * 0.45;
    }
  }

  // Convert back to pay period
  if (payPeriod === 'weekly') return annualTax / 52;
  if (payPeriod === 'fortnightly') return annualTax / 26;
  if (payPeriod === 'monthly') return annualTax / 12;
  return annualTax;
};

export const PayrollDialog = ({ staff, open, onOpenChange, onSuccess }: PayrollDialogProps) => {
  const [formData, setFormData] = useState({
    payPeriodStart: '',
    payPeriodEnd: '',
    regularHours: '',
    overtimeHours: '0',
    doubleTimeHours: '0',
    publicHolidayHours: '0',
    bonuses: '0',
    deductions: '0',
    payPeriodType: 'weekly' as 'weekly' | 'fortnightly' | 'monthly',
    notes: '',
    sendEmail: true
  });

  const [calculation, setCalculation] = useState<PayrollCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  // Set default pay period dates when dialog opens
  useEffect(() => {
    if (open && staff) {
      const today = new Date();
      const lastMonday = new Date(today);
      lastMonday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

      const nextSunday = new Date(lastMonday);
      nextSunday.setDate(lastMonday.getDate() + 6);

      setFormData(prev => ({
        ...prev,
        payPeriodStart: lastMonday.toISOString().split('T')[0],
        payPeriodEnd: nextSunday.toISOString().split('T')[0]
      }));
    }
  }, [open, staff]);

  // Calculate payroll when form data changes
  useEffect(() => {
    if (staff && formData.regularHours) {
      calculatePayroll();
    }
  }, [staff, formData.regularHours, formData.overtimeHours, formData.doubleTimeHours, formData.publicHolidayHours, formData.bonuses, formData.deductions, formData.payPeriodType]);

  const calculatePayroll = () => {
    if (!staff) return;

    const regularHours = parseFloat(formData.regularHours) || 0;
    const overtimeHours = parseFloat(formData.overtimeHours) || 0;
    const doubleTimeHours = parseFloat(formData.doubleTimeHours) || 0;
    const publicHolidayHours = parseFloat(formData.publicHolidayHours) || 0;
    const bonuses = parseFloat(formData.bonuses) || 0;
    const deductions = parseFloat(formData.deductions) || 0;

    const baseRate = staff.hourly_rate;
    const overtimeRate = baseRate * 1.5;
    const doubleTimeRate = baseRate * 2.0;
    const publicHolidayRate = baseRate * 2.5;

    const regularPay = regularHours * baseRate;
    const overtimePay = overtimeHours * overtimeRate;
    const doubleTimePay = doubleTimeHours * doubleTimeRate;
    const publicHolidayPay = publicHolidayHours * publicHolidayRate;

    const grossPay = regularPay + overtimePay + doubleTimePay + publicHolidayPay + bonuses - deductions;

    // Calculate superannuation (11% from July 2023)
    const superannuation = grossPay * 0.11;

    // Calculate tax withholding
    const taxWithheld = calculateTax(grossPay, formData.payPeriodType);

    const netPay = grossPay - taxWithheld;

    setCalculation({
      regularHours,
      overtimeHours,
      doubleTimeHours,
      publicHolidayHours,
      regularPay,
      overtimePay,
      doubleTimePay,
      publicHolidayPay,
      grossPay,
      superannuation,
      taxWithheld,
      netPay
    });
  };

  const sendPayslipEmail = async (payrollRecord: any) => {
    if (!staff || !formData.sendEmail || !calculation) return;

    setSending(true);
    try {
      await emailService.sendPayslip(payrollRecord, staff, calculation);

      toast({
        title: 'Email Sent',
        description: `Payslip has been sent to ${staff.email}`,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'Email Error',
        description: 'Failed to send payslip email, but payroll record was saved',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff || !calculation) return;

    setLoading(true);
    try {
      // Validate required fields
      if (!formData.payPeriodStart || !formData.payPeriodEnd || !formData.regularHours) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }

      // Create payroll record
      const payrollData = {
        staff_id: staff.id,
        pay_period_start: formData.payPeriodStart,
        pay_period_end: formData.payPeriodEnd,
        pay_period_type: formData.payPeriodType,
        regular_hours: calculation.regularHours,
        overtime_hours: calculation.overtimeHours,
        double_time_hours: calculation.doubleTimeHours,
        public_holiday_hours: calculation.publicHolidayHours,
        hourly_rate: staff.hourly_rate,
        regular_pay: calculation.regularPay,
        overtime_pay: calculation.overtimePay,
        double_time_pay: calculation.doubleTimePay,
        public_holiday_pay: calculation.publicHolidayPay,
        bonuses: parseFloat(formData.bonuses) || 0,
        deductions: parseFloat(formData.deductions) || 0,
        gross_pay: calculation.grossPay,
        tax_withheld: calculation.taxWithheld,
        superannuation: calculation.superannuation,
        net_pay: calculation.netPay,
        notes: formData.notes || null,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('payroll_records')
        .insert([payrollData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Payroll record created successfully',
      });

      // Send email if requested
      if (formData.sendEmail) {
        await sendPayslipEmail(data);
      }

      // Reset form
      setFormData({
        payPeriodStart: '',
        payPeriodEnd: '',
        regularHours: '',
        overtimeHours: '0',
        doubleTimeHours: '0',
        publicHolidayHours: '0',
        bonuses: '0',
        deductions: '0',
        payPeriodType: 'weekly',
        notes: '',
        sendEmail: true
      });
      setCalculation(null);

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating payroll:', error);
      toast({
        title: 'Error',
        description: 'Failed to create payroll record',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!staff) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Process Payroll - {staff.full_name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Input Form */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pay Period Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="payPeriodStart">Start Date *</Label>
                      <Input
                        id="payPeriodStart"
                        type="date"
                        value={formData.payPeriodStart}
                        onChange={(e) => setFormData(prev => ({ ...prev, payPeriodStart: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="payPeriodEnd">End Date *</Label>
                      <Input
                        id="payPeriodEnd"
                        type="date"
                        value={formData.payPeriodEnd}
                        onChange={(e) => setFormData(prev => ({ ...prev, payPeriodEnd: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Hours Worked</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="regularHours">Regular Hours *</Label>
                      <Input
                        id="regularHours"
                        type="number"
                        step="0.25"
                        min="0"
                        value={formData.regularHours}
                        onChange={(e) => setFormData(prev => ({ ...prev, regularHours: e.target.value }))}
                        placeholder="40.00"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="overtimeHours">Overtime Hours (1.5x)</Label>
                      <Input
                        id="overtimeHours"
                        type="number"
                        step="0.25"
                        min="0"
                        value={formData.overtimeHours}
                        onChange={(e) => setFormData(prev => ({ ...prev, overtimeHours: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="doubleTimeHours">Double Time Hours (2x)</Label>
                      <Input
                        id="doubleTimeHours"
                        type="number"
                        step="0.25"
                        min="0"
                        value={formData.doubleTimeHours}
                        onChange={(e) => setFormData(prev => ({ ...prev, doubleTimeHours: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="publicHolidayHours">Public Holiday Hours (2.5x)</Label>
                      <Input
                        id="publicHolidayHours"
                        type="number"
                        step="0.25"
                        min="0"
                        value={formData.publicHolidayHours}
                        onChange={(e) => setFormData(prev => ({ ...prev, publicHolidayHours: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Additional Payments & Deductions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bonuses">Bonuses/Allowances ($)</Label>
                      <Input
                        id="bonuses"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.bonuses}
                        onChange={(e) => setFormData(prev => ({ ...prev, bonuses: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="deductions">Deductions ($)</Label>
                      <Input
                        id="deductions"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.deductions}
                        onChange={(e) => setFormData(prev => ({ ...prev, deductions: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notes & Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Any additional notes for this payroll..."
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="sendEmail"
                      checked={formData.sendEmail}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sendEmail: checked }))}
                    />
                    <Label htmlFor="sendEmail" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email payslip to {staff.email}
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Calculation Summary */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Employee Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><strong>Name:</strong> {staff.full_name}</p>
                    <p><strong>Position:</strong> {staff.position}</p>
                    <p><strong>Base Rate:</strong> ${staff.hourly_rate.toFixed(2)}/hour</p>
                    <p><strong>Employment:</strong> {staff.employment_type}</p>
                  </div>
                </CardContent>
              </Card>

              {calculation && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Hours Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Regular Hours:</span>
                          <span>{calculation.regularHours.toFixed(2)}h</span>
                        </div>
                        {calculation.overtimeHours > 0 && (
                          <div className="flex justify-between">
                            <span>Overtime Hours:</span>
                            <span>{calculation.overtimeHours.toFixed(2)}h</span>
                          </div>
                        )}
                        {calculation.doubleTimeHours > 0 && (
                          <div className="flex justify-between">
                            <span>Double Time Hours:</span>
                            <span>{calculation.doubleTimeHours.toFixed(2)}h</span>
                          </div>
                        )}
                        {calculation.publicHolidayHours > 0 && (
                          <div className="flex justify-between">
                            <span>Public Holiday Hours:</span>
                            <span>{calculation.publicHolidayHours.toFixed(2)}h</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-semibold">
                          <span>Total Hours:</span>
                          <span>{(calculation.regularHours + calculation.overtimeHours + calculation.doubleTimeHours + calculation.publicHolidayHours).toFixed(2)}h</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Earnings Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Regular Pay:</span>
                          <span>${calculation.regularPay.toFixed(2)}</span>
                        </div>
                        {calculation.overtimePay > 0 && (
                          <div className="flex justify-between">
                            <span>Overtime Pay:</span>
                            <span>${calculation.overtimePay.toFixed(2)}</span>
                          </div>
                        )}
                        {calculation.doubleTimePay > 0 && (
                          <div className="flex justify-between">
                            <span>Double Time Pay:</span>
                            <span>${calculation.doubleTimePay.toFixed(2)}</span>
                          </div>
                        )}
                        {calculation.publicHolidayPay > 0 && (
                          <div className="flex justify-between">
                            <span>Public Holiday Pay:</span>
                            <span>${calculation.publicHolidayPay.toFixed(2)}</span>
                          </div>
                        )}
                        {parseFloat(formData.bonuses) > 0 && (
                          <div className="flex justify-between">
                            <span>Bonuses:</span>
                            <span>${parseFloat(formData.bonuses).toFixed(2)}</span>
                          </div>
                        )}
                        {parseFloat(formData.deductions) > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>Deductions:</span>
                            <span>-${parseFloat(formData.deductions).toFixed(2)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Gross Pay:</span>
                          <span>${calculation.grossPay.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Deductions & Contributions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Income Tax:</span>
                          <span>${calculation.taxWithheld.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Superannuation (11%):</span>
                          <span>${calculation.superannuation.toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-xl text-green-600">
                          <span>Net Pay:</span>
                          <span>${calculation.netPay.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading || sending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || sending || !calculation}
              className="min-w-[120px]"
            >
              {loading ? 'Processing...' :
                sending ? 'Sending Email...' :
                  formData.sendEmail ? (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Process & Email
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Process Payroll
                    </>
                  )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};