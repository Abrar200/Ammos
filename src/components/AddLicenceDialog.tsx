import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface AddLicenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function AddLicenceDialog({ open, onOpenChange, onSuccess }: AddLicenceDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    license_type: '',
    license_number: '',
    issuing_authority: '',
    start_date: '',
    expiry_date: '',
    status: 'Active',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('licenses')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Licence added successfully",
      });

      // Reset form
      setFormData({
        license_type: '',
        license_number: '',
        issuing_authority: '',
        start_date: '',
        expiry_date: '',
        status: 'Active',
        notes: ''
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding licence:', error);
      toast({
        title: "Error",
        description: "Failed to add licence",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Licence</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="license_type">Licence Type</Label>
            <Select 
              value={formData.license_type} 
              onValueChange={(value) => setFormData({...formData, license_type: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select licence type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Liquor Licence">Liquor Licence</SelectItem>
                <SelectItem value="Food Business Licence">Food Business Licence</SelectItem>
                <SelectItem value="Outdoor Dining Permit">Outdoor Dining Permit</SelectItem>
                <SelectItem value="Health & Safety Certificate">Health & Safety Certificate</SelectItem>
                <SelectItem value="Music Licence">Music Licence</SelectItem>
                <SelectItem value="Gaming Machine Licence">Gaming Machine Licence</SelectItem>
                <SelectItem value="Council Permit">Council Permit</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="license_number">Licence Number</Label>
            <Input
              id="license_number"
              value={formData.license_number}
              onChange={(e) => setFormData({...formData, license_number: e.target.value})}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="issuing_authority">Issuing Authority</Label>
            <Input
              id="issuing_authority"
              value={formData.issuing_authority}
              onChange={(e) => setFormData({...formData, issuing_authority: e.target.value})}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="expiry_date">Expiry Date</Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData({...formData, status: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Additional notes or restrictions..."
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Adding...' : 'Add Licence'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}