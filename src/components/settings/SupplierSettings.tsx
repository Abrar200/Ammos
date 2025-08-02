import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, Calendar, Tag, Building, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const SupplierSettings: React.FC = () => {
  const { toast } = useToast();
  const [supplierData, setSupplierData] = useState({
    defaultPaymentTerms: '30',
    defaultReminderFrequency: 'weekly',
  });

  const [categoryTags, setCategoryTags] = useState([
    'Meat', 'Seafood', 'Beverages', 'Vegetables', 'Dairy', 'Dry Goods', 'Cleaning Supplies'
  ]);

  const [supplierTypes, setSupplierTypes] = useState([
    'Local', 'National', 'Wholesale', 'Retail', 'Specialty', 'Organic'
  ]);

  const [paymentTermOptions] = useState([
    { value: '7', label: '7 days' },
    { value: '14', label: '14 days' },
    { value: '30', label: '30 days' },
    { value: '60', label: '60 days' },
    { value: '90', label: '90 days' }
  ]);

  const [reminderOptions] = useState([
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ]);

  const [newCategory, setNewCategory] = useState('');
  const [newSupplierType, setNewSupplierType] = useState('');

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Supplier settings have been updated successfully.",
    });
  };

  const addCategory = () => {
    if (newCategory && !categoryTags.includes(newCategory)) {
      setCategoryTags([...categoryTags, newCategory]);
      setNewCategory('');
    }
  };

  const removeCategory = (category: string) => {
    setCategoryTags(categoryTags.filter(c => c !== category));
  };

  const addSupplierType = () => {
    if (newSupplierType && !supplierTypes.includes(newSupplierType)) {
      setSupplierTypes([...supplierTypes, newSupplierType]);
      setNewSupplierType('');
    }
  };

  const removeSupplierType = (type: string) => {
    setSupplierTypes(supplierTypes.filter(t => t !== type));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Payment Terms & Reminders
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Default Payment Terms</Label>
              <Select 
                value={supplierData.defaultPaymentTerms} 
                onValueChange={(value) => setSupplierData(prev => ({ ...prev, defaultPaymentTerms: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentTermOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Default Reminder Frequency</Label>
              <Select 
                value={supplierData.defaultReminderFrequency} 
                onValueChange={(value) => setSupplierData(prev => ({ ...prev, defaultReminderFrequency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reminderOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Category Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {categoryTags.map((category) => (
              <Badge key={category} variant="secondary" className="flex items-center gap-1">
                {category}
                <X 
                  className="w-3 h-3 cursor-pointer hover:text-red-500" 
                  onClick={() => removeCategory(category)}
                />
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add category tag"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCategory()}
            />
            <Button onClick={addCategory} variant="outline">Add</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Supplier Types
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {supplierTypes.map((type) => (
              <Badge key={type} variant="secondary" className="flex items-center gap-1">
                {type}
                <X 
                  className="w-3 h-3 cursor-pointer hover:text-red-500" 
                  onClick={() => removeSupplierType(type)}
                />
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add supplier type"
              value={newSupplierType}
              onChange={(e) => setNewSupplierType(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSupplierType()}
            />
            <Button onClick={addSupplierType} variant="outline">Add</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Quick Setup Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Food Supplier Template</h4>
              <p className="text-sm text-gray-500 mb-3">Pre-configured for food suppliers with 14-day terms</p>
              <Button variant="outline" size="sm">Apply Template</Button>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Service Provider Template</h4>
              <p className="text-sm text-gray-500 mb-3">Pre-configured for service providers with 30-day terms</p>
              <Button variant="outline" size="sm">Apply Template</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="bg-ammos-primary hover:bg-ammos-primary/90">
        Save Supplier Settings
      </Button>
    </div>
  );
};