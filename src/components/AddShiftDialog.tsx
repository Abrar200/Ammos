import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Plus, Clock } from 'lucide-react';

interface Staff {
  id: string;
  name: string;
  role: string;
  hourly_rate: number;
}

interface AddShiftDialogProps {
  rosterId: string;
  onShiftAdded: () => void;
  triggerButton?: React.ReactNode;
}

const LOCATIONS = ['Main Restaurant', 'Bar', 'Kitchen', 'Reception', 'Outdoor Area'];

export const AddShiftDialog = ({ rosterId, onShiftAdded, triggerButton }: AddShiftDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    staffId: '',
    shiftDate: '',
    startTime: '',
    endTime: '',
    location: 'Main Restaurant',
    breakMinutes: 30,
    notes: ''
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id, name, role, hourly_rate')
        .order('name');

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const calculateHours = (start: string, end: string, breakMinutes: number) => {
    if (!start || !end) return 0;
    
    const startTime = new Date(`2000-01-01T${start}`);
    const endTime = new Date(`2000-01-01T${end}`);
    
    if (endTime <= startTime) {
      endTime.setDate(endTime.getDate() + 1);
    }
    
    const diffMs = endTime.getTime() - startTime.getTime();
    const totalMinutes = diffMs / (1000 * 60);
    const workMinutes = totalMinutes - breakMinutes;
    
    return Math.max(0, workMinutes / 60);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedStaff = staff.find(s => s.id === formData.staffId);
      if (!selectedStaff) throw new Error('Staff member not found');

      const totalHours = calculateHours(formData.startTime, formData.endTime, formData.breakMinutes);
      const totalCost = totalHours * selectedStaff.hourly_rate;

      const { error } = await supabase
        .from('roster_shifts')
        .insert([{
          roster_id: rosterId,
          staff_id: formData.staffId,
          shift_date: formData.shiftDate,
          start_time: formData.startTime,
          end_time: formData.endTime,
          location: formData.location,
          break_minutes: formData.breakMinutes,
          hourly_rate: selectedStaff.hourly_rate,
          total_hours: totalHours,
          total_cost: totalCost,
          notes: formData.notes
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Shift added successfully"
      });

      setFormData({
        staffId: '',
        shiftDate: '',
        startTime: '',
        endTime: '',
        location: 'Main Restaurant',
        breakMinutes: 30,
        notes: ''
      });
      
      setOpen(false);
      onShiftAdded();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add shift",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const totalHours = calculateHours(formData.startTime, formData.endTime, formData.breakMinutes);
  const selectedStaff = staff.find(s => s.id === formData.staffId);
  const estimatedCost = selectedStaff ? totalHours * selectedStaff.hourly_rate : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Shift
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Add New Shift
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="staffId">Staff Member</Label>
              <Select value={formData.staffId} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, staffId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} - {member.role} (${member.hourly_rate}/hr)
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
                value={formData.shiftDate}
                onChange={(e) => setFormData(prev => ({ ...prev, shiftDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="breakMinutes">Break (min)</Label>
              <Input
                id="breakMinutes"
                type="number"
                value={formData.breakMinutes}
                onChange={(e) => setFormData(prev => ({ ...prev, breakMinutes: parseInt(e.target.value) || 0 }))}
                min="0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Select value={formData.location} onValueChange={(value) => 
              setFormData(prev => ({ ...prev, location: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {totalHours > 0 && (
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm"><strong>Total Hours:</strong> {totalHours.toFixed(2)}h</p>
              {selectedStaff && (
                <p className="text-sm"><strong>Estimated Cost:</strong> ${estimatedCost.toFixed(2)}</p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Special instructions, etc."
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.staffId}>
              {loading ? 'Adding...' : 'Add Shift'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};