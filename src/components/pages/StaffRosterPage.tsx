import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreateRosterDialog } from '@/components/CreateRosterDialog';
import { RosterCard } from '@/components/RosterCard';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, DollarSign, Users, Download, BarChart3 } from 'lucide-react';

interface Roster {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  type: string;
  is_published: boolean;
  is_holiday: boolean;
  shifts: Array<{
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
  }>;
}

export const StaffRosterPage = () => {
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRosters();
  }, []);

  const fetchRosters = async () => {
    try {
      setLoading(true);
      
      // Fetch rosters with their shifts and staff details
      const { data: rostersData, error: rostersError } = await supabase
        .from('rosters')
        .select(`
          *,
          roster_shifts (
            *,
            staff (
              full_name,
              position
            )
          )
        `)
        .order('start_date', { ascending: false });

      if (rostersError) throw rostersError;

      // Transform the data to match our interface
      const transformedRosters: Roster[] = (rostersData || []).map(roster => ({
        ...roster,
        shifts: (roster.roster_shifts || []).map((shift: any) => ({
          ...shift,
          staff_name: shift.staff?.full_name || 'Unknown',
          staff_role: shift.staff?.position || 'Unknown'
        }))
      }));

      setRosters(transformedRosters);
    } catch (error) {
      console.error('Error fetching rosters:', error);
      toast({
        title: "Error",
        description: "Failed to fetch rosters",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary statistics
  const totalRosters = rosters.length;
  const publishedRosters = rosters.filter(r => r.is_published).length;
  const totalShifts = rosters.reduce((sum, r) => sum + r.shifts.length, 0);
  const totalCost = rosters.reduce((sum, r) => 
    sum + r.shifts.reduce((shiftSum, s) => shiftSum + s.total_cost, 0), 0);
  const totalHours = rosters.reduce((sum, r) => 
    sum + r.shifts.reduce((shiftSum, s) => shiftSum + s.total_hours, 0), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Roster Management</h1>
          <p className="text-gray-600 mt-2">Loading rosters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Roster Management</h1>
          <p className="text-gray-600 mt-2">Create and manage weekly/fortnightly rosters with shift costing</p>
        </div>
        <div className="flex space-x-2">
          <CreateRosterDialog onRosterCreated={fetchRosters} />
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rosters</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRosters}</div>
            <p className="text-xs text-muted-foreground">{publishedRosters} published</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalShifts}</div>
            <p className="text-xs text-muted-foreground">Across all rosters</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Scheduled hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Labour costs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost/Hour</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalHours > 0 ? (totalCost / totalHours).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">Average rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Rosters List */}
      <div className="space-y-4">
        {rosters.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Rosters Found</CardTitle>
              <CardDescription>
                Create your first roster to get started with staff scheduling.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateRosterDialog onRosterCreated={fetchRosters} />
            </CardContent>
          </Card>
        ) : (
          rosters.map((roster) => (
            <RosterCard 
              key={roster.id} 
              roster={roster} 
              onUpdate={fetchRosters}
            />
          ))
        )}
      </div>
    </div>
  );
};