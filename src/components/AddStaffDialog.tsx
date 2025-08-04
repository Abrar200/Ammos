import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface AddStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddStaffDialog = ({ open, onOpenChange, onSuccess }: AddStaffDialogProps) => {
  const [formData, setFormData] = useState({
    // Basic Info
    full_name: '',
    email: '',
    phone: '',
    position: '',
    hourly_rate: '',
    employment_type: 'Casual',
    is_active: true,

    // Personal Details
    date_of_birth: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',

    // Employment Details
    start_date: new Date().toISOString().split('T')[0],

    // Financial Details
    tax_file_number: '',
    super_fund_name: '',
    super_member_number: '',
    bank_account_name: '',
    bank_bsb: '',
    bank_account_number: '',

    // Additional
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.full_name || !formData.email || !formData.position || !formData.hourly_rate) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields (Name, Email, Position, Hourly Rate)',
          variant: 'destructive',
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast({
          title: 'Invalid Email',
          description: 'Please enter a valid email address',
          variant: 'destructive',
        });
        return;
      }

      // Validate hourly rate
      const hourlyRate = parseFloat(formData.hourly_rate);
      if (isNaN(hourlyRate) || hourlyRate <= 0) {
        toast({
          title: 'Invalid Rate',
          description: 'Please enter a valid hourly rate',
          variant: 'destructive',
        });
        return;
      }

      // Prepare data for insertion
      const staffData = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
        position: formData.position.trim(),
        hourly_rate: hourlyRate,
        employment_type: formData.employment_type,
        is_active: formData.is_active,
        date_of_birth: formData.date_of_birth || null,
        address: formData.address.trim() || null,
        emergency_contact_name: formData.emergency_contact_name.trim() || null,
        emergency_contact_phone: formData.emergency_contact_phone.trim() || null,
        start_date: formData.start_date || null,
        tax_file_number: formData.tax_file_number.trim() || null,
        super_fund_name: formData.super_fund_name.trim() || null,
        super_member_number: formData.super_member_number.trim() || null,
        bank_account_name: formData.bank_account_name.trim() || null,
        bank_bsb: formData.bank_bsb.trim() || null,
        bank_account_number: formData.bank_account_number.trim() || null,
        notes: formData.notes.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('staff')
        .insert([staffData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);

        // Handle specific error cases
        if (error.code === '23505') {
          toast({
            title: 'Email Already Exists',
            description: 'A staff member with this email already exists',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Database Error',
            description: error.message || 'Failed to add staff member',
            variant: 'destructive',
          });
        }
        return;
      }

      toast({
        title: 'Success',
        description: `${formData.full_name} has been added successfully`,
      });

      // Reset form
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        position: '',
        hourly_rate: '',
        employment_type: 'Casual',
        is_active: true,
        date_of_birth: '',
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        start_date: new Date().toISOString().split('T')[0],
        tax_file_number: '',
        super_fund_name: '',
        super_member_number: '',
        bank_account_name: '',
        bank_bsb: '',
        bank_account_number: '',
        notes: ''
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding staff:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Staff Member</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => updateFormData('full_name', e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  placeholder="+61 400 000 000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => updateFormData('date_of_birth', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => updateFormData('address', e.target.value)}
                placeholder="123 Main Street, City, State"
              />
            </div>
          </div>

          {/* Employment Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Employment Details</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => updateFormData('position', e.target.value)}
                  placeholder="Server, Chef, Manager, etc."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employment_type">Employment Type</Label>
                <Select
                  value={formData.employment_type}
                  onValueChange={(value) => updateFormData('employment_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Casual">Casual</SelectItem>
                    <SelectItem value="Part-Time">Part-Time</SelectItem>
                    <SelectItem value="Full-Time">Full-Time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Hourly Rate (AUD) *</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hourly_rate}
                  onChange={(e) => updateFormData('hourly_rate', e.target.value)}
                  placeholder="25.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => updateFormData('start_date', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Emergency Contact</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">Contact Name</Label>
                <Input
                  id="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => updateFormData('emergency_contact_name', e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                <Input
                  id="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => updateFormData('emergency_contact_phone', e.target.value)}
                  placeholder="+61 400 000 000"
                />
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Financial Details (Optional)</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax_file_number">Tax File Number</Label>
                <Input
                  id="tax_file_number"
                  value={formData.tax_file_number}
                  onChange={(e) => updateFormData('tax_file_number', e.target.value)}
                  placeholder="123-456-789"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="super_fund_name">Super Fund Name</Label>
                <Input
                  id="super_fund_name"
                  value={formData.super_fund_name}
                  onChange={(e) => updateFormData('super_fund_name', e.target.value)}
                  placeholder="AustralianSuper"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_account_name">Bank Account Name</Label>
                <Input
                  id="bank_account_name"
                  value={formData.bank_account_name}
                  onChange={(e) => updateFormData('bank_account_name', e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_bsb">BSB</Label>
                <Input
                  id="bank_bsb"
                  value={formData.bank_bsb}
                  onChange={(e) => updateFormData('bank_bsb', e.target.value)}
                  placeholder="123-456"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_account_number">Account Number</Label>
                <Input
                  id="bank_account_number"
                  value={formData.bank_account_number}
                  onChange={(e) => updateFormData('bank_account_number', e.target.value)}
                  placeholder="12345678"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Additional Information</h3>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateFormData('notes', e.target.value)}
                placeholder="Any additional notes about this staff member..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => updateFormData('is_active', checked)}
              />
              <Label htmlFor="is_active">Active Staff Member</Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding Staff...' : 'Add Staff Member'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};