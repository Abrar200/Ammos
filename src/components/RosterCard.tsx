import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AddShiftDialog } from './AddShiftDialog';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, DollarSign, MapPin, Users, Trash2, Copy, Send } from 'lucide-react';

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
}

interface RosterCardProps {
  roster: Roster;
  onUpdate: () => void;
}

export const RosterCard = ({ roster, onUpdate }: RosterCardProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const totalCost = roster.shifts.reduce((sum, shift) => sum + shift.total_cost, 0);
  const totalHours = roster.shifts.reduce((sum, shift) => sum + shift.total_hours, 0);
  const uniqueStaff = new Set(roster.shifts.map(s => s.staff_id)).size;

  const handleDeleteRoster = async () => {
    if (!confirm('Are you sure you want to delete this roster? This will also delete all shifts.')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('rosters')
        .delete()
        .eq('id', roster.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Roster deleted successfully"
      });
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete roster",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePublishRoster = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('rosters')
        .update({ is_published: !roster.is_published })
        .eq('id', roster.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Roster ${roster.is_published ? 'unpublished' : 'published'} successfully`
      });
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update roster",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
            onShiftAdded={onUpdate}
            triggerButton={
              <Button size="sm" variant="outline">
                <Clock className="h-4 w-4 mr-1" />
                Add Shift
              </Button>
            }
          />
          <Button size="sm" variant="outline">
            <Copy className="h-4 w-4 mr-1" />
            Copy Roster
          </Button>
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