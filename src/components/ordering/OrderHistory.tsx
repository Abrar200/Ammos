import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Calendar, DollarSign, Package, Copy, Eye } from 'lucide-react';

interface OrderHistoryProps {
  onDuplicateOrder?: (orderId: string) => void;
}

export const OrderHistory = ({ onDuplicateOrder }: OrderHistoryProps) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    loadOrderHistory();
  }, []);

  const loadOrderHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            suppliers (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading order history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const viewOrderDetails = (order: any) => {
    setSelectedOrder(order);
  };

  if (loading) {
    return <div className="text-center py-8">Loading order history...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Order History</h3>
        <Badge variant="secondary">{orders.length} orders</Badge>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No orders found. Create your first order!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map(order => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{order.order_name}</CardTitle>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div className="text-sm">
                      <div className="text-gray-500">Delivery</div>
                      <div className="font-medium">
                        {order.delivery_date ? 
                          new Date(order.delivery_date).toLocaleDateString() : 
                          'Not set'
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <div className="text-sm">
                      <div className="text-gray-500">Total</div>
                      <div className="font-medium">${order.total_amount?.toFixed(2) || '0.00'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-500" />
                    <div className="text-sm">
                      <div className="text-gray-500">Items</div>
                      <div className="font-medium">{order.order_items?.length || 0}</div>
                    </div>
                  </div>
                  
                  {order.total_savings > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="text-sm">
                        <div className="text-green-600">Saved</div>
                        <div className="font-medium text-green-600">
                          ${order.total_savings.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewOrderDetails(order)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  
                  {onDuplicateOrder && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDuplicateOrder(order.id)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Order Details Modal would go here */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedOrder.order_name}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOrder(null)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedOrder.order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <div className="font-medium">{item.item_name}</div>
                      <div className="text-sm text-gray-500">
                        {item.quantity} {item.unit} from {item.suppliers?.name}
                      </div>
                      {item.notes && (
                        <div className="text-xs text-gray-400">{item.notes}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${item.total_price?.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">
                        ${item.unit_price?.toFixed(2)} per {item.unit}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};