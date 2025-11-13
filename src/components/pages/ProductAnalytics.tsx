import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, DollarSign, Package, Users, BarChart3 } from 'lucide-react';
import { ExpenseChart } from '../ExpenseChart';

interface CategoryData {
  count: number;
  totalValue: number;
}

interface SupplierData {
  count: number;
  totalValue: number;
}

interface Product {
  id: string;
  supplier_id: string;
  category_id: string;
  cost_per_unit: number;
  suppliers: { name: string } | null;
  product_categories: { name: string } | null;
  is_active: boolean;
}

interface AnalyticsData {
  totalProducts: number;
  totalSuppliers: number;
  totalCategories: number;
  totalValue: number;
  categoryData: Array<{ name: string; amount: number; value: number }>;
  supplierData: Array<{ name: string; amount: number; value: number }>;
  productsByCategory: Record<string, CategoryData>;
  productsBySupplier: Record<string, SupplierData>;
}

export const ProductAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch products with supplier and category info
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          suppliers(name),
          product_categories(name)
        `)
        .eq('is_active', true);

      if (productsError) throw productsError;

      const productList = products as Product[];

      // Calculate analytics
      const totalProducts = productList?.length || 0;
      const totalSuppliers = new Set(productList?.map(p => p.supplier_id)).size;
      const totalCategories = new Set(productList?.map(p => p.category_id)).size;
      
      // Calculate total inventory value
      const totalValue = productList?.reduce((sum, product) => sum + product.cost_per_unit, 0) || 0;

      // Group by category
      const categoryData = productList?.reduce((acc: Record<string, CategoryData>, product) => {
        const category = product.product_categories?.name || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = { count: 0, totalValue: 0 };
        }
        acc[category].count++;
        acc[category].totalValue += product.cost_per_unit;
        return acc;
      }, {});

      const categoryChartData = Object.entries(categoryData || {}).map(([name, data]) => ({
        name,
        amount: data.count,
        value: data.totalValue
      }));

      // Group by supplier
      const supplierData = productList?.reduce((acc: Record<string, SupplierData>, product) => {
        const supplier = product.suppliers?.name || 'Unknown Supplier';
        if (!acc[supplier]) {
          acc[supplier] = { count: 0, totalValue: 0 };
        }
        acc[supplier].count++;
        acc[supplier].totalValue += product.cost_per_unit;
        return acc;
      }, {});

      const supplierChartData = Object.entries(supplierData || {})
        .map(([name, data]) => ({
          name,
          amount: data.count,
          value: data.totalValue
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10); // Top 10 suppliers

      setAnalytics({
        totalProducts,
        totalSuppliers,
        totalCategories,
        totalValue,
        categoryData: categoryChartData,
        supplierData: supplierChartData,
        productsByCategory: categoryData || {},
        productsBySupplier: supplierData || {}
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load product analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">No analytics data available</h2>
        <p className="text-gray-600 mt-2">Add some products to see analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Active products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSuppliers}</div>
            <p className="text-xs text-muted-foreground">Active suppliers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCategories}</div>
            <p className="text-xs text-muted-foreground">Product categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Inventory value</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Products by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.categoryData.length > 0 ? (
              <div style={{ height: '300px' }}>
                <ExpenseChart 
                  data={analytics.categoryData} 
                  title=""
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No category data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Suppliers by Product Count</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.supplierData.length > 0 ? (
              <div style={{ height: '300px' }}>
                <ExpenseChart 
                  data={analytics.supplierData} 
                  title=""
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No supplier data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Product Count</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Average Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(analytics.productsByCategory).map(([category, data]) => {
                  const categoryData = data as CategoryData;
                  return (
                    <TableRow key={category}>
                      <TableCell className="font-medium">
                        <Badge variant="outline">
                          {category}
                        </Badge>
                      </TableCell>
                      <TableCell>{categoryData.count}</TableCell>
                      <TableCell>${categoryData.totalValue.toFixed(2)}</TableCell>
                      <TableCell>${(categoryData.totalValue / categoryData.count).toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Supplier Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Supplier Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Product Count</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Average Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(analytics.productsBySupplier)
                  .sort(([,a], [,b]) => (b as SupplierData).count - (a as SupplierData).count)
                  .slice(0, 10)
                  .map(([supplier, data]) => {
                    const supplierData = data as SupplierData;
                    return (
                      <TableRow key={supplier}>
                        <TableCell className="font-medium">{supplier}</TableCell>
                        <TableCell>{supplierData.count}</TableCell>
                        <TableCell>${supplierData.totalValue.toFixed(2)}</TableCell>
                        <TableCell>${(supplierData.totalValue / supplierData.count).toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};