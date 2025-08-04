import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  selectedSupplier?: {
    id: string;
    name: string;
    price: number;
  };
  alternatives: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  notes?: string;
}

interface PriceComparisonTableProps {
  orderItems: OrderItem[];
  setOrderItems: (items: OrderItem[]) => void;
}

export const PriceComparisonTable = ({ orderItems, setOrderItems }: PriceComparisonTableProps) => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [priceLists, setPriceLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSupplierData();
  }, []);

  useEffect(() => {
    if (priceLists.length > 0 && orderItems.length > 0) {
      updatePriceComparisons();
    }
  }, [priceLists, orderItems]);

  const loadSupplierData = async () => {
    try {
      const [suppliersRes, priceListsRes] = await Promise.all([
        supabase.from('suppliers').select('*'),
        supabase.from('supplier_price_lists').select('*')
      ]);

      if (suppliersRes.error) throw suppliersRes.error;
      if (priceListsRes.error) throw priceListsRes.error;

      setSuppliers(suppliersRes.data || []);
      setPriceLists(priceListsRes.data || []);
    } catch (error) {
      console.error('Error loading supplier data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePriceComparisons = () => {
    const updatedItems = orderItems.map(item => {
      const alternatives = [];
      
      // Find matching items in price lists
      priceLists.forEach(priceList => {
        const supplier = suppliers.find(s => s.id === priceList.supplier_id);
        if (!supplier) return;

        const items = priceList.items || [];
        const matchingItem = items.find((pItem: any) => 
          pItem.name?.toLowerCase().includes(item.name.toLowerCase()) ||
          item.name.toLowerCase().includes(pItem.name?.toLowerCase())
        );

        if (matchingItem) {
          alternatives.push({
            id: supplier.id,
            name: supplier.name,
            price: matchingItem.price,
            unit: matchingItem.unit
          });
        }
      });

      // Sort by price (lowest first)
      alternatives.sort((a, b) => a.price - b.price);

      // Auto-select the cheapest option
      const selectedSupplier = alternatives.length > 0 ? alternatives[0] : undefined;

      return {
        ...item,
        alternatives,
        selectedSupplier: item.selectedSupplier || selectedSupplier
      };
    });

    setOrderItems(updatedItems);
  };

  const selectSupplier = (itemId: string, supplier: any) => {
    setOrderItems(orderItems.map(item => 
      item.id === itemId ? { ...item, selectedSupplier: supplier } : item
    ));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    setOrderItems(orderItems.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    ));
  };

  const updateNotes = (itemId: string, notes: string) => {
    setOrderItems(orderItems.map(item => 
      item.id === itemId ? { ...item, notes } : item
    ));
  };

  if (loading) {
    return <div className="text-center py-8">Loading price comparisons...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Price Comparison</h3>
        <Badge variant="secondary">
          {orderItems.filter(item => item.selectedSupplier).length} / {orderItems.length} items priced
        </Badge>
      </div>

      {orderItems.map(item => (
        <Card key={item.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{item.name}</CardTitle>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-sm text-gray-500">{item.unit}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {item.alternatives.length === 0 ? (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">No suppliers found for this item</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Available Suppliers:</div>
                <div className="grid gap-2">
                  {item.alternatives.map((supplier, index) => (
                    <div
                      key={supplier.id}
                      className={`flex items-center justify-between p-3 border rounded cursor-pointer transition-colors ${
                        item.selectedSupplier?.id === supplier.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => selectSupplier(item.id, supplier)}
                    >
                      <div className="flex items-center gap-3">
                        {item.selectedSupplier?.id === supplier.id && (
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                        )}
                        <div>
                          <div className="font-medium">{supplier.name}</div>
                          {index === 0 && (
                            <Badge variant="secondary" className="text-xs">Best Price</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${supplier.price.toFixed(2)}</div>
                        <div className="text-sm text-gray-500">per {supplier.unit || item.unit}</div>
                        <div className="text-sm font-medium">
                          Total: ${(supplier.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700">Notes (Optional)</label>
              <Textarea
                value={item.notes || ''}
                onChange={(e) => updateNotes(item.id, e.target.value)}
                placeholder="Add any special instructions..."
                className="mt-1"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};