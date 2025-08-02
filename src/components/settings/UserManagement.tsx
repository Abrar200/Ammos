import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, UserPlus, Shield, Eye, Edit, Trash2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'finance' | 'readonly';
  lastLogin: string;
  status: 'active' | 'inactive';
}

export const UserManagement: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([
    { id: '1', name: 'John Doe', email: 'john@ammos.com.au', role: 'admin', lastLogin: '2024-01-15 10:30', status: 'active' },
    { id: '2', name: 'Jane Smith', email: 'jane@ammos.com.au', role: 'finance', lastLogin: '2024-01-14 16:45', status: 'active' },
    { id: '3', name: 'Mike Wilson', email: 'mike@ammos.com.au', role: 'readonly', lastLogin: '2024-01-13 09:15', status: 'inactive' },
  ]);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'readonly' as const,
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleAddUser = () => {
    const user: User = {
      id: Date.now().toString(),
      ...newUser,
      lastLogin: 'Never',
      status: 'active',
    };
    setUsers(prev => [...prev, user]);
    setNewUser({ name: '', email: '', role: 'readonly' });
    setIsAddDialogOpen(false);
    toast({
      title: "User Added",
      description: `${user.name} has been added successfully.`,
    });
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
    toast({
      title: "User Removed",
      description: "User has been removed from the system.",
    });
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { color: 'bg-red-100 text-red-800', icon: Shield },
      finance: { color: 'bg-blue-100 text-blue-800', icon: Edit },
      readonly: { color: 'bg-gray-100 text-gray-800', icon: Eye },
    };
    const config = roleConfig[role as keyof typeof roleConfig];
    const Icon = config.icon;
    return (
      <Badge variant="secondary" className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Management
            </CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-ammos-primary hover:bg-ammos-primary/90">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="userName">Full Name</Label>
                    <Input
                      id="userName"
                      value={newUser.name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="userEmail">Email Address</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Select value={newUser.role} onValueChange={(value: any) => setNewUser(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Full Admin</SelectItem>
                        <SelectItem value="finance">Finance Only</SelectItem>
                        <SelectItem value="readonly">Read Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddUser} className="w-full bg-ammos-primary hover:bg-ammos-primary/90">
                    Add User
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    {user.lastLogin}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-red-600" />
                  <h3 className="font-medium">Full Admin</h3>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• All system access</li>
                  <li>• User management</li>
                  <li>• Financial data</li>
                  <li>• Settings configuration</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Edit className="w-4 h-4 text-blue-600" />
                  <h3 className="font-medium">Finance Only</h3>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Financial reports</li>
                  <li>• Invoice management</li>
                  <li>• Supplier data</li>
                  <li>• No user management</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-gray-600" />
                  <h3 className="font-medium">Read Only</h3>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• View dashboards</li>
                  <li>• Basic reports</li>
                  <li>• No editing access</li>
                  <li>• No sensitive data</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};