import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';
import { Send, DollarSign, TrendingDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

interface OrderSummaryProps {
  orderItems: OrderItem[];
  orderName: string;
  deliveryDate: string;
}

export const OrderSummary = ({ orderItems, orderName, deliveryDate }: OrderSummaryProps) => {
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const groupedOrders = useMemo(() => {
    const groups: { [supplierId: string]: any } = {};
    
    orderItems.forEach(item => {
      if (!item.selectedSupplier) return;
      
      const supplierId = item.selectedSupplier.id;
      if (!groups[supplierId]) {
        groups[supplierId] = {
          supplier: item.selectedSupplier,
          items: [],
          total: 0
        };
      }
      
      const itemTotal = item.selectedSupplier.price * item.quantity;
      groups[supplierId].items.push({
        ...item,
        itemTotal
      });
      groups[supplierId].total += itemTotal;
    });
    
    return Object.values(groups);
  }, [orderItems]);

  const totalAmount = useMemo(() => {
    return groupedOrders.reduce((sum, group) => sum + group.total, 0);
  }, [groupedOrders]);

  const potentialSavings = useMemo(() => {
    let maxPossibleCost = 0;
    orderItems.forEach(item => {
      if (item.alternatives.length > 0) {
        const maxPrice = Math.max(...item.alternatives.map(alt => alt.price));
        maxPossibleCost += maxPrice * item.quantity;
      }
    });
    return maxPossibleCost - totalAmount;
  }, [orderItems, totalAmount]);

  const sendOrders = async () => {
    setSending(true);
    try {
      // Save order to database
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_name: orderName,
          delivery_date: deliveryDate,
          total_amount: totalAmount,
          total_savings: potentialSavings,
          status: 'sent'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Save order items
      const orderItemsData = orderItems
        .filter(item => item.selectedSupplier)
        .map(item => ({
          order_id: orderData.id,
          supplier_id: item.selectedSupplier!.id,
          item_name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.selectedSupplier!.price,
          total_price: item.selectedSupplier!.price * item.quantity,
          alternative_suppliers: item.alternatives,
          notes: item.notes
        }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);

      if (itemsError) throw itemsError;

      // Send orders to suppliers
      for (const group of groupedOrders) {
        try {
          await supabase.functions.invoke('send-supplier-orders', {
            body: {
              supplier: group.supplier,
              items: group.items,
              orderName,
              deliveryDate,
              total: group.total
            }
          });
        } catch (error) {
          console.error(`Error sending order to ${group.supplier.name}:`, error);
        }
      }

      toast({
        title: "Orders Sent Successfully!",
        description: `${groupedOrders.length} suppliers have been notified of their orders.`,
      });

    } catch (error) {
      console.error('Error sending orders:', error);
      toast({
        title: "Error",
        description: "Failed to send orders. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Order Summary</h3>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-gray-500">Total Amount</div>
            <div className="text-xl font-bold">${totalAmount.toFixed(2)}</div>
          </div>
          {potentialSavings > 0 && (
            <div className="text-right">
              <div className="text-sm text-green-600 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                Savings
              </div>
              <div className="text-lg font-bold text-green-600">
                ${potentialSavings.toFixed(2)}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {groupedOrders.map((group, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{group.supplier.name}</CardTitle>
                <Badge variant="outline">
                  {group.items.length} item{group.items.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {group.items.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between py-2">
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">
                        {item.quantity} {item.unit} × ${item.selectedSupplier.price.toFixed(2)}
                      </div>
                      {item.notes && (
                        <div className="text-xs text-gray-400 mt-1">
                          Note: {item.notes}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${item.itemTotal.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between font-semibold">
                <span>Subtotal</span>
                <span>${group.total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-gray-600">
          Orders will be sent to {groupedOrders.length} supplier{groupedOrders.length !== 1 ? 's' : ''}
          {deliveryDate && ` for delivery on ${new Date(deliveryDate).toLocaleDateString()}`}
        </div>
        
        <Button 
          onClick={sendOrders} 
          disabled={sending || groupedOrders.length === 0}
          size="lg"
        >
          <Send className="w-4 h-4 mr-2" />
          {sending ? 'Sending...' : 'Send Orders'}
        </Button>
      </div>
    </div>
  );
};