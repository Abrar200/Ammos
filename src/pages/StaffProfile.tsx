import { useParams, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, DollarSign, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CertificationUpload } from '@/components/CertificationUpload';

interface Staff {
  id: string;
  name: string;
  email: string;
  position: string;
  hourly_rate: number;
  employment_type: string;
  image_url?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  start_date?: string;
  tax_file_number?: string;
  super_fund_name?: string;
  super_member_number?: string;
  bank_account_name?: string;
  bank_bsb?: string;
  bank_account_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  is_active: boolean;
}

interface Certification {
  id: string;
  name: string;
  expiry_date: string;
  file_url?: string;
}

export default function StaffProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [certificationDialogOpen, setCertificationDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchStaffData(id);
    }
  }, [id]);

  const fetchStaffData = async (staffId: string) => {
    try {
      const { data: staffData } = await supabase
        .from('staff')
        .select('*')
        .eq('id', staffId)
        .single();

      const { data: certData } = await supabase
        .from('staff_certifications')
        .select('*')
        .eq('staff_id', staffId);

      setStaff(staffData);
      setCertifications(certData || []);
    } catch (error) {
      console.error('Error fetching staff data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!staff) {
    return <div className="p-6">Staff member not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={staff.image_url} alt={staff.name} />
                  <AvatarFallback className="text-xl">
                    {getInitials(staff.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold">{staff.name}</h1>
                  <p className="text-lg text-gray-600">{staff.position}</p>
                  <Badge variant={staff.is_active ? 'default' : 'secondary'} className="mt-2">
                    {staff.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{staff.email}</span>
                  </div>
                  {staff.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{staff.phone}</span>
                    </div>
                  )}
                  {staff.date_of_birth && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>DOB: {new Date(staff.date_of_birth).toLocaleDateString()}</span>
                    </div>
                  )}
                  {staff.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{staff.address}</span>
                    </div>
                  )}
                </div>

                {staff.emergency_contact_name && (
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2">Emergency Contact</h4>
                    <p>{staff.emergency_contact_name}</p>
                    {staff.emergency_contact_phone && (
                      <p className="text-gray-600">{staff.emergency_contact_phone}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employment">
            <Card>
              <CardHeader>
                <CardTitle>Employment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Position</label>
                    <p>{staff.position}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Employment Type</label>
                    <p className="capitalize">{staff.employment_type}</p>
                  </div>
                  {staff.start_date && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Start Date</label>
                      <p>{new Date(staff.start_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span>
                      {staff.employment_type === 'salary' ? 'Salary' : `$${staff.hourly_rate}/hr`}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial">
            <Card>
              <CardHeader>
                <CardTitle>Financial Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {staff.tax_file_number && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tax File Number</label>
                      <p>***-***-{staff.tax_file_number.slice(-3)}</p>
                    </div>
                  )}
                  {staff.super_fund_name && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Super Fund</label>
                      <p>{staff.super_fund_name}</p>
                    </div>
                  )}
                  {staff.super_member_number && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Super Member Number</label>
                      <p>***{staff.super_member_number.slice(-4)}</p>
                    </div>
                  )}
                  {staff.bank_account_name && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Bank Account Name</label>
                      <p>{staff.bank_account_name}</p>
                    </div>
                  )}
                  {staff.bank_bsb && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">BSB</label>
                      <p>{staff.bank_bsb}</p>
                    </div>
                  )}
                  {staff.bank_account_number && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Account Number</label>
                      <p>***{staff.bank_account_number.slice(-4)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certifications">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Certifications & Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <CertificationUpload
                    staffId={staff.id}
                    isOpen={certificationDialogOpen}
                    onClose={() => setCertificationDialogOpen(false)}
                    onSuccess={() => {
                      fetchStaffData(staff.id);
                      setCertificationDialogOpen(false); // close after success
                    }}
                  />
                </CardContent>
              </Card>

              {certifications.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Current Certifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {certifications.map((cert) => (
                        <div key={cert.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-gray-500" />
                            <div>
                              <p className="font-medium">{cert.name}</p>
                              <p className="text-sm text-gray-500">
                                Expires: {new Date(cert.expiry_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {cert.file_url && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={cert.file_url} target="_blank" rel="noopener noreferrer">
                                View
                              </a>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}