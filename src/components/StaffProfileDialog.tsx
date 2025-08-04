import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Upload, FileText, AlertTriangle, CheckCircle, Save, Plus, Eye, Download, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface StaffMember {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  position: string;
  employment_type: string;
  hourly_rate: number;
  date_of_birth?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  start_date?: string;
  tax_file_number?: string;
  super_fund_name?: string;
  super_member_number?: string;
  bank_account_name?: string;
  bank_bsb?: string;
  bank_account_number?: string;
  avatar_url?: string;
  notes?: string;
  is_active: boolean;
}

interface Certification {
  id: string;
  staff_id: string;
  certification_type: string;
  certification_name: string;
  issue_date?: string;
  expiry_date?: string;
  document_url?: string;
  notes?: string;
  is_verified: boolean;
  created_at: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  staffId: string | null;
  onStaffUpdate?: (updatedStaff: StaffMember) => void; // Add callback for updates
}

const CERTIFICATION_TYPES = [
  'RSA Certificate',
  'RCG (Responsible Conduct of Gambling)',
  'Food Safety Certification',
  'First Aid Certificate',
  'White Card',
  'Working with Children Check',
  'Police Check',
  'Visa/Work Rights',
  'Employment Contract',
  'CV/Resume',
  'Other'
];

export function StaffProfileDialog({ isOpen, onClose, staffId, onStaffUpdate }: Props) {
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [newCertification, setNewCertification] = useState({
    certification_type: '',
    certification_name: '',
    issue_date: '',
    expiry_date: '',
    notes: ''
  });
  const [uploadingCert, setUploadingCert] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (staffId && isOpen) {
      fetchStaffProfile();
      fetchCertifications();
    }
  }, [staffId, isOpen]);

  const fetchStaffProfile = async () => {
    if (!staffId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('id', staffId)
        .single();

      if (error) throw error;
      setStaff(data);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast({
        title: 'Error',
        description: 'Failed to load staff profile',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCertifications = async () => {
    if (!staffId) return;

    try {
      const { data, error } = await supabase
        .from('staff_certifications')
        .select('*')
        .eq('staff_id', staffId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCertifications(data || []);
    } catch (error) {
      console.error('Error fetching certifications:', error);
    }
  };

  const updateStaff = async (updates: Partial<StaffMember>) => {
    if (!staffId || !staff) return;

    setSaving(true);
    try {
      const updatedData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('staff')
        .update(updatedData)
        .eq('id', staffId);

      if (error) throw error;

      // Update local state
      const updatedStaff = { ...staff, ...updates };
      setStaff(updatedStaff);

      // Call parent callback to update the main page
      if (onStaffUpdate) {
        onStaffUpdate(updatedStaff);
      }

      toast({
        title: 'Success',
        description: 'Staff profile updated successfully'
      });
    } catch (error) {
      console.error('Error updating staff:', error);
      toast({
        title: 'Error',
        description: 'Failed to update staff profile',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const addCertification = async () => {
    if (!staffId || !newCertification.certification_type || !newCertification.certification_name) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in certification type and name',
        variant: 'destructive'
      });
      return;
    }

    setUploadingCert(true);
    try {
      const { data, error } = await supabase
        .from('staff_certifications')
        .insert([{
          staff_id: staffId,
          certification_type: newCertification.certification_type,
          certification_name: newCertification.certification_name,
          issue_date: newCertification.issue_date || null,
          expiry_date: newCertification.expiry_date || null,
          notes: newCertification.notes || null,
          is_verified: false,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setCertifications(prev => [data, ...prev]);
      setNewCertification({
        certification_type: '',
        certification_name: '',
        issue_date: '',
        expiry_date: '',
        notes: ''
      });

      toast({
        title: 'Success',
        description: 'Certification added successfully'
      });
    } catch (error) {
      console.error('Error adding certification:', error);
      toast({
        title: 'Error',
        description: 'Failed to add certification',
        variant: 'destructive'
      });
    } finally {
      setUploadingCert(false);
    }
  };

  const deleteCertification = async (certId: string) => {
    try {
      const { error } = await supabase
        .from('staff_certifications')
        .delete()
        .eq('id', certId);

      if (error) throw error;

      setCertifications(prev => prev.filter(cert => cert.id !== certId));
      toast({
        title: 'Success',
        description: 'Certification deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting certification:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete certification',
        variant: 'destructive'
      });
    }
  };

  const getCertificationStatus = (cert: Certification) => {
    if (!cert.expiry_date) return 'no-expiry';

    const expiryDate = new Date(cert.expiry_date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring-soon';
    return 'valid';
  };

  const handleInputChange = (field: keyof StaffMember, value: any) => {
    if (staff) {
      setStaff(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const handleSave = () => {
    if (staff) {
      updateStaff(staff);
    }
  };

  const handleClose = () => {
    // Reset states when closing
    setActiveTab('personal');
    setStaff(null);
    setCertifications([]);
    onClose();
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <div className="flex items-center justify-center p-6">
            <div className="text-center">Loading staff profile...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!staff) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                {staff.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{staff.full_name}</h2>
                <p className="text-sm text-gray-500">{staff.position}</p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input
                    value={staff.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={staff.date_of_birth || ''}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={staff.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={staff.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Address</Label>
                  <Input
                    value={staff.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Emergency Contact Name</Label>
                  <Input
                    value={staff.emergency_contact_name || ''}
                    onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Emergency Contact Phone</Label>
                  <Input
                    value={staff.emergency_contact_phone || ''}
                    onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={staff.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employment" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Employment Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Position</Label>
                  <Input
                    value={staff.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Employment Type</Label>
                  <Select
                    value={staff.employment_type}
                    onValueChange={(value) => handleInputChange('employment_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Casual">Casual</SelectItem>
                      <SelectItem value="Part-Time">Part-Time</SelectItem>
                      <SelectItem value="Full-Time">Full-Time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={staff.start_date || ''}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Hourly Rate (AUD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={staff.hourly_rate}
                    onChange={(e) => handleInputChange('hourly_rate', parseFloat(e.target.value))}
                  />
                </div>
                <div className="col-span-2 flex items-center space-x-2">
                  <Switch
                    checked={staff.is_active}
                    onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                  />
                  <Label>Active Staff Member</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial & Legal Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tax File Number</Label>
                  <Input
                    value={staff.tax_file_number || ''}
                    onChange={(e) => handleInputChange('tax_file_number', e.target.value)}
                    placeholder="123-456-789"
                  />
                </div>
                <div>
                  <Label>Super Fund Name</Label>
                  <Input
                    value={staff.super_fund_name || ''}
                    onChange={(e) => handleInputChange('super_fund_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Super Member Number</Label>
                  <Input
                    value={staff.super_member_number || ''}
                    onChange={(e) => handleInputChange('super_member_number', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Bank Account Name</Label>
                  <Input
                    value={staff.bank_account_name || ''}
                    onChange={(e) => handleInputChange('bank_account_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label>BSB</Label>
                  <Input
                    value={staff.bank_bsb || ''}
                    onChange={(e) => handleInputChange('bank_bsb', e.target.value)}
                    placeholder="123-456"
                  />
                </div>
                <div>
                  <Label>Account Number</Label>
                  <Input
                    value={staff.bank_account_number || ''}
                    onChange={(e) => handleInputChange('bank_account_number', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certifications" className="space-y-4 mt-4">
            {/* Add New Certification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Certification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Certification Type</Label>
                    <Select
                      value={newCertification.certification_type}
                      onValueChange={(value) => setNewCertification(prev => ({ ...prev, certification_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {CERTIFICATION_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Certification Name</Label>
                    <Input
                      value={newCertification.certification_name}
                      onChange={(e) => setNewCertification(prev => ({ ...prev, certification_name: e.target.value }))}
                      placeholder="e.g., RSA Certificate"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Issue Date</Label>
                    <Input
                      type="date"
                      value={newCertification.issue_date}
                      onChange={(e) => setNewCertification(prev => ({ ...prev, issue_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Expiry Date</Label>
                    <Input
                      type="date"
                      value={newCertification.expiry_date}
                      onChange={(e) => setNewCertification(prev => ({ ...prev, expiry_date: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={newCertification.notes}
                    onChange={(e) => setNewCertification(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>
                <Button onClick={addCertification} disabled={uploadingCert}>
                  {uploadingCert ? 'Adding...' : 'Add Certification'}
                </Button>
              </CardContent>
            </Card>

            {/* Existing Certifications */}
            <Card>
              <CardHeader>
                <CardTitle>Current Certifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {certifications.map((cert) => {
                    const status = getCertificationStatus(cert);
                    return (
                      <div key={cert.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="font-medium">{cert.certification_name}</div>
                            <div className="text-sm text-gray-500">{cert.certification_type}</div>
                            {cert.issue_date && (
                              <div className="text-xs text-gray-400">
                                Issued: {new Date(cert.issue_date).toLocaleDateString()}
                              </div>
                            )}
                            {cert.notes && (
                              <div className="text-xs text-gray-600 mt-1">{cert.notes}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {cert.expiry_date && (
                            <div className="text-sm text-gray-500 text-right">
                              <div>Expires:</div>
                              <div>{new Date(cert.expiry_date).toLocaleDateString()}</div>
                            </div>
                          )}
                          <Badge variant={
                            status === 'expired' ? 'destructive' :
                              status === 'expiring-soon' ? 'secondary' : 'default'
                          }>
                            {status === 'expired' && <AlertTriangle className="w-3 h-3 mr-1" />}
                            {status === 'valid' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {status === 'expired' ? 'Expired' :
                              status === 'expiring-soon' ? 'Expiring Soon' :
                                status === 'valid' ? 'Valid' : 'No Expiry'}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteCertification(cert.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {certifications.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No certifications uploaded yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}