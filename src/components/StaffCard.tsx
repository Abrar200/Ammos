import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Mail, Phone, DollarSign, Calendar, User, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface Staff {
  id: string;
  name: string;
  email: string;
  position: string;
  hourly_rate: number;
  employment_type: string;
  image_url?: string;
  phone?: string;
  is_active: boolean;
}

interface StaffCardProps {
  staff: Staff;
  onPayroll: (staff: Staff) => void;
  onEdit: (staff: Staff) => void;
  onDelete?: () => void;
}

export const StaffCard = ({ staff, onPayroll, onEdit, onDelete }: StaffCardProps) => {
  const { toast } = useToast();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRateDisplay = () => {
    if (staff.employment_type === 'salary') {
      return 'Salary';
    }
    return `$${staff.hourly_rate}/hr`;
  };

  // Fixed: Use onEdit instead of navigate
  const handleProfileClick = () => {
    onEdit(staff);
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', staff.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Staff member deleted successfully',
      });

      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete staff member',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar
            className="h-12 w-12 cursor-pointer hover:ring-2 hover:ring-blue-500"
            onClick={handleProfileClick}
          >
            <AvatarImage src={staff.image_url} alt={staff.name} />
            <AvatarFallback>{getInitials(staff.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3
              className="font-semibold text-lg cursor-pointer hover:text-blue-600 transition-colors"
              onClick={handleProfileClick}
            >
              {staff.name}
            </h3>
            <p className="text-sm text-gray-600">{staff.position}</p>
          </div>
          <Badge variant={staff.is_active ? 'default' : 'secondary'}>
            {staff.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="h-4 w-4" />
          <span>{staff.email}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <DollarSign className="h-4 w-4" />
          <span>{getRateDisplay()}</span>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={handleProfileClick}
            variant="outline"
            className="flex-1"
          >
            <User className="h-4 w-4 mr-1" />
            Profile
          </Button>
          <Button
            size="sm"
            onClick={() => onPayroll(staff)}
            className="flex-1"
          >
            <Calendar className="h-4 w-4 mr-1" />
            Payroll
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {staff.name}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};