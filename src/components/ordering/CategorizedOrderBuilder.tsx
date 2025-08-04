import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ShoppingCart } from 'lucide-react';
import { ORDER_CATEGORIES, getCategoryIcon, type OrderCategory } from '@/constants/orderCategories';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: OrderCategory;
  notes?: string;
}

interface CategorizedOrderBuilderProps {
  orderItems: OrderItem[];
  setOrderItems: (items: OrderItem[]) => void;
}

export const CategorizedOrderBuilder = ({
  orderItems,
  setOrderItems
}: CategorizedOrderBuilderProps) => {
  const [newItem, setNewItem] = useState({ 
    name: '', 
    quantity: 1, 
    unit: 'kg', 
    category: 'General Items' as OrderCategory 
  });
  
  const [activeCategory, setActiveCategory] = useState<OrderCategory>('Fruit & Veg');

  const addItem = () => {
    if (!newItem.name.trim()) return;
    
    const item: OrderItem = {
      id: Date.now().toString(),
      name: newItem.name,
      quantity: newItem.quantity,
      unit: newItem.unit,
      category: newItem.category,
      notes: ''
    };
    
    setOrderItems([...orderItems, item]);
    setNewItem({ name: '', quantity: 1, unit: 'kg', category: newItem.category });
  };

  const removeItem = (id: string) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: string, value: any) => {
    setOrderItems(orderItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const getItemsByCategory = (category: OrderCategory) => {
    return orderItems.filter(item => item.category === category);
  };

  const getCategoryTotal = (category: OrderCategory) => {
    return getItemsByCategory(category).length;
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as OrderCategory)}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          {ORDER_CATEGORIES.map((category) => (
            <TabsTrigger key={category} value={category} className="text-xs">
              <span className="mr-1">{getCategoryIcon(category)}</span>
              <span className="hidden sm:inline">{category.split(' ')[0]}</span>
              {getCategoryTotal(category) > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {getCategoryTotal(category)}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {ORDER_CATEGORIES.map((category) => (
          <TabsContent key={category} value={category}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{getCategoryIcon(category)}</span>
                  {category}
                  <Badge variant="outline">{getCategoryTotal(category)} items</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Item Form */}
                <div className="p-4 border rounded-lg bg-gray-50">
                  <Label className="text-sm font-medium mb-2 block">Add {category} Item</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder={`${category} item name`}
                      value={newItem.name}
                      onChange={(e) => setNewItem({...newItem, name: e.target.value, category})}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({...newItem, quantity: Number(e.target.value)})}
                      className="w-20"
                    />
                    <Select value={newItem.unit} onValueChange={(value) => setNewItem({...newItem, unit: value})}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="g">g</SelectItem>
                        <SelectItem value="L">L</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="pcs">pcs</SelectItem>
                        <SelectItem value="box">box</SelectItem>
                        <SelectItem value="case">case</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={addItem}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Category Items */}
                <div className="space-y-2">
                  {getItemsByCategory(category).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No {category.toLowerCase()} items added yet</p>
                    </div>
                  ) : (
                    getItemsByCategory(category).map(item => (
                      <div key={item.id} className="flex items-center gap-2 p-3 border rounded-lg">
                        <div className="flex-1">
                          <Input
                            value={item.name}
                            onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                            className="font-medium"
                          />
                        </div>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                          className="w-20"
                        />
                        <span className="text-sm text-gray-500 w-12">{item.unit}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};