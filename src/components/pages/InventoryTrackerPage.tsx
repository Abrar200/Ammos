import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Package, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  purchased: number;
  sold: number;
  cost: number;
  revenue: number;
  yield: number;
  status: 'normal' | 'low-yield' | 'shrinkage';
}

export const InventoryTrackerPage = () => {
  const [inventory] = useState<InventoryItem[]>([
    {
      id: '1',
      name: 'Atlantic Salmon',
      category: 'Seafood',
      purchased: 50,
      sold: 45,
      cost: 450,
      revenue: 675,
      yield: 90,
      status: 'normal'
    },
    {
      id: '2',
      name: 'King Prawns',
      category: 'Seafood',
      purchased: 30,
      sold: 22,
      cost: 380,
      revenue: 440,
      yield: 73,
      status: 'low-yield'
    },
    {
      id: '3',
      name: 'Barramundi',
      category: 'Seafood',
      purchased: 40,
      sold: 32,
      cost: 420,
      revenue: 576,
      yield: 80,
      status: 'shrinkage'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-green-100 text-green-800';
      case 'low-yield': return 'bg-yellow-100 text-yellow-800';
      case 'shrinkage': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal': return <TrendingUp className="h-4 w-4" />;
      case 'low-yield': return <TrendingDown className="h-4 w-4" />;
      case 'shrinkage': return <AlertTriangle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const totalCOGS = inventory.reduce((sum, item) => sum + item.cost, 0);
  const totalRevenue = inventory.reduce((sum, item) => sum + item.revenue, 0);
  const avgYield = inventory.reduce((sum, item) => sum + item.yield, 0) / inventory.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventory Purchase Tracker</h1>
        <p className="text-gray-600 mt-2">Track purchases vs sales and monitor yield performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total COGS</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCOGS.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From tracked items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Yield</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgYield.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Sold vs purchased</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{((totalRevenue - totalCOGS) / totalRevenue * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Gross margin</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>
            Track purchase vs sales performance for key inventory items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inventory.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.category}</p>
                  </div>
                  <Badge className={getStatusColor(item.status)}>
                    {getStatusIcon(item.status)}
                    <span className="ml-1 capitalize">{item.status.replace('-', ' ')}</span>
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Purchased</p>
                    <p className="font-medium">{item.purchased} units</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Sold</p>
                    <p className="font-medium">{item.sold} units</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Cost</p>
                    <p className="font-medium">${item.cost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Revenue</p>
                    <p className="font-medium">${item.revenue.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Yield</p>
                    <p className="font-medium">{item.yield}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Purchase Record</CardTitle>
          <CardDescription>
            Record new inventory purchases manually or sync from POS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Item name" />
            <Input placeholder="Quantity purchased" type="number" />
            <Input placeholder="Total cost" type="number" />
          </div>
          <div className="flex justify-end mt-4">
            <Button>Add Purchase Record</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};