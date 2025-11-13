import { useState, useEffect } from 'react';
import { Search, Edit2, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AddSupplierDialog } from '@/components/AddSupplierDialog';
import { EditSupplierDialog } from '@/components/EditSupplierDialog';
import { supabase } from '@/lib/supabase';
import { Supplier } from '@/types/supplier';
import { useNavigate } from 'react-router-dom';

export const SuppliersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const navigate = useNavigate();

  // Get unique categories from suppliers
  const categories = ['all', ...Array.from(new Set(suppliers
    .map(s => s.supplier_type?.toLowerCase())
    .filter(Boolean)
  )) as string[]];
  

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

  const handleOptimisticAdd = (newSupplier: Supplier) => {
    setSuppliers(current => [newSupplier, ...current]);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
  };

  const handleSupplierUpdated = () => {
    fetchSuppliers();
    setEditingSupplier(null);
  };

  const handleDelete = async (supplierId: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    
    setDeletingId(supplierId);
    
    // Optimistic update - remove immediately
    const originalSuppliers = [...suppliers];
    setSuppliers(current => current.filter(s => s.id !== supplierId));

    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting supplier:', error);
      // Revert on error
      setSuppliers(originalSuppliers);
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewProducts = (supplierId: string, supplierName: string) => {
    navigate('/ordering', { 
      state: { 
        supplierFilter: supplierId,
        supplierName: supplierName
      }
    });
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           supplier.supplier_type?.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading suppliers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-600 mt-1">Manage your supplier relationships</p>
        </div>
        <AddSupplierDialog 
          onSupplierAdded={fetchSuppliers} 
          onOptimisticUpdate={handleOptimisticAdd}
        />
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
              {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{suppliers.length}</div>
            <p className="text-xs text-gray-600">Total Suppliers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              ${suppliers.reduce((sum, s) => sum + (s.monthly_total || 0), 0).toFixed(0)}
            </div>
            <p className="text-xs text-gray-600">Monthly Cost</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {suppliers.filter(s => s.supplier_type === 'food').length}
            </div>
            <p className="text-xs text-gray-600">Food Suppliers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {suppliers.filter(s => s.payment_frequency === 'Weekly').length}
            </div>
            <p className="text-xs text-gray-600">Weekly Payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map((supplier) => (
          <Card key={supplier.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
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
                    <Badge variant="secondary" className="mt-1">
                      {supplier.supplier_type || 'Uncategorized'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEdit(supplier)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDelete(supplier.id)}
                    disabled={deletingId === supplier.id}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
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
                  <span className="text-sm font-medium">{supplier.payment_frequency || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Amount per Period:</span>
                  <span className="text-sm font-medium">${supplier.amount_per_period?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Monthly Cost:</span>
                  <span className="text-sm font-medium text-blue-600">
                    ${supplier.monthly_total?.toFixed(2) || '0.00'}
                  </span>
                </div>
                {supplier.email && (
                  <div className="text-xs text-gray-500 truncate">
                    📧 {supplier.email}
                  </div>
                )}
                {supplier.phone && (
                  <div className="text-xs text-gray-500">
                    📞 {supplier.phone}
                  </div>
                )}
                {supplier.address && (
                  <div className="text-xs text-gray-500">
                    📍 {supplier.address}
                  </div>
                )}
                
                {supplier.notes && (
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    <strong>Notes:</strong> {supplier.notes}
                  </div>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4"
                  onClick={() => handleViewProducts(supplier.id, supplier.name)}
                >
                  View Products
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

      {/* Edit Supplier Dialog */}
      {editingSupplier && (
        <EditSupplierDialog
          supplier={editingSupplier}
          open={!!editingSupplier}
          onClose={() => setEditingSupplier(null)}
          onSupplierUpdated={handleSupplierUpdated}
        />
      )}
    </div>
  );
};