import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

interface Subscription {
  id: number;
  name: string;
  provider: string;
  category: string;
  cost: number;
  billing_cycle: string;
  start_date: string;
  next_billing_date: string;
  status: string;
  description: string;
  auto_renew: boolean;
}

interface AddSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscriptionAdded: () => void;
  editingSubscription?: Subscription | null;
}

const categories = [
  'POS Systems',
  'Accounting',
  'Staff Management',
  'Delivery Platforms',
  'Utilities',
  'Insurance',
  'Health & Safety',
  'Music',
  'Communications',
  'Payment Processing',
  'Reservations',
  'Security & Surveillance',
  'Software',
  'Marketing',
  'Cleaning',
  'Equipment',
  'Other'
];

const billingCycles = [
  'weekly',
  'monthly',
  'quarterly',
  'annually'
];

const statuses = [
  'active',
  'suspended',
  'cancelled'
];

export function AddSubscriptionDialog({
  open,
  onOpenChange,
  onSubscriptionAdded,
  editingSubscription
}: AddSubscriptionDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    category: '',
    cost: '',
    billing_cycle: 'monthly',
    start_date: '',
    next_billing_date: '',
    status: 'active',
    description: '',
    auto_renew: true
  });
  const [loading, setLoading] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (editingSubscription) {
      setFormData({
        name: editingSubscription.name || '',
        provider: editingSubscription.provider || '',
        category: editingSubscription.category || '',
        cost: editingSubscription.cost?.toString() || '',
        billing_cycle: editingSubscription.billing_cycle || 'monthly',
        start_date: editingSubscription.start_date || '',
        next_billing_date: editingSubscription.next_billing_date || '',
        status: editingSubscription.status || 'active',
        description: editingSubscription.description || '',
        auto_renew: editingSubscription.auto_renew ?? true
      });
    } else {
      // Reset form for new subscription
      setFormData({
        name: '',
        provider: '',
        category: '',
        cost: '',
        billing_cycle: 'monthly',
        start_date: '',
        next_billing_date: '',
        status: 'active',
        description: '',
        auto_renew: true
      });
    }
  }, [editingSubscription, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const subscriptionData = {
        name: formData.name,
        provider: formData.provider,
        category: formData.category,
        cost: parseFloat(formData.cost) || 0,
        billing_cycle: formData.billing_cycle,
        start_date: formData.start_date || null,
        next_billing_date: formData.next_billing_date || null,
        status: formData.status,
        description: formData.description,
        auto_renew: formData.auto_renew
      };

      let result;
      if (editingSubscription) {
        // Update existing subscription
        result = await supabase
          .from('subscriptions')
          .update(subscriptionData)
          .eq('id', editingSubscription.id);
      } else {
        // Create new subscription
        result = await supabase
          .from('subscriptions')
          .insert([subscriptionData]);
      }

      if (result.error) {
        console.error('Supabase error:', result.error);
        throw result.error;
      }

      toast({
        title: "Success",
        description: `Subscription ${editingSubscription ? 'updated' : 'added'} successfully`,
      });

      onSubscriptionAdded();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving subscription:', error);
      toast({
        title: "Error",
        description: `Failed to ${editingSubscription ? 'update' : 'save'} subscription`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingSubscription ? 'Edit Subscription' : 'Add New Subscription'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Service Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Lightspeed POS"
              required
            />
          </div>

          <div>
            <Label htmlFor="provider">Provider</Label>
            <Input
              id="provider"
              value={formData.provider}
              onChange={(e) => handleInputChange('provider', e.target.value)}
              placeholder="e.g., Lightspeed"
            />
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleInputChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cost">Cost ($)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost}
                onChange={(e) => handleInputChange('cost', e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="billing_cycle">Billing Cycle *</Label>
              <Select
                value={formData.billing_cycle}
                onValueChange={(value) => handleInputChange('billing_cycle', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {billingCycles.map((cycle) => (
                    <SelectItem key={cycle} value={cycle}>
                      {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="next_billing_date">Next Billing Date</Label>
              <Input
                id="next_billing_date"
                type="date"
                value={formData.next_billing_date}
                onChange={(e) => handleInputChange('next_billing_date', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Additional details about this subscription..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="auto_renew"
              checked={formData.auto_renew}
              onCheckedChange={(checked) => handleInputChange('auto_renew', checked)}
            />
            <Label htmlFor="auto_renew">Auto-renewal enabled</Label>
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
              {loading ? 'Saving...' : (editingSubscription ? 'Update' : 'Add')} Subscription
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}