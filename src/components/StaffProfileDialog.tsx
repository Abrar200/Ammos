import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
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
}

interface Certification {
  id: string;
  certification_type: string;
  certification_name: string;
  issue_date?: string;
  expiry_date?: string;
  document_url?: string;
  notes?: string;
  is_verified: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  staffId: string | null;
}

const certificationTypes = [
  'RSA Certificate',
  'Approved Responsible Person',
  'Food Safety Certification',
  'First Aid Certificate',
  'RSG',
  'White Card',
  'WWCC',
  'Employment Contract',
  'CV',
  'Visa Documents',
  'Other'
];

export function StaffProfileDialog({ isOpen, onClose, staffId }: Props) {
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(false);
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
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', staffId)
      .single();

    if (error) {
      toast({ title: 'Error', description: 'Failed to load staff profile', variant: 'destructive' });
    } else {
      setStaff(data);
    }
    setLoading(false);
  };

  const fetchCertifications = async () => {
    if (!staffId) return;
    
    const { data, error } = await supabase
      .from('staff_certifications')
      .select('*')
      .eq('staff_id', staffId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCertifications(data);
    }
  };

  const updateStaff = async (updates: Partial<StaffMember>) => {
    if (!staffId) return;
    
    const { error } = await supabase
      .from('staff')
      .update(updates)
      .eq('id', staffId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update staff profile', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Staff profile updated successfully' });
      fetchStaffProfile();
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

  if (!staff) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              {staff.full_name.split(' ').map(n => n[0]).join('')}
            </div>
            {staff.full_name} - Staff Profile
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input 
                    value={staff.full_name} 
                    onChange={(e) => updateStaff({ full_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input 
                    type="date" 
                    value={staff.date_of_birth || ''} 
                    onChange={(e) => updateStaff({ date_of_birth: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input 
                    value={staff.email} 
                    onChange={(e) => updateStaff({ email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input 
                    value={staff.phone || ''} 
                    onChange={(e) => updateStaff({ phone: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Address</Label>
                  <Input 
                    value={staff.address || ''} 
                    onChange={(e) => updateStaff({ address: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Emergency Contact Name</Label>
                  <Input 
                    value={staff.emergency_contact_name || ''} 
                    onChange={(e) => updateStaff({ emergency_contact_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Emergency Contact Phone</Label>
                  <Input 
                    value={staff.emergency_contact_phone || ''} 
                    onChange={(e) => updateStaff({ emergency_contact_phone: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Employment Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Position</Label>
                  <Input 
                    value={staff.position} 
                    onChange={(e) => updateStaff({ position: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Employment Type</Label>
                  <Select 
                    value={staff.employment_type} 
                    onValueChange={(value) => updateStaff({ employment_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Casual">Casual</SelectItem>
                      <SelectItem value="Part-Time">Part-Time</SelectItem>
                      <SelectItem value="Full-Time">Full-Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input 
                    type="date" 
                    value={staff.start_date || ''} 
                    onChange={(e) => updateStaff({ start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Hourly Rate ($)</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={staff.hourly_rate} 
                    onChange={(e) => updateStaff({ hourly_rate: parseFloat(e.target.value) })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial & Legal Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tax File Number</Label>
                  <Input 
                    value={staff.tax_file_number || ''} 
                    onChange={(e) => updateStaff({ tax_file_number: e.target.value })}
                    placeholder="Admin only"
                  />
                </div>
                <div>
                  <Label>Super Fund Name</Label>
                  <Input 
                    value={staff.super_fund_name || ''} 
                    onChange={(e) => updateStaff({ super_fund_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Super Member Number</Label>
                  <Input 
                    value={staff.super_member_number || ''} 
                    onChange={(e) => updateStaff({ super_member_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Bank Account Name</Label>
                  <Input 
                    value={staff.bank_account_name || ''} 
                    onChange={(e) => updateStaff({ bank_account_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>BSB</Label>
                  <Input 
                    value={staff.bank_bsb || ''} 
                    onChange={(e) => updateStaff({ bank_bsb: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Account Number</Label>
                  <Input 
                    value={staff.bank_account_number || ''} 
                    onChange={(e) => updateStaff({ bank_account_number: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Certifications & Documents
                  <Button size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Add Document
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {certifications.map((cert) => {
                    const status = getCertificationStatus(cert);
                    return (
                      <div key={cert.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="font-medium">{cert.certification_name}</div>
                            <div className="text-sm text-gray-500">{cert.certification_type}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {cert.expiry_date && (
                            <div className="text-sm text-gray-500">
                              Expires: {new Date(cert.expiry_date).toLocaleDateString()}
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