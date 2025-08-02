import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, Download, Calendar, CheckCircle, AlertTriangle, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  description: string;
}

interface PlanFeature {
  name: string;
  included: boolean;
}

export const BillingSettings: React.FC = () => {
  const { toast } = useToast();
  const [currentPlan] = useState({
    name: 'Professional',
    price: 149,
    billingCycle: 'monthly',
    nextBilling: '2024-02-15',
    features: [
      { name: 'Unlimited Users', included: true },
      { name: 'Advanced Analytics', included: true },
      { name: 'API Access', included: true },
      { name: 'Priority Support', included: true },
      { name: 'Custom Integrations', included: false },
      { name: 'White Label', included: false },
    ] as PlanFeature[],
  });

  const [invoices] = useState<Invoice[]>([
    {
      id: 'INV-2024-001',
      date: '2024-01-15',
      amount: 149.00,
      status: 'paid',
      description: 'Professional Plan - January 2024',
    },
    {
      id: 'INV-2023-012',
      date: '2023-12-15',
      amount: 149.00,
      status: 'paid',
      description: 'Professional Plan - December 2023',
    },
    {
      id: 'INV-2023-011',
      date: '2023-11-15',
      amount: 149.00,
      status: 'paid',
      description: 'Professional Plan - November 2023',
    },
  ]);

  const handleUpgrade = () => {
    toast({
      title: "Upgrade Initiated",
      description: "You'll be redirected to complete the upgrade process.",
    });
  };

  const handleDowngrade = () => {
    toast({
      title: "Downgrade Request",
      description: "Your plan will be downgraded at the end of the current billing cycle.",
    });
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    toast({
      title: "Download Started",
      description: `Invoice ${invoiceId} is being prepared for download.`,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Calendar },
      overdue: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;
    return (
      <Badge variant="secondary" className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Current Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-ammos-primary">{currentPlan.name} Plan</h3>
              <p className="text-gray-600">
                ${currentPlan.price}/{currentPlan.billingCycle}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Next billing: {currentPlan.nextBilling}
              </p>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Active
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Plan Features</h4>
              <div className="space-y-2">
                {currentPlan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {feature.included ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span className={feature.included ? 'text-gray-900' : 'text-gray-400'}>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Plan Management</h4>
              <div className="space-y-2">
                <Button 
                  onClick={handleUpgrade}
                  className="w-full bg-ammos-primary hover:bg-ammos-primary/90"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Upgrade to Enterprise
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDowngrade}
                  className="w-full"
                >
                  Downgrade Plan
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono">{invoice.id}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>{invoice.description}</TableCell>
                  <TableCell className="font-medium">
                    ${invoice.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadInvoice(invoice.id)}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-sm text-gray-600">Expires 12/25</p>
              </div>
            </div>
            <Button variant="outline">
              Update
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-ammos-secondary rounded-lg">
              <h3 className="font-medium text-ammos-primary">Active Users</h3>
              <p className="text-2xl font-bold mt-1">3 / Unlimited</p>
            </div>
            <div className="p-4 bg-ammos-secondary rounded-lg">
              <h3 className="font-medium text-ammos-primary">API Calls</h3>
              <p className="text-2xl font-bold mt-1">1,247 / 10,000</p>
            </div>
            <div className="p-4 bg-ammos-secondary rounded-lg">
              <h3 className="font-medium text-ammos-primary">Storage Used</h3>
              <p className="text-2xl font-bold mt-1">2.4GB / 50GB</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};