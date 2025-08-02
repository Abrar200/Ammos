import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import AddLicenceDialog from '@/components/AddLicenceDialog';
import { Plus, FileText, AlertTriangle, CheckCircle, Clock, Trash2 } from 'lucide-react';

interface License {
  id: string;
  license_type: string;
  license_number: string;
  issuing_authority: string;
  start_date: string;
  expiry_date: string;
  status: 'Active' | 'Expired' | 'Pending' | 'Suspended';
  document_url?: string;
  notes?: string;
}

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLicences();
  }, []);

  const fetchLicences = async () => {
    try {
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .order('expiry_date', { ascending: true });

      if (error) throw error;
      setLicenses(data || []);
    } catch (error) {
      console.error('Error fetching licences:', error);
      toast({
        title: "Error",
        description: "Failed to fetch licences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteLicence = async (id: string) => {
    try {
      const { error } = await supabase
        .from('licenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Licence deleted successfully",
      });

      fetchLicences();
    } catch (error) {
      console.error('Error deleting licence:', error);
      toast({
        title: "Error",
        description: "Failed to delete licence",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Expired': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'Pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-grey-500" />;
    }
  };

  const getStatusColour = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Expired': return 'bg-red-100 text-red-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-grey-100 text-grey-800';
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const activeLicences = licenses.filter(l => l.status === 'Active').length;
  const expiringLicences = licenses.filter(l => {
    const days = getDaysUntilExpiry(l.expiry_date);
    return days <= 30 && days > 0;
  }).length;
  const expiredLicences = licenses.filter(l => l.status === 'Expired' || getDaysUntilExpiry(l.expiry_date) <= 0).length;

  if (loading) {
    return <div className="p-6">Loading licences...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Licences & Permits</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Licence
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Licences</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLicences}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringLicences}</div>
            <p className="text-xs text-muted-foreground">Within 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiredLicences}</div>
          </CardContent>
        </Card>
      </div>

      {/* Licences Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            All Licences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Licence Type</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Authority</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Days Until Expiry</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses.map((license) => {
                const daysUntilExpiry = getDaysUntilExpiry(license.expiry_date);
                return (
                  <TableRow key={license.id}>
                    <TableCell className="font-medium">{license.license_type}</TableCell>
                    <TableCell>{license.license_number}</TableCell>
                    <TableCell>{license.issuing_authority}</TableCell>
                    <TableCell>{new Date(license.expiry_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColour(license.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(license.status)}
                          {license.status}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={daysUntilExpiry <= 30 && daysUntilExpiry > 0 ? 'text-yellow-600 font-medium' : 
                                     daysUntilExpiry <= 0 ? 'text-red-600 font-medium' : ''}>
                        {daysUntilExpiry <= 0 ? 'EXPIRED' : `${daysUntilExpiry} days`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Licence</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this licence? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteLicence(license.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddLicenceDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={fetchLicences}
      />
    </div>
  );
}