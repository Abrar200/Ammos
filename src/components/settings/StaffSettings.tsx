import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Users, DollarSign, Clock, FileText, Bell, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const StaffSettings: React.FC = () => {
  const { toast } = useToast();
  const [staffData, setStaffData] = useState({
    defaultHourlyRate: '25.00',
    maxHoursPerWeek: '38',
    emailNotifications: true,
    smsNotifications: false,
  });

  const [employmentTypes, setEmploymentTypes] = useState([
    'Casual', 'Part-Time', 'Full-Time', 'Contract'
  ]);

  const [awardAgreements, setAwardAgreements] = useState([
    'Restaurant Industry Award', 'Hospitality Industry Award', 'Enterprise Agreement'
  ]);

  const [newEmploymentType, setNewEmploymentType] = useState('');
  const [newAward, setNewAward] = useState('');

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Staff settings have been updated successfully.",
    });
  };

  const addEmploymentType = () => {
    if (newEmploymentType && !employmentTypes.includes(newEmploymentType)) {
      setEmploymentTypes([...employmentTypes, newEmploymentType]);
      setNewEmploymentType('');
    }
  };

  const removeEmploymentType = (type: string) => {
    setEmploymentTypes(employmentTypes.filter(t => t !== type));
  };

  const addAward = () => {
    if (newAward && !awardAgreements.includes(newAward)) {
      setAwardAgreements([...awardAgreements, newAward]);
      setNewAward('');
    }
  };

  const removeAward = (award: string) => {
    setAwardAgreements(awardAgreements.filter(a => a !== award));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Default Rates & Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="defaultRate">Default Hourly Rate (AUD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="defaultRate"
                  type="number"
                  step="0.01"
                  className="pl-10"
                  value={staffData.defaultHourlyRate}
                  onChange={(e) => setStaffData(prev => ({ ...prev, defaultHourlyRate: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="maxHours">Maximum Hours Per Week</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="maxHours"
                  type="number"
                  className="pl-10"
                  value={staffData.maxHoursPerWeek}
                  onChange={(e) => setStaffData(prev => ({ ...prev, maxHoursPerWeek: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Employment Types
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {employmentTypes.map((type) => (
              <Badge key={type} variant="secondary" className="flex items-center gap-1">
                {type}
                <X 
                  className="w-3 h-3 cursor-pointer hover:text-red-500" 
                  onClick={() => removeEmploymentType(type)}
                />
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add employment type"
              value={newEmploymentType}
              onChange={(e) => setNewEmploymentType(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addEmploymentType()}
            />
            <Button onClick={addEmploymentType} variant="outline">Add</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Award / Enterprise Agreements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {awardAgreements.map((award) => (
              <Badge key={award} variant="secondary" className="flex items-center gap-1">
                {award}
                <X 
                  className="w-3 h-3 cursor-pointer hover:text-red-500" 
                  onClick={() => removeAward(award)}
                />
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add award/agreement"
              value={newAward}
              onChange={(e) => setNewAward(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addAward()}
            />
            <Button onClick={addAward} variant="outline">Add</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="emailNotifs">Email Notifications</Label>
              <p className="text-sm text-gray-500">Send staff notifications via email</p>
            </div>
            <Switch
              id="emailNotifs"
              checked={staffData.emailNotifications}
              onCheckedChange={(checked) => setStaffData(prev => ({ ...prev, emailNotifications: checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="smsNotifs">SMS Notifications</Label>
              <p className="text-sm text-gray-500">Send staff notifications via SMS</p>
            </div>
            <Switch
              id="smsNotifs"
              checked={staffData.smsNotifications}
              onCheckedChange={(checked) => setStaffData(prev => ({ ...prev, smsNotifications: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="bg-ammos-primary hover:bg-ammos-primary/90">
        Save Staff Settings
      </Button>
    </div>
  );
};