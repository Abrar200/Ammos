import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StaffCard } from '@/components/StaffCard';
import { PayrollDialog } from '@/components/PayrollDialog';
import { StaffProfileDialog } from '@/components/StaffProfileDialog';
import { AddStaffDialog } from '@/components/AddStaffDialog';
import { supabase } from '@/lib/supabase';
import { Plus, Search, Users, DollarSign, Clock, TrendingUp, AlertTriangle, Calculator } from 'lucide-react';
import type { Staff, StaffCardData, PayrollRecord, ExpiringCertification } from '@/types/staff';

export const StaffWagesPage = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [expiringCerts, setExpiringCerts] = useState<ExpiringCertification[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [payrollDialogOpen, setPayrollDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [addStaffDialogOpen, setAddStaffDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaff();
    fetchRecentPayroll();
    fetchExpiringCertifications();
  }, []);

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('full_name');

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentPayroll = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll_records')
        .select(`
          *,
          staff!inner (
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Payroll fetch error:', error);
        setPayrollRecords([]);
        return;
      }

      setPayrollRecords(data || []);
    } catch (error) {
      console.error('Error fetching payroll records:', error);
      setPayrollRecords([]);
    }
  };

  const fetchExpiringCertifications = async () => {
    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data, error } = await supabase
        .from('staff_certifications')
        .select(`
          *,
          staff!inner (
            full_name
          )
        `)
        .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .order('expiry_date');

      if (error) {
        console.error('Certifications fetch error:', error);
        setExpiringCerts([]);
        return;
      }

      setExpiringCerts(data || []);
    } catch (error) {
      console.error('Error fetching expiring certifications:', error);
      setExpiringCerts([]);
    }
  };

  const handleStaffUpdate = (updatedStaff: Staff) => {
    console.log('Updating staff in main list:', updatedStaff);
    
    setStaff(prevStaff => 
      prevStaff.map(staffMember => 
        staffMember.id === updatedStaff.id ? updatedStaff : staffMember
      )
    );
  };

  const filteredStaff = staff.filter(member =>
    member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const convertToStaffCardData = (staffMember: Staff): StaffCardData => {
    return {
      id: staffMember.id,
      name: staffMember.full_name,
      email: staffMember.email,
      position: staffMember.position,
      hourly_rate: staffMember.hourly_rate,
      employment_type: staffMember.employment_type,
      image_url: staffMember.avatar_url,
      phone: staffMember.phone,
      is_active: staffMember.is_active
    };
  };

  const handlePayroll = (staffCardData: StaffCardData) => {
    const fullStaffRecord = staff.find(s => s.id === staffCardData.id);
    if (fullStaffRecord) {
      setSelectedStaff(fullStaffRecord);
      setPayrollDialogOpen(true);
    }
  };

  const handleEdit = (staffCardData: StaffCardData) => {
    setSelectedStaffId(staffCardData.id);
    setProfileDialogOpen(true);
  };

  const handleAddStaff = () => {
    setAddStaffDialogOpen(true);
  };

  const handleStaffDelete = (staffId: string) => {
    console.log('Removing staff from main list:', staffId);
    
    setStaff(prevStaff => 
      prevStaff.filter(staffMember => staffMember.id !== staffId)
    );
  };

  // Calculate weekly payroll for current week
  const calculateWeeklyPayroll = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return payrollRecords
      .filter(record => {
        const recordDate = new Date(record.pay_period_start);
        return recordDate >= startOfWeek && recordDate <= endOfWeek;
      })
      .reduce((sum, record) => sum + (record.net_pay || 0), 0);
  };

  const totalStaff = staff.length;
  const weeklyPayroll = calculateWeeklyPayroll();
  const totalPayrollThisMonth = payrollRecords
    .filter(record => new Date(record.created_at).getMonth() === new Date().getMonth())
    .reduce((sum, record) => sum + (record.net_pay || 0), 0);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff & Wages</h1>
          <p className="text-gray-600">Manage your team and process payroll</p>
        </div>
        <Button onClick={handleAddStaff}>
          <Plus className="h-4 w-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      {/* Expiring Certifications Alert */}
      {expiringCerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Expiring Certifications ({expiringCerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringCerts.slice(0, 3).map((cert) => (
                <div key={cert.id} className="flex items-center justify-between text-sm">
                  <span>{cert.staff.full_name} - {cert.certification_type}</span>
                  <span className="text-orange-600">
                    Expires: {new Date(cert.expiry_date).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {expiringCerts.length > 3 && (
                <p className="text-sm text-orange-600">
                  +{expiringCerts.length - 3} more certifications expiring soon
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards - REPLACED Active Staff with Weekly Payroll */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold">{totalStaff}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NEW: Weekly Payroll Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Weekly Payroll</p>
                <p className="text-2xl font-bold">${weeklyPayroll.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Monthly Payroll</p>
                <p className="text-2xl font-bold">${totalPayrollThisMonth.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Expiring Certs</p>
                <p className="text-2xl font-bold">{expiringCerts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search staff by name or position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map((staffMember) => (
          <StaffCard
            key={staffMember.id}
            staff={convertToStaffCardData(staffMember)}
            onPayroll={handlePayroll}
            onEdit={handleEdit}
            onDelete={() => handleStaffDelete(staffMember.id)}
          />
        ))}
      </div>

      {/* Recent Payroll Records */}
      {payrollRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Payroll Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payrollRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{record.staff?.full_name || 'Unknown Staff'}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(record.pay_period_start).toLocaleDateString()} - {new Date(record.pay_period_end).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${(record.net_pay || 0).toFixed(2)}</p>
                    <p className="text-sm text-gray-600">{(record.regular_hours || 0)}h worked</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <PayrollDialog
        staff={selectedStaff}
        open={payrollDialogOpen}
        onOpenChange={setPayrollDialogOpen}
        onSuccess={() => {
          fetchRecentPayroll();
        }}
      />

      <StaffProfileDialog
        isOpen={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        staffId={selectedStaffId}
        onStaffUpdate={handleStaffUpdate}
      />

      <AddStaffDialog
        open={addStaffDialogOpen}
        onOpenChange={setAddStaffDialogOpen}
        onSuccess={fetchStaff}
      />
    </div>
  );
};