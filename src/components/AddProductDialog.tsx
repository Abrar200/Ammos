import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { ProductCategory } from '@/types/product';

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  categories: ProductCategory[];
  suppliers: any[];
}

export default function AddProductDialog({ 
  open, 
  onOpenChange, 
  onSuccess, 
  categories, 
  suppliers 
}: AddProductDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    supplier_id: '',
    category_id: '',
    name: '',
    code: '',
    description: '',
    unit: '',
    cost_per_unit: 0,
    unit_type: 'each',
    min_price: 0,
    max_price: 0,
    is_active: true,
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        ...formData,
        cost_per_unit: parseFloat(formData.cost_per_unit.toString()),
        min_price: formData.min_price ? parseFloat(formData.min_price.toString()) : null,
        max_price: formData.max_price ? parseFloat(formData.max_price.toString()) : null,
      };

      const { error } = await supabase
        .from('products')
        .insert([productData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product added successfully",
      });

      setFormData({
        supplier_id: '',
        category_id: '',
        name: '',
        code: '',
        description: '',
        unit: '',
        cost_per_unit: 0,
        unit_type: 'each',
        min_price: 0,
        max_price: 0,
        is_active: true,
        notes: ''
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supplier_id">Supplier *</Label>
              <Select 
                value={formData.supplier_id} 
                onValueChange={(value) => setFormData({...formData, supplier_id: value})}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category_id">Category *</Label>
              <Select 
                value={formData.category_id} 
                onValueChange={(value) => setFormData({...formData, category_id: value})}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Beef Mince Premium Medium"
                required
              />
            </div>

            <div>
              <Label htmlFor="code">Product Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                placeholder="e.g., BFMPM"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Product description..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="unit">Unit *</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                placeholder="e.g., kg, carton, bunch"
                required
              />
            </div>

            <div>
              <Label htmlFor="unit_type">Unit Type *</Label>
              <Select 
                value={formData.unit_type} 
                onValueChange={(value) => setFormData({...formData, unit_type: value})}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="each">Each</SelectItem>
                  <SelectItem value="kg">Kilogram</SelectItem>
                  <SelectItem value="litre">Litre</SelectItem>
                  <SelectItem value="carton">Carton</SelectItem>
                  <SelectItem value="pack">Pack</SelectItem>
                  <SelectItem value="case">Case</SelectItem>
                  <SelectItem value="bottle">Bottle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="cost_per_unit">Cost per Unit *</Label>
              <Input
                id="cost_per_unit"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost_per_unit}
                onChange={(e) => setFormData({...formData, cost_per_unit: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min_price">Minimum Price (Optional)</Label>
              <Input
                id="min_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.min_price}
                onChange={(e) => setFormData({...formData, min_price: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="max_price">Maximum Price (Optional)</Label>
              <Input
                id="max_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.max_price}
                onChange={(e) => setFormData({...formData, max_price: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
            />
            <Label htmlFor="is_active">Active Product</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}