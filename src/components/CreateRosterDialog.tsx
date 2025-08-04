import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { emailService } from '@/lib/emailService';
import { Calendar, Plus, Users, Clock, Mail, Send, Trash2 } from 'lucide-react';

interface Staff {
  id: string;
  full_name: string;
  email: string;
  position: string;
  hourly_rate: number;
  is_active: boolean;
}

interface Shift {
  tempId: string;
  staffId: string;
  staffName: string;
  staffEmail: string;
  staffRate: number;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  breakMinutes: number;
  notes: string;
  totalHours: number;
  totalCost: number;
}

interface CreateRosterDialogProps {
  onRosterCreated: (newRoster?: any) => void;
}

const LOCATIONS = [
  'Main Restaurant',
  'Bar Area',
  'Kitchen',
  'Reception/Host',
  'Outdoor Dining',
  'Private Dining',
  'Storage/Back Area'
];

const ROSTER_TYPES = [
  'Weekly',
  'Fortnightly',
  'Monthly',
  'Special Event',
  'Holiday Period'
];

export const CreateRosterDialog = ({ onRosterCreated }: CreateRosterDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [sendEmails, setSendEmails] = useState(true);
  const [sendingEmails, setSendingEmails] = useState(false);
  const { toast } = useToast();

  const [rosterData, setRosterData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    type: 'Weekly',
    isPublished: false,
    isHoliday: false,
    notes: ''
  });

  const [newShift, setNewShift] = useState({
    staffId: '',
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    location: 'Main Restaurant',
    breakMinutes: 30,
    notes: ''
  });

  useEffect(() => {
    if (open) {
      fetchStaff();
      setDefaultDates();
    }
  }, [open]);

  const fetchStaff = async () => {
    try {
      console.log('🔄 Fetching staff for roster creation...');
      
      const { data, error } = await supabase
        .from('staff')
        .select('id, full_name, email, position, hourly_rate, is_active')
        .eq('is_active', true)
        .order('full_name');

      if (error) {
        console.error('❌ Error fetching staff:', error);
        throw error;
      }
      
      console.log('✅ Fetched staff:', data);
      setStaff(data || []);
    } catch (error) {
      console.error('💥 Error fetching staff:', error);
      toast({
        title: 'Error',
        description: 'Failed to load staff members',
        variant: 'destructive'
      });
    }
  };

  const setDefaultDates = () => {
    const today = new Date();
    const nextMonday = new Date(today);
    const daysUntilMonday = ((1 + 7 - today.getDay()) % 7) || 7;
    nextMonday.setDate(today.getDate() + daysUntilMonday);

    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextMonday.getDate() + 6);

    setRosterData(prev => ({
      ...prev,
      startDate: nextMonday.toISOString().split('T')[0],
      endDate: nextSunday.toISOString().split('T')[0],
      name: `Week of ${nextMonday.toLocaleDateString()}`
    }));
  };

  const calculateShiftHours = (startTime: string, endTime: string, breakMinutes: number): number => {
    if (!startTime || !endTime) return 0;

    const start = new Date(`2000-01-01T${startTime}`);
    let end = new Date(`2000-01-01T${endTime}`);

    // Handle overnight shifts
    if (end <= start) {
      end.setDate(end.getDate() + 1);
    }

    const diffMs = end.getTime() - start.getTime();
    const totalMinutes = diffMs / (1000 * 60);
    const workMinutes = totalMinutes - breakMinutes;

    return Math.max(0, workMinutes / 60);
  };

  const addShift = () => {
    if (!newShift.staffId || !newShift.date) {
      toast({
        title: 'Validation Error',
        description: 'Please select staff member and date',
        variant: 'destructive'
      });
      return;
    }

    const selectedStaff = staff.find(s => s.id === newShift.staffId);
    if (!selectedStaff) return;

    const totalHours = calculateShiftHours(newShift.startTime, newShift.endTime, newShift.breakMinutes);
    const totalCost = totalHours * selectedStaff.hourly_rate;

    const shift: Shift = {
      tempId: Date.now().toString(),
      staffId: newShift.staffId,
      staffName: selectedStaff.full_name,
      staffEmail: selectedStaff.email,
      staffRate: selectedStaff.hourly_rate,
      date: newShift.date,
      startTime: newShift.startTime,
      endTime: newShift.endTime,
      location: newShift.location,
      breakMinutes: newShift.breakMinutes,
      notes: newShift.notes,
      totalHours,
      totalCost
    };

    setShifts(prev => [...prev, shift]);

    // Reset form
    setNewShift({
      staffId: '',
      date: '',
      startTime: '09:00',
      endTime: '17:00',
      location: 'Main Restaurant',
      breakMinutes: 30,
      notes: ''
    });

    console.log('✅ Added shift:', shift);
    toast({
      title: 'Shift Added',
      description: `Added ${totalHours.toFixed(1)}h shift for ${selectedStaff.full_name}`
    });
  };

  const removeShift = (tempId: string) => {
    setShifts(prev => prev.filter(shift => shift.tempId !== tempId));
    console.log('🗑️ Removed shift:', tempId);
  };

  const sendRosterEmails = async (rosterId: string, rosterName: string) => {
    if (!sendEmails || shifts.length === 0) return;

    console.log('📧 Sending roster emails...');
    setSendingEmails(true);
    
    try {
      // Group shifts by staff member
      const shiftsByStaff = shifts.reduce((acc, shift) => {
        if (!acc[shift.staffId]) {
          acc[shift.staffId] = {
            staffEmail: shift.staffEmail,
            staffName: shift.staffName,
            shifts: []
          };
        }
        acc[shift.staffId].shifts.push({
          date: shift.date,
          startTime: shift.startTime,
          endTime: shift.endTime,
          location: shift.location,
          totalHours: shift.totalHours
        });
        return acc;
      }, {} as Record<string, any>);

      console.log('📋 Grouped shifts by staff:', shiftsByStaff);

      // Send emails to each staff member
      const emailPromises = Object.values(shiftsByStaff).map(async (staffRoster: any) => {
        try {
          console.log(`📤 Sending roster to ${staffRoster.staffName} (${staffRoster.staffEmail})`);
          
          await emailService.sendRoster({
            staffEmail: staffRoster.staffEmail,
            staffName: staffRoster.staffName,
            rosterName: rosterName,
            rosterPeriod: `${new Date(rosterData.startDate).toLocaleDateString()} - ${new Date(rosterData.endDate).toLocaleDateString()}`,
            shifts: staffRoster.shifts
          });

          return { success: true, staff: staffRoster.staffName };
        } catch (error) {
          console.error(`❌ Failed to send roster to ${staffRoster.staffName}:`, error);
          return { success: false, staff: staffRoster.staffName, error };
        }
      });

      const results = await Promise.all(emailPromises);
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      console.log('📊 Email results:', { successful: successful.length, failed: failed.length });

      if (successful.length > 0) {
        toast({
          title: 'Rosters Sent',
          description: `Successfully sent rosters to ${successful.length} staff members`
        });
      }

      if (failed.length > 0) {
        toast({
          title: 'Some Emails Failed',
          description: `Failed to send rosters to ${failed.length} staff members`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('💥 Error sending roster emails:', error);
      toast({
        title: 'Email Error',
        description: 'Failed to send roster emails',
        variant: 'destructive'
      });
    } finally {
      setSendingEmails(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (shifts.length === 0) {
      toast({
        title: 'No Shifts',
        description: 'Please add at least one shift to create a roster',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    console.log('🚀 Creating roster...', rosterData);
    
    try {
      // Create roster
      const rosterInsertData = {
        name: rosterData.name,
        start_date: rosterData.startDate,
        end_date: rosterData.endDate,
        type: rosterData.type,
        is_published: rosterData.isPublished,
        is_holiday: rosterData.isHoliday,
        notes: rosterData.notes,
        created_at: new Date().toISOString()
      };

      console.log('📝 Inserting roster data:', rosterInsertData);

      const { data: roster, error: rosterError } = await supabase
        .from('rosters')
        .insert([rosterInsertData])
        .select()
        .single();

      if (rosterError) {
        console.error('❌ Roster creation error:', rosterError);
        throw rosterError;
      }

      console.log('✅ Roster created:', roster);

      // Create shifts
      const shiftInserts = shifts.map(shift => ({
        roster_id: roster.id,
        staff_id: shift.staffId,
        shift_date: shift.date,
        start_time: shift.startTime,
        end_time: shift.endTime,
        location: shift.location,
        break_minutes: shift.breakMinutes,
        hourly_rate: shift.staffRate,
        total_hours: shift.totalHours,
        total_cost: shift.totalCost,
        notes: shift.notes || null,
        created_at: new Date().toISOString()
      }));

      console.log('📝 Inserting shifts:', shiftInserts);

      const { error: shiftsError } = await supabase
        .from('roster_shifts')
        .insert(shiftInserts);

      if (shiftsError) {
        console.error('❌ Shifts creation error:', shiftsError);
        throw shiftsError;
      }

      console.log('✅ Shifts created successfully');

      toast({
        title: 'Success',
        description: `Roster "${rosterData.name}" created with ${shifts.length} shifts`
      });

      // Send emails if enabled and published
      if (sendEmails && rosterData.isPublished) {
        await sendRosterEmails(roster.id, rosterData.name);
      }

      // Create the complete roster object for optimistic update
      const newRosterWithShifts = {
        ...roster,
        shifts: shifts.map(shift => ({
          id: `temp-${shift.tempId}`,
          staff_id: shift.staffId,
          staff_name: shift.staffName,
          staff_role: staff.find(s => s.id === shift.staffId)?.position || 'Unknown',
          shift_date: shift.date,
          start_time: shift.startTime,
          end_time: shift.endTime,
          location: shift.location,
          total_hours: shift.totalHours,
          total_cost: shift.totalCost,
          hourly_rate: shift.staffRate,
          notes: shift.notes
        }))
      };

      // Reset form
      setRosterData({
        name: '',
        startDate: '',
        endDate: '',
        type: 'Weekly',
        isPublished: false,
        isHoliday: false,
        notes: ''
      });
      setShifts([]);
      setNewShift({
        staffId: '',
        date: '',
        startTime: '09:00',
        endTime: '17:00',
        location: 'Main Restaurant',
        breakMinutes: 30,
        notes: ''
      });

      // Call parent callback with new roster data for optimistic update
      onRosterCreated(newRosterWithShifts);
      setOpen(false);
      
    } catch (error) {
      console.error('💥 Error creating roster:', error);
      toast({
        title: 'Error',
        description: 'Failed to create roster: ' + (error as any)?.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const totalHours = shifts.reduce((sum, shift) => sum + shift.totalHours, 0);
  const totalCost = shifts.reduce((sum, shift) => sum + shift.totalCost, 0);
  const uniqueStaff = new Set(shifts.map(shift => shift.staffId)).size;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Roster
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Create New Roster
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Roster Details */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Roster Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Roster Name</Label>
                    <Input
                      id="name"
                      value={rosterData.name}
                      onChange={(e) => setRosterData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Week of..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={rosterData.startDate}
                        onChange={(e) => setRosterData(prev => ({ ...prev, startDate: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={rosterData.endDate}
                        onChange={(e) => setRosterData(prev => ({ ...prev, endDate: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="type">Roster Type</Label>
                    <Select
                      value={rosterData.type}
                      onValueChange={(value) => setRosterData(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROSTER_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={rosterData.notes}
                      onChange={(e) => setRosterData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isPublished"
                        checked={rosterData.isPublished}
                        onCheckedChange={(checked) => setRosterData(prev => ({ ...prev, isPublished: checked }))}
                      />
                      <Label htmlFor="isPublished">Publish immediately</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isHoliday"
                        checked={rosterData.isHoliday}
                        onCheckedChange={(checked) => setRosterData(prev => ({ ...prev, isHoliday: checked }))}
                      />
                      <Label htmlFor="isHoliday">Holiday period</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="sendEmails"
                        checked={sendEmails}
                        onCheckedChange={setSendEmails}
                      />
                      <Label htmlFor="sendEmails" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email rosters to staff
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Shifts:</span>
                    <span className="font-semibold">{shifts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Staff Members:</span>
                    <span className="font-semibold">{uniqueStaff}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Hours:</span>
                    <span className="font-semibold">{totalHours.toFixed(1)}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Cost:</span>
                    <span className="font-semibold">${totalCost.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Middle Column - Add Shift */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add Shift</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="staffId">Staff Member</Label>
                    <Select
                      value={newShift.staffId}
                      onValueChange={(value) => setNewShift(prev => ({ ...prev, staffId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff member" />
                      </SelectTrigger>
                      <SelectContent>
                        {staff.map(member => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.full_name} - {member.position} (${member.hourly_rate}/hr)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="shiftDate">Date</Label>
                    <Input
                      id="shiftDate"
                      type="date"
                      value={newShift.date}
                      onChange={(e) => setNewShift(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={newShift.startTime}
                        onChange={(e) => setNewShift(prev => ({ ...prev, startTime: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={newShift.endTime}
                        onChange={(e) => setNewShift(prev => ({ ...prev, endTime: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Select
                      value={newShift.location}
                      onValueChange={(value) => setNewShift(prev => ({ ...prev, location: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCATIONS.map(location => (
                          <SelectItem key={location} value={location}>{location}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="breakMinutes">Break (minutes)</Label>
                    <Input
                      id="breakMinutes"
                      type="number"
                      min="0"
                      value={newShift.breakMinutes}
                      onChange={(e) => setNewShift(prev => ({ ...prev, breakMinutes: parseInt(e.target.value) || 0 }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="shiftNotes">Notes</Label>
                    <Textarea
                      id="shiftNotes"
                      value={newShift.notes}
                      onChange={(e) => setNewShift(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Special instructions..."
                      rows={2}
                    />
                  </div>

                  <Button type="button" onClick={addShift} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Shift
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Shifts List */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Shifts ({shifts.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {shifts.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No shifts added yet</p>
                    ) : (
                      shifts.map((shift) => (
                        <div key={shift.tempId} className="p-3 border rounded-lg space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium">{shift.staffName}</div>
                              <div className="text-sm text-gray-600">
                                {new Date(shift.date).toLocaleDateString('en-AU', {
                                  weekday: 'short',
                                  day: '2-digit',
                                  month: 'short'
                                })}
                              </div>
                              <div className="text-sm">
                                {shift.startTime} - {shift.endTime}
                              </div>
                              <div className="text-sm text-gray-600">{shift.location}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {shift.totalHours.toFixed(1)}h
                              </div>
                              <div className="text-sm text-gray-600">
                                ${shift.totalCost.toFixed(2)}
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => removeShift(shift.tempId)}
                                className="mt-1"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          {shift.notes && (
                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                              {shift.notes}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading || sendingEmails}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || sendingEmails || shifts.length === 0}
              className="min-w-[140px]"
            >
              {loading ? 'Creating...' :
                sendingEmails ? 'Sending Emails...' :
                  sendEmails && rosterData.isPublished ? (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Create & Email
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Create Roster
                    </>
                  )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};