import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Search, Filter, User, Settings, Database, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  category: 'login' | 'data' | 'settings' | 'security';
  details: string;
  ipAddress: string;
}

export const AuditLogs: React.FC = () => {
  const { toast } = useToast();
  const [logs] = useState<AuditLog[]>([
    {
      id: '1',
      timestamp: '2024-01-15 10:30:25',
      user: 'john@ammos.com.au',
      action: 'User Login',
      category: 'login',
      details: 'Successful login from desktop',
      ipAddress: '192.168.1.100',
    },
    {
      id: '2',
      timestamp: '2024-01-15 10:25:12',
      user: 'jane@ammos.com.au',
      action: 'Supplier Added',
      category: 'data',
      details: 'Added new supplier: Fresh Seafood Co',
      ipAddress: '192.168.1.101',
    },
    {
      id: '3',
      timestamp: '2024-01-15 09:45:33',
      user: 'john@ammos.com.au',
      action: 'Settings Updated',
      category: 'settings',
      details: 'Modified notification preferences',
      ipAddress: '192.168.1.100',
    },
    {
      id: '4',
      timestamp: '2024-01-15 09:15:44',
      user: 'system',
      action: '2FA Enabled',
      category: 'security',
      details: 'Two-factor authentication enabled for all users',
      ipAddress: 'system',
    },
    {
      id: '5',
      timestamp: '2024-01-14 16:30:15',
      user: 'jane@ammos.com.au',
      action: 'Staff Record Updated',
      category: 'data',
      details: 'Updated RSA certificate for Maria Santos',
      ipAddress: '192.168.1.101',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    const icons = {
      login: User,
      data: Database,
      settings: Settings,
      security: Shield,
    };
    const Icon = icons[category as keyof typeof icons] || FileText;
    return <Icon className="w-3 h-3" />;
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      login: 'bg-blue-100 text-blue-800',
      data: 'bg-green-100 text-green-800',
      settings: 'bg-purple-100 text-purple-800',
      security: 'bg-red-100 text-red-800',
    };
    return (
      <Badge variant="secondary" className={colors[category as keyof typeof colors]}>
        {getCategoryIcon(category)}
        <span className="ml-1 capitalize">{category}</span>
      </Badge>
    );
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    toast({
      title: "Export Started",
      description: `Audit logs are being exported as ${format.toUpperCase()}. You'll receive a download link shortly.`,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              System Activity Logs
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => handleExport('csv')}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleExport('pdf')}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Search logs</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by user, action, or details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="category" className="sr-only">Filter by category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="data">Data</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                  <TableCell>{log.user}</TableCell>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell>{getCategoryBadge(log.category)}</TableCell>
                  <TableCell className="max-w-xs truncate">{log.details}</TableCell>
                  <TableCell className="font-mono text-sm">{log.ipAddress}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No logs found matching your search criteria.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log Retention Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-ammos-secondary rounded-lg">
              <h3 className="font-medium mb-2">Current Settings</h3>
              <ul className="text-sm space-y-1">
                <li>• Login logs: Retained for 12 months</li>
                <li>• Data modification logs: Retained for 24 months</li>
                <li>• Settings changes: Retained for 12 months</li>
                <li>• Security events: Retained for 36 months</li>
              </ul>
            </div>
            <p className="text-sm text-gray-600">
              Logs are automatically archived and compressed after 6 months. 
              Contact support to modify retention policies.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};