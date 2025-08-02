import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AddSupplierDialog } from '@/components/AddSupplierDialog';
import { supabase } from '@/lib/supabase';

interface Supplier {
  id: string;
  name: string;
  type: string;
  frequency: string;
  amount: number;
  monthly_total: number;
  image_url?: string;
  tags?: string[];
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
}

export const SuppliersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = ['all', 'food', 'cleaning', 'software', 'utilities', 'office', 'marketing'];

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || supplier.type.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading suppliers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
        <AddSupplierDialog onSupplierAdded={fetchSuppliers} />
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map((supplier) => (
          <Card key={supplier.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start gap-3">
                {supplier.image_url && (
                  <img 
                    src={supplier.image_url} 
                    alt={supplier.name}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <CardTitle className="text-lg">{supplier.name}</CardTitle>
                  <Badge variant="secondary" className="mt-1">{supplier.type}</Badge>
                </div>
              </div>
              {supplier.tags && supplier.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {supplier.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Payment Frequency:</span>
                  <span className="text-sm font-medium">{supplier.frequency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Amount per Period:</span>
                  <span className="text-sm font-medium">${supplier.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Monthly Cost:</span>
                  <span className="text-sm font-medium">${supplier.monthly_total.toFixed(2)}</span>
                </div>
                {supplier.contact_email && (
                  <div className="text-xs text-gray-500 truncate">
                    📧 {supplier.contact_email}
                  </div>
                )}
                {supplier.contact_phone && (
                  <div className="text-xs text-gray-500">
                    📞 {supplier.contact_phone}
                  </div>
                )}
                <Button variant="outline" size="sm" className="w-full mt-4">
                  View All Payments
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSuppliers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No suppliers found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};