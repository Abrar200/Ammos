import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Trash2, Copy, Check, ChevronsUpDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ORDER_CATEGORIES, getCategoryIcon, type OrderCategory } from '@/constants/orderCategories';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: OrderCategory;
  selectedSupplier?: any;
  alternatives: any[];
  notes?: string;
}

interface OrderListBuilderProps {
  orderItems: OrderItem[];
  setOrderItems: (items: OrderItem[]) => void;
  orderName: string;
  setOrderName: (name: string) => void;
  deliveryDate: string;
  setDeliveryDate: (date: string) => void;
}

export const OrderListBuilder = ({
  orderItems,
  setOrderItems,
  orderName,
  setOrderName,
  deliveryDate,
  setDeliveryDate
}: OrderListBuilderProps) => {
  const [pastOrders, setPastOrders] = useState<any[]>([]);
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, unit: 'kg' });
  const [commonItems, setCommonItems] = useState<string[]>([]);
  const [suggestedItems, setSuggestedItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadPastOrders();
    loadCommonItems();
    loadSuggestedItems();
  }, []);

  const loadPastOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      setPastOrders(data || []);
    } catch (error) {
      console.error('Error loading past orders:', error);
    }
  };

  const loadCommonItems = async () => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('item_name')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get unique item names from past orders
      const uniqueItems = [...new Set(data?.map(item => item.item_name) || [])];
      setCommonItems(uniqueItems.slice(0, 20)); // Limit to 20 most recent unique items
    } catch (error) {
      console.error('Error loading common items:', error);
    }
  };

  const loadSuggestedItems = async () => {
    try {
      // Get frequently ordered items with their average quantities
      const { data, error } = await supabase
        .from('order_items')
        .select('item_name, quantity, unit')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      // Analyze frequency and calculate average quantities
      const itemStats = {};
      data?.forEach(item => {
        if (!itemStats[item.item_name]) {
          itemStats[item.item_name] = {
            name: item.item_name,
            count: 0,
            totalQuantity: 0,
            unit: item.unit,
            lastOrdered: new Date()
          };
        }
        itemStats[item.item_name].count++;
        itemStats[item.item_name].totalQuantity += item.quantity;
      });
      
      // Sort by frequency and get top suggestions
      const suggestions = Object.values(itemStats)
        .filter(item => item.count >= 2) // Items ordered at least twice
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(item => ({
          ...item,
          avgQuantity: Math.round(item.totalQuantity / item.count)
        }));
      
      setSuggestedItems(suggestions);
    } catch (error) {
      console.error('Error loading suggested items:', error);
    }
  };

  const addSuggestedItem = (suggestion: any) => {
    const item: OrderItem = {
      id: Date.now().toString(),
      name: suggestion.name,
      quantity: suggestion.avgQuantity,
      unit: suggestion.unit,
      alternatives: [],
      notes: ''
    };
    
    setOrderItems([...orderItems, item]);
  };

  const selectCommonItem = (itemName: string) => {
    setNewItem({...newItem, name: itemName});
    setOpen(false);
  };
  const addItem = () => {
    if (!newItem.name.trim()) return;
    
    const item: OrderItem = {
      id: Date.now().toString(),
      name: newItem.name,
      quantity: newItem.quantity,
      unit: newItem.unit,
      alternatives: [],
      notes: ''
    };
    
    setOrderItems([...orderItems, item]);
    setNewItem({ name: '', quantity: 1, unit: 'kg' });
  };

  const removeItem = (id: string) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: string, value: any) => {
    setOrderItems(orderItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const duplicateOrder = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);
      
      if (error) throw error;
      
      const duplicatedItems = data.map(item => ({
        id: Date.now().toString() + Math.random(),
        name: item.item_name,
        quantity: item.quantity,
        unit: item.unit,
        alternatives: [],
        notes: item.notes || ''
      }));
      
      setOrderItems(duplicatedItems);
    } catch (error) {
      console.error('Error duplicating order:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="orderName">Order Name</Label>
          <Input
            id="orderName"
            value={orderName}
            onChange={(e) => setOrderName(e.target.value)}
            placeholder="Weekly Order - Week 1"
          />
        </div>
        <div>
          <Label htmlFor="deliveryDate">Delivery Date</Label>
          <Input
            id="deliveryDate"
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
          />
        </div>
      </div>

      {/* Past Orders */}
      {pastOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reuse Past Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {pastOrders.map(order => (
                <Button
                  key={order.id}
                  variant="outline"
                  size="sm"
                  onClick={() => duplicateOrder(order.id)}
                  className="justify-start"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {order.order_name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {/* Suggested Items */}
      {suggestedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Suggested Items (Based on Past Orders)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {suggestedItems.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => addSuggestedItem(suggestion)}
                  className="justify-start p-3 h-auto"
                >
                  <div className="text-left">
                    <div className="font-medium">{suggestion.name}</div>
                    <div className="text-xs text-gray-500">
                      Avg: {suggestion.avgQuantity} {suggestion.unit} • Ordered {suggestion.count}x
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Quick Select from Common Items */}
            {commonItems.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Quick Select from Past Orders</Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                    >
                      {newItem.name || "Select an item..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search items..." />
                      <CommandEmpty>No items found.</CommandEmpty>
                      <CommandGroup>
                        {commonItems.map((item) => (
                          <CommandItem
                            key={item}
                            onSelect={() => selectCommonItem(item)}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                newItem.name === item ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            {item}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}
            
            {/* Manual Item Entry */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Or Add Manually</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Item name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
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
                  </SelectContent>
                </Select>
                <Button onClick={addItem}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Items List */}
      {orderItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Items ({orderItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {orderItems.map(item => (
                <div key={item.id} className="flex items-center gap-2 p-2 border rounded">
                  <Input
                    value={item.name}
                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                    className="flex-1"
                  />
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
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};