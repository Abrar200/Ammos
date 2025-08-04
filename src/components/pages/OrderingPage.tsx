import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Plus, History, TrendingUp } from 'lucide-react';
import { OrderCreationWorkflow } from '../ordering/OrderCreationWorkflow';
import { OrderHistory } from '../ordering/OrderHistory';

export const OrderingPage = () => {
  const [activeTab, setActiveTab] = useState('create');

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <ShoppingCart className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Ordering System</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Order
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Order History
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <OrderCreationWorkflow />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <OrderHistory />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Analytics dashboard showing order trends, supplier performance, and cost savings will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};