import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

interface CreateRosterDialogProps {
  onRosterCreated: () => void;
}

export const CreateRosterDialog = ({ onRosterCreated }: CreateRosterDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    type: 'weekly' as 'weekly' | 'fortnightly',
    isHoliday: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.startDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(startDate);
      
      if (formData.type === 'weekly') {
        endDate.setDate(endDate.getDate() + 6);
      } else {
        endDate.setDate(endDate.getDate() + 13);
      }

      const { data, error } = await supabase
        .from('rosters')
        .insert([{
          name: formData.name,
          start_date: formData.startDate,
          end_date: endDate.toISOString().split('T')[0],
          type: formData.type,
          is_holiday: formData.isHoliday,
          is_published: false,
          notes: ''
        }])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Roster created:', data);

      toast({
        title: "Success",
        description: "Roster created successfully"
      });

      setFormData({
        name: '',
        startDate: '',
        type: 'weekly',
        isHoliday: false
      });
      
      setOpen(false);
      onRosterCreated();
    } catch (error: any) {
      console.error('Error creating roster:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create roster",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Roster
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Roster</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Roster Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Week 1 - January 2024"
              required
            />
          </div>

          <div>
            <Label htmlFor="startDate">Start Date *</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Roster Type</Label>
            <Select value={formData.type} onValueChange={(value: 'weekly' | 'fortnightly') => 
              setFormData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="fortnightly">Fortnightly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isHoliday"
              checked={formData.isHoliday}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isHoliday: checked }))}
            />
            <Label htmlFor="isHoliday">Public Holiday Period</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Roster'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};