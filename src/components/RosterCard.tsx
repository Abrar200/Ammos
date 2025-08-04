import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AddShiftDialog } from './AddShiftDialog';
import { supabase } from '@/lib/supabase';
import { emailService } from '@/lib/emailService';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, DollarSign, MapPin, Users, Trash2, Copy, Send, Mail } from 'lucide-react';

interface Shift {
  id: string;
  staff_id: string;
  staff_name: string;
  staff_role: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  location: string;
  total_hours: number;
  total_cost: number;
  hourly_rate: number;
  notes?: string;
}

interface Roster {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  type: string;
  is_published: boolean;
  is_holiday: boolean;
  shifts: Shift[];
  notes?: string;
}

interface RosterCardProps {
  roster: Roster;
  onUpdate: (updatedRoster: Roster) => void;
  onDelete: (rosterId: string) => void;
}

export const RosterCard = ({ roster, onUpdate, onDelete }: RosterCardProps) => {
  const [loading, setLoading] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);
  const { toast } = useToast();

  const totalCost = roster.shifts.reduce((sum, shift) => sum + shift.total_cost, 0);
  const totalHours = roster.shifts.reduce((sum, shift) => sum + shift.total_hours, 0);
  const uniqueStaff = new Set(roster.shifts.map(s => s.staff_id)).size;

  const handleDeleteRoster = async () => {
    if (!confirm('Are you sure you want to delete this roster? This will also delete all shifts.')) return;

    console.log('🗑️ Deleting roster:', roster.id);
    setLoading(true);

    try {
      // Optimistic update: remove from UI immediately
      onDelete(roster.id);

      const { error } = await supabase
        .from('rosters')
        .delete()
        .eq('id', roster.id);

      if (error) {
        console.error('❌ Error deleting roster:', error);
        throw error;
      }

      console.log('✅ Roster deleted successfully');
      toast({
        title: "Success",
        description: "Roster deleted successfully"
      });

    } catch (error) {
      console.error('💥 Error deleting roster:', error);
      toast({
        title: "Error",
        description: "Failed to delete roster",
        variant: "destructive"
      });
      // Note: In a real app, you'd want to revert the optimistic update here
    } finally {
      setLoading(false);
    }
  };

  const handlePublishRoster = async () => {
    console.log('🔄 Toggling publish status for roster:', roster.id);
    setLoading(true);

    try {
      const newPublishedState = !roster.is_published;

      // Optimistic update: update UI immediately
      const updatedRoster = { ...roster, is_published: newPublishedState };
      onUpdate(updatedRoster);

      const { error } = await supabase
        .from('rosters')
        .update({ is_published: newPublishedState })
        .eq('id', roster.id);

      if (error) {
        console.error('❌ Error updating roster:', error);
        throw error;
      }

      console.log('✅ Roster publish status updated');
      toast({
        title: "Success",
        description: `Roster ${newPublishedState ? 'published' : 'unpublished'} successfully`
      });

    } catch (error) {
      console.error('💥 Error updating roster:', error);
      
      // Revert optimistic update on error
      onUpdate(roster);
      
      toast({
        title: "Error",
        description: "Failed to update roster",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRoster = async () => {
    console.log('📋 Copying roster:', roster.id);
    setLoading(true);

    try {
      // Create a copy of the roster with a new name
      const nextWeekStart = new Date(roster.start_date);
      nextWeekStart.setDate(nextWeekStart.getDate() + 7);
      const nextWeekEnd = new Date(roster.end_date);
      nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);

      const { data: newRoster, error: rosterError } = await supabase
        .from('rosters')
        .insert([{
          name: `${roster.name} (Copy)`,
          start_date: nextWeekStart.toISOString().split('T')[0],
          end_date: nextWeekEnd.toISOString().split('T')[0],
          type: roster.type,
          is_published: false,
          is_holiday: roster.is_holiday,
          notes: roster.notes
        }])
        .select()
        .single();

      if (rosterError) {
        console.error('❌ Error creating roster copy:', rosterError);
        throw rosterError;
      }

      console.log('✅ Roster copied, now copying shifts...');

      // Copy all shifts to the new roster, adjusting dates
      const shiftsCopy = roster.shifts.map(shift => {
        const newShiftDate = new Date(shift.shift_date);
        newShiftDate.setDate(newShiftDate.getDate() + 7);

        return {
          roster_id: newRoster.id,
          staff_id: shift.staff_id,
          shift_date: newShiftDate.toISOString().split('T')[0],
          start_time: shift.start_time,
          end_time: shift.end_time,
          location: shift.location,
          hourly_rate: shift.hourly_rate,
          total_hours: shift.total_hours,
          total_cost: shift.total_cost,
          notes: shift.notes,
          created_at: new Date().toISOString()
        };
      });

      if (shiftsCopy.length > 0) {
        const { error: shiftsError } = await supabase
          .from('roster_shifts')
          .insert(shiftsCopy);

        if (shiftsError) {
          console.error('❌ Error copying shifts:', shiftsError);
          throw shiftsError;
        }
      }

      console.log('✅ Roster and shifts copied successfully');
      toast({
        title: "Success",
        description: "Roster copied successfully"
      });

      // The parent component will refresh the list
      
    } catch (error) {
      console.error('💥 Error copying roster:', error);
      toast({
        title: "Error",
        description: "Failed to copy roster",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendRosterEmails = async () => {
    if (roster.shifts.length === 0) {
      toast({
        title: "No Shifts",
        description: "Cannot send roster emails - no shifts scheduled",
        variant: "destructive"
      });
      return;
    }

    console.log('📧 Sending roster emails for:', roster.name);
    setSendingEmails(true);

    try {
      // Get staff email addresses
      const staffIds = [...new Set(roster.shifts.map(shift => shift.staff_id))];
      
      console.log('👥 Getting staff data for IDs:', staffIds);
      
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, full_name, email')
        .in('id', staffIds);

      if (staffError) {
        console.error('❌ Error fetching staff data:', staffError);
        throw staffError;
      }

      console.log('✅ Staff data retrieved:', staffData);

      // Group shifts by staff member
      const shiftsByStaff = roster.shifts.reduce((acc, shift) => {
        if (!acc[shift.staff_id]) {
          acc[shift.staff_id] = [];
        }
        acc[shift.staff_id].push({
          date: shift.shift_date,
          startTime: shift.start_time,
          endTime: shift.end_time,
          location: shift.location,
          totalHours: shift.total_hours
        });
        return acc;
      }, {} as Record<string, any[]>);

      console.log('📋 Grouped shifts by staff:', shiftsByStaff);

      // Send emails to each staff member
      const emailPromises = staffData.map(async (staff) => {
        const staffShifts = shiftsByStaff[staff.id] || [];
        if (staffShifts.length === 0) return { success: true, staff: staff.full_name };

        try {
          console.log(`📤 Sending roster to ${staff.full_name} (${staff.email})`);
          
          await emailService.sendRoster({
            staffEmail: staff.email,
            staffName: staff.full_name,
            rosterName: roster.name,
            rosterPeriod: `${new Date(roster.start_date).toLocaleDateString()} - ${new Date(roster.end_date).toLocaleDateString()}`,
            shifts: staffShifts
          });

          return { success: true, staff: staff.full_name };
        } catch (error) {
          console.error(`❌ Failed to send roster to ${staff.full_name}:`, error);
          return { success: false, staff: staff.full_name, error };
        }
      });

      const results = await Promise.all(emailPromises);
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      console.log('📊 Email results:', { successful: successful.length, failed: failed.length });

      if (successful.length > 0) {
        toast({
          title: "Rosters Sent",
          description: `Successfully sent rosters to ${successful.length} staff members`
        });
      }

      if (failed.length > 0) {
        toast({
          title: "Some Emails Failed",
          description: `Failed to send rosters to ${failed.length} staff members`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('💥 Error sending roster emails:', error);
      toast({
        title: "Email Error",
        description: "Failed to send roster emails",
        variant: "destructive"
      });
    } finally {
      setSendingEmails(false);
    }
  };

  const handleShiftAdded = () => {
    console.log('🔄 Shift added, refreshing roster data...');
    // In a real app, you might want to fetch the updated roster data
    // For now, the parent component will handle the refresh
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const groupShiftsByDate = () => {
    const grouped: { [key: string]: Shift[] } = {};
    roster.shifts.forEach(shift => {
      if (!grouped[shift.shift_date]) {
        grouped[shift.shift_date] = [];
      }
      grouped[shift.shift_date].push(shift);
    });
    return grouped;
  };

  const shiftsByDate = groupShiftsByDate();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              {roster.name}
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {formatDate(roster.start_date)} - {formatDate(roster.end_date)}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {roster.is_holiday && (
              <Badge variant="secondary">Holiday Period</Badge>
            )}
            <Badge variant={roster.is_published ? "default" : "outline"}>
              {roster.is_published ? "Published" : "Draft"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2 text-gray-500" />
            <span>{uniqueStaff} staff, {roster.shifts.length} shifts</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-gray-500" />
            <span>{totalHours.toFixed(1)} total hours</span>
          </div>
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
            <span>${totalCost.toFixed(2)} total cost</span>
          </div>
        </div>

        {Object.keys(shiftsByDate).length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Shifts by Date:</h4>
            {Object.entries(shiftsByDate).map(([date, shifts]) => (
              <div key={date} className="bg-gray-50 rounded p-3">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="font-medium text-sm">{formatDate(date)}</h5>
                  <span className="text-xs text-gray-500">
                    ${shifts.reduce((sum, s) => sum + s.total_cost, 0).toFixed(2)}
                  </span>
                </div>
                <div className="space-y-1">
                  {shifts.map((shift) => (
                    <div key={shift.id} className="flex justify-between items-center text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{shift.staff_name}</span>
                        <span className="text-gray-500">({shift.staff_role})</span>
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>{shift.location}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>{shift.start_time}-{shift.end_time}</span>
                        <span className="text-gray-500">({shift.total_hours.toFixed(1)}h)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <AddShiftDialog
            rosterId={roster.id}
            onShiftAdded={handleShiftAdded}
            triggerButton={
              <Button size="sm" variant="outline">
                <Clock className="h-4 w-4 mr-1" />
                Add Shift
              </Button>
            }
          />

          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyRoster}
            disabled={loading}
          >
            <Copy className="h-4 w-4 mr-1" />
            Copy Roster
          </Button>

          {roster.is_published && roster.shifts.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={sendRosterEmails}
              disabled={sendingEmails}
            >
              <Mail className="h-4 w-4 mr-1" />
              {sendingEmails ? 'Sending...' : 'Email Staff'}
            </Button>
          )}

          <Button
            size="sm"
            variant={roster.is_published ? "secondary" : "default"}
            onClick={handlePublishRoster}
            disabled={loading}
          >
            <Send className="h-4 w-4 mr-1" />
            {roster.is_published ? 'Unpublish' : 'Publish'}
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={handleDeleteRoster}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};