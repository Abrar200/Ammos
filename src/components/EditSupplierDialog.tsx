import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { Supplier } from '@/types/supplier';

interface EditSupplierDialogProps {
  supplier: Supplier;
  open: boolean;
  onClose: () => void;
  onSupplierUpdated: () => void;
}

export const EditSupplierDialog = ({ supplier, open, onClose, onSupplierUpdated }: EditSupplierDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    supplier_type: '',
    payment_frequency: '',
    amount_per_period: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name,
        supplier_type: supplier.supplier_type,
        payment_frequency: supplier.payment_frequency,
        amount_per_period: supplier.amount_per_period.toString(),
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        notes: supplier.notes || ''
      });
      setTags(supplier.tags || []);
      setImagePreview(supplier.image_url);
    }
  }, [supplier]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const calculateMonthlyTotal = () => {
    const amount = parseFloat(formData.amount_per_period) || 0;
    switch (formData.payment_frequency) {
      case 'Weekly': return amount * 4.33;
      case 'Monthly': return amount;
      case 'Quarterly': return amount / 3;
      case 'Yearly': return amount / 12;
      default: return amount;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let imageUrl = supplier.image_url;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('supplier-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('supplier-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const { error } = await supabase
        .from('suppliers')
        .update({
          name: formData.name,
          supplier_type: formData.supplier_type,
          payment_frequency: formData.payment_frequency,
          amount_per_period: parseFloat(formData.amount_per_period),
          monthly_total: calculateMonthlyTotal(),
          image_url: imageUrl,
          tags: tags,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          notes: formData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', supplier.id);

      if (error) throw error;

      onSupplierUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating supplier:', error);
      setError(error instanceof Error ? error.message : 'Failed to update supplier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Supplier</DialogTitle>
        </DialogHeader>
        
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Supplier Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="supplier_type">Type *</Label>
              <Select value={formData.supplier_type} onValueChange={(value) => setFormData({...formData, supplier_type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment_frequency">Payment Frequency *</Label>
              <Select value={formData.payment_frequency} onValueChange={(value) => setFormData({...formData, payment_frequency: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount_per_period">Amount per Period *</Label>
              <Input
                id="amount_per_period"
                type="number"
                step="0.01"
                value={formData.amount_per_period}
                onChange={(e) => setFormData({...formData, amount_per_period: e.target.value})}
                required
              />
            </div>
          </div>

          {formData.payment_frequency && formData.amount_per_period && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                Monthly Cost: <strong>${calculateMonthlyTotal().toFixed(2)}</strong>
              </p>
            </div>
          )}

          <div>
            <Label>Supplier Image</Label>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="flex-1"
              />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded" />
              )}
            </div>
          </div>

          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} size="sm">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Contact Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="phone">Contact Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Supplier'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};