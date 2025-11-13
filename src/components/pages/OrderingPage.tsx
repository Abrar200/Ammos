import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Package, TrendingUp, Filter, X } from 'lucide-react';
import { ProductManagement } from '../ProductManagement';
import { ProductAnalytics } from './ProductAnalytics';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLocation } from 'react-router-dom';

export const OrderingPage = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [supplierFilter, setSupplierFilter] = useState<string | null>(null);
  const [supplierName, setSupplierName] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Check if we have supplier filter from navigation
    if (location.state?.supplierFilter) {
      setSupplierFilter(location.state.supplierFilter);
      setSupplierName(location.state.supplierName || null);
    }
  }, [location.state]);

  const clearSupplierFilter = () => {
    setSupplierFilter(null);
    setSupplierName(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShoppingCart className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Ordering System</h1>
        </div>
        
        {/* Supplier Filter Badge */}
        {supplierFilter && (
          <Badge variant="secondary" className="flex items-center gap-2 px-3 py-2">
            <Filter className="w-3 h-3" />
            Showing products from: {supplierName || 'Supplier'}
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={clearSupplierFilter}
            >
              <X className="w-3 h-3" />
            </Button>
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          <ProductManagement supplierFilter={supplierFilter} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <ProductAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};