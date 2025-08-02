import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Mail, MessageSquare, AlertTriangle, DollarSign, Calendar, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  dashboard: boolean;
  email: boolean;
  sms: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
}

export const NotificationSettings: React.FC = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    {
      id: 'bills-due',
      title: 'Bills Due',
      description: 'Upcoming supplier payments and subscription renewals',
      icon: DollarSign,
      dashboard: true,
      email: true,
      sms: false,
      frequency: 'daily',
    },
    {
      id: 'qualifications-expiring',
      title: 'Qualifications Expiring',
      description: 'Staff certifications and licenses nearing expiry',
      icon: AlertTriangle,
      dashboard: true,
      email: true,
      sms: false,
      frequency: 'weekly',
    },
    {
      id: 'bank-alerts',
      title: 'Bank Alerts',
      description: 'Unusual transactions or low balance warnings',
      icon: AlertTriangle,
      dashboard: true,
      email: true,
      sms: true,
      frequency: 'immediate',
    },
    {
      id: 'staff-roster',
      title: 'Staff Roster Changes',
      description: 'Shift updates and roster modifications',
      icon: Users,
      dashboard: true,
      email: false,
      sms: false,
      frequency: 'immediate',
    },
    {
      id: 'compliance-reminders',
      title: 'Compliance Reminders',
      description: 'Required documentation and audit deadlines',
      icon: Calendar,
      dashboard: true,
      email: true,
      sms: false,
      frequency: 'weekly',
    },
  ]);

  const updateNotification = (id: string, field: keyof NotificationSetting, value: any) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, [field]: value } : notif
    ));
  };

  const handleSave = () => {
    toast({
      title: "Notification Settings Saved",
      description: "Your notification preferences have been updated.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {notifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <div key={notification.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 bg-ammos-secondary rounded-lg flex items-center justify-center mt-1">
                      <Icon className="w-5 h-5 text-ammos-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-lg">{notification.title}</h3>
                      <p className="text-sm text-gray-600">{notification.description}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`${notification.id}-dashboard`}
                        checked={notification.dashboard}
                        onCheckedChange={(checked) => updateNotification(notification.id, 'dashboard', checked)}
                      />
                      <Label htmlFor={`${notification.id}-dashboard`} className="flex items-center gap-1">
                        <Bell className="w-3 h-3" />
                        Dashboard
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`${notification.id}-email`}
                        checked={notification.email}
                        onCheckedChange={(checked) => updateNotification(notification.id, 'email', checked)}
                      />
                      <Label htmlFor={`${notification.id}-email`} className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        Email
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`${notification.id}-sms`}
                        checked={notification.sms}
                        onCheckedChange={(checked) => updateNotification(notification.id, 'sms', checked)}
                      />
                      <Label htmlFor={`${notification.id}-sms`} className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        SMS
                      </Label>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-gray-600">Frequency</Label>
                      <Select 
                        value={notification.frequency} 
                        onValueChange={(value: any) => updateNotification(notification.id, 'frequency', value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Immediate</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="primaryEmail">Primary Email</Label>
            <input
              id="primaryEmail"
              type="email"
              defaultValue="admin@ammos.com.au"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ammos-primary"
            />
          </div>
          <div>
            <Label htmlFor="smsNumber">SMS Number (optional)</Label>
            <input
              id="smsNumber"
              type="tel"
              placeholder="+61 4XX XXX XXX"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ammos-primary"
            />
          </div>
          <div>
            <Label htmlFor="backupEmail">Backup Email (optional)</Label>
            <input
              id="backupEmail"
              type="email"
              placeholder="backup@ammos.com.au"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ammos-primary"
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="bg-ammos-primary hover:bg-ammos-primary/90">
        Save Notification Settings
      </Button>
    </div>
  );
};