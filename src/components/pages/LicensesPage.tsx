import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import AddLicenceDialog from '@/components/AddLicenceDialog';
import EditLicenseDialog from '@/components/EditLicenseDialog';
import { Plus, FileText, AlertTriangle, CheckCircle, Clock, Trash2, Download, Eye, Bell, Edit } from 'lucide-react';

interface License {
  id: string;
  licence_name: string;
  licence_type: string;
  licence_number: string;
  issuing_authority: string;
  issue_date: string;
  expiry_date: string;
  status: 'Active' | 'Expired' | 'Pending' | 'Suspended';
  cost?: number;
  renewal_frequency?: string;
  document_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchLicences();
  }, []);

  const fetchLicences = async () => {
    try {
      const { data, error } = await supabase
        .from('licences')
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

  const handleEdit = (license: License) => {
    setSelectedLicense(license);
    setIsEditDialogOpen(true);
  };

  const deleteLicence = async (id: string) => {
    try {
      const licence = licenses.find(l => l.id === id);
      if (licence?.document_url) {
        const urlParts = licence.document_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `licences/${fileName}`;
        
        await supabase.storage
          .from('documents')
          .remove([filePath]);
      }

      const { error } = await supabase
        .from('licences')
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

  const viewDocument = (documentUrl: string) => {
    window.open(documentUrl, '_blank');
  };

  const downloadDocument = async (documentUrl: string, licenceName: string) => {
    try {
      const response = await fetch(documentUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${licenceName.replace(/[^a-z0-9]/gi, '_')}_document.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: "Failed to download document",
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

  const getExpiryStatus = (days: number) => {
    if (days <= 0) return 'expired';
    if (days <= 7) return 'critical';
    if (days <= 30) return 'warning';
    return 'ok';
  };

  const activeLicences = licenses.filter(l => l.status === 'Active').length;
  const expiringLicences = licenses.filter(l => {
    const days = getDaysUntilExpiry(l.expiry_date);
    return days <= 30 && days > 0 && l.status === 'Active';
  }).length;
  const expiredLicences = licenses.filter(l => l.status === 'Expired' || getDaysUntilExpiry(l.expiry_date) <= 0).length;

  const urgentReminders = licenses.filter(l => {
    const days = getDaysUntilExpiry(l.expiry_date);
    return days <= 7 && days > 0 && l.status === 'Active';
  });

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

      {/* Urgent Expiry Reminders */}
      {urgentReminders.length > 0 && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <Bell className="h-4 w-4" />
          <AlertTitle className="text-red-800 font-semibold">
            Urgent: {urgentReminders.length} Licence{urgentReminders.length > 1 ? 's' : ''} Expiring Within 7 Days!
          </AlertTitle>
          <AlertDescription className="text-red-700">
            <div className="mt-2 space-y-2">
              {urgentReminders.map(licence => (
                <div key={licence.id} className="flex items-center justify-between p-2 bg-white rounded">
                  <div>
                    <span className="font-medium">{licence.licence_name}</span>
                    <span className="text-sm ml-2">({licence.licence_type})</span>
                  </div>
                  <Badge variant="destructive" className="ml-2">
                    Expires in {getDaysUntilExpiry(licence.expiry_date)} day{getDaysUntilExpiry(licence.expiry_date) !== 1 ? 's' : ''}
                  </Badge>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Expiring Soon Warning (8-30 days) */}
      {expiringLicences > urgentReminders.length && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">
            {expiringLicences - urgentReminders.length} Licence{(expiringLicences - urgentReminders.length) > 1 ? 's' : ''} Expiring Within 30 Days
          </AlertTitle>
          <AlertDescription className="text-yellow-700">
            Review and plan renewals for upcoming expiries.
          </AlertDescription>
        </Alert>
      )}

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
            All Licences & Permits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Licence Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Authority</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reminder</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses.map((license) => {
                const daysUntilExpiry = getDaysUntilExpiry(license.expiry_date);
                const expiryStatus = getExpiryStatus(daysUntilExpiry);
                
                return (
                  <TableRow key={license.id} className={expiryStatus === 'expired' ? 'bg-red-50' : expiryStatus === 'critical' ? 'bg-orange-50' : ''}>
                    <TableCell className="font-medium">{license.licence_name}</TableCell>
                    <TableCell>{license.licence_type}</TableCell>
                    <TableCell>{license.licence_number}</TableCell>
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
                      {expiryStatus === 'expired' ? (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          EXPIRED
                        </Badge>
                      ) : expiryStatus === 'critical' ? (
                        <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                          <Bell className="w-3 h-3" />
                          {daysUntilExpiry} days
                        </Badge>
                      ) : expiryStatus === 'warning' ? (
                        <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {daysUntilExpiry} days
                        </Badge>
                      ) : (
                        <span className="text-gray-500">{daysUntilExpiry} days</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {license.document_url ? (
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewDocument(license.document_url!)}
                            title="View document"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadDocument(license.document_url!, license.licence_name)}
                            title="Download document"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No document</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(license)}
                          title="Edit license"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
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
                                Are you sure you want to delete "{license.licence_name}"? This action cannot be undone and will also delete any associated documents.
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
                      </div>
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

      <EditLicenseDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        license={selectedLicense}
        onSuccess={fetchLicences}
      />
    </div>
  );
}