import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Lock, Shield, Clock, Globe, Key, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const SecuritySettings: React.FC = () => {
  const { toast } = useToast();
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: true,
    autoLogoutMinutes: 30,
    ipRestrictionEnabled: false,
    allowedIPs: ['192.168.1.0/24', '10.0.0.0/8'],
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSymbols: true,
    },
    backupFrequency: 'daily',
  });

  const [newIP, setNewIP] = useState('');

  const handleToggle2FA = (enabled: boolean) => {
    setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: enabled }));
    toast({
      title: enabled ? "2FA Enabled" : "2FA Disabled",
      description: enabled ? "Two-factor authentication is now required for all users." : "Two-factor authentication has been disabled.",
    });
  };

  const handleAddIP = () => {
    if (newIP) {
      setSecuritySettings(prev => ({
        ...prev,
        allowedIPs: [...prev.allowedIPs, newIP]
      }));
      setNewIP('');
      toast({
        title: "IP Added",
        description: `${newIP} has been added to allowed IPs.`,
      });
    }
  };

  const handleRemoveIP = (ip: string) => {
    setSecuritySettings(prev => ({
      ...prev,
      allowedIPs: prev.allowedIPs.filter(allowedIP => allowedIP !== ip)
    }));
    toast({
      title: "IP Removed",
      description: `${ip} has been removed from allowed IPs.`,
    });
  };

  const handleSave = () => {
    toast({
      title: "Security Settings Saved",
      description: "Your security preferences have been updated.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Authentication & Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-600">Require 2FA for all user logins</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={securitySettings.twoFactorEnabled}
                onCheckedChange={handleToggle2FA}
              />
              <Badge variant={securitySettings.twoFactorEnabled ? "default" : "secondary"}>
                {securitySettings.twoFactorEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <h3 className="font-medium">Auto Logout</h3>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="autoLogout">Logout after</Label>
              <Select 
                value={securitySettings.autoLogoutMinutes.toString()} 
                onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, autoLogoutMinutes: parseInt(value) }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="480">8 hours</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">of inactivity</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            IP Restrictions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Enable IP Restrictions</h3>
              <p className="text-sm text-gray-600">Only allow access from specific IP addresses</p>
            </div>
            <Switch
              checked={securitySettings.ipRestrictionEnabled}
              onCheckedChange={(enabled) => setSecuritySettings(prev => ({ ...prev, ipRestrictionEnabled: enabled }))}
            />
          </div>

          {securitySettings.ipRestrictionEnabled && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter IP address or range (e.g., 192.168.1.0/24)"
                  value={newIP}
                  onChange={(e) => setNewIP(e.target.value)}
                />
                <Button onClick={handleAddIP} className="bg-ammos-primary hover:bg-ammos-primary/90">
                  Add
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label>Allowed IP Addresses</Label>
                {securitySettings.allowedIPs.map((ip, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-mono text-sm">{ip}</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRemoveIP(ip)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Password Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="minLength">Minimum Password Length</Label>
            <Select 
              value={securitySettings.passwordPolicy.minLength.toString()}
              onValueChange={(value) => setSecuritySettings(prev => ({
                ...prev,
                passwordPolicy: { ...prev.passwordPolicy, minLength: parseInt(value) }
              }))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 characters</SelectItem>
                <SelectItem value="8">8 characters</SelectItem>
                <SelectItem value="10">10 characters</SelectItem>
                <SelectItem value="12">12 characters</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="requireUppercase"
                checked={securitySettings.passwordPolicy.requireUppercase}
                onCheckedChange={(checked) => setSecuritySettings(prev => ({
                  ...prev,
                  passwordPolicy: { ...prev.passwordPolicy, requireUppercase: checked }
                }))}
              />
              <Label htmlFor="requireUppercase">Require uppercase letters</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="requireNumbers"
                checked={securitySettings.passwordPolicy.requireNumbers}
                onCheckedChange={(checked) => setSecuritySettings(prev => ({
                  ...prev,
                  passwordPolicy: { ...prev.passwordPolicy, requireNumbers: checked }
                }))}
              />
              <Label htmlFor="requireNumbers">Require numbers</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="requireSymbols"
                checked={securitySettings.passwordPolicy.requireSymbols}
                onCheckedChange={(checked) => setSecuritySettings(prev => ({
                  ...prev,
                  passwordPolicy: { ...prev.passwordPolicy, requireSymbols: checked }
                }))}
              />
              <Label htmlFor="requireSymbols">Require special characters</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Data Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Backup Frequency</Label>
            <Select 
              value={securitySettings.backupFrequency}
              onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, backupFrequency: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Last Backup:</strong> Today at 2:00 AM
            </p>
            <p className="text-sm text-green-600 mt-1">
              Next backup scheduled for tomorrow at 2:00 AM
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="bg-ammos-primary hover:bg-ammos-primary/90">
        Save Security Settings
      </Button>
    </div>
  );
};