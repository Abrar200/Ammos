import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Mail, DollarSign, Calendar } from 'lucide-react';
import type { Supplier } from '@/types/supplier';

interface SupplierListProps {
  suppliers: Supplier[];
}

export const SupplierList = ({ suppliers }: SupplierListProps) => {
  const getFrequencyColor = (frequency: string) => {
    switch (frequency.toLowerCase()) {
      case 'weekly': return 'bg-green-100 text-green-800';
      case 'monthly': return 'bg-blue-100 text-blue-800';
      case 'quarterly': return 'bg-purple-100 text-purple-800';
      case 'annually': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'food & beverage': return 'bg-emerald-100 text-emerald-800';
      case 'beverages': return 'bg-blue-100 text-blue-800';
      case 'equipment': return 'bg-slate-100 text-slate-800';
      case 'cleaning': return 'bg-cyan-100 text-cyan-800';
      case 'utilities': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Recent Suppliers</span>
          <Badge variant="outline">{suppliers.length} suppliers</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {suppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-gray-900">{supplier.name}</h4>
                  <Badge className={getTypeColor(supplier.type)}>
                    {supplier.type}
                  </Badge>
                  <Badge className={getFrequencyColor(supplier.frequency)}>
                    {supplier.frequency}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {supplier.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      <span>{supplier.email}</span>
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                </div>

                {supplier.tags && supplier.tags.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {supplier.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {supplier.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{supplier.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1 text-lg font-bold text-gray-900">
                  <DollarSign className="h-5 w-5" />
                  {supplier.amount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-sm text-gray-600">per {supplier.frequency}</p>
                <p className="text-xs text-gray-500 mt-1">
                  ${supplier.monthlyTotal.toLocaleString('en-AU')} / month
                </p>
              </div>
            </div>
          ))}

          {suppliers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No suppliers found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};