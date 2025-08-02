import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BusinessSettings } from '@/components/settings/BusinessSettings';
import { StaffSettings } from '@/components/settings/StaffSettings';
import { SupplierSettings } from '@/components/settings/SupplierSettings';
import { IntegrationSettings } from '@/components/settings/IntegrationSettings';
import { UserManagement } from '@/components/settings/UserManagement';
import { ComplianceSettings } from '@/components/settings/ComplianceSettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { AuditLogs } from '@/components/settings/AuditLogs';
import { BillingSettings } from '@/components/settings/BillingSettings';
import { 
  Settings, 
  Building2, 
  Users, 
  Truck, 
  Plug, 
  Shield, 
  Bell, 
  Lock, 
  FileText, 
  CreditCard 
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('business');

  const settingsTabs = [
    { id: 'business', label: 'Business', icon: Building2, component: BusinessSettings },
    { id: 'staff', label: 'Staff', icon: Users, component: StaffSettings },
    { id: 'suppliers', label: 'Suppliers', icon: Truck, component: SupplierSettings },
    { id: 'users', label: 'Users', icon: Users, component: UserManagement },
    { id: 'security', label: 'Security', icon: Lock, component: SecuritySettings },
    { id: 'integrations', label: 'Integrations', icon: Plug, component: IntegrationSettings },
    { id: 'compliance', label: 'Compliance', icon: Shield, component: ComplianceSettings },
    { id: 'notifications', label: 'Notifications', icon: Bell, component: NotificationSettings },
    { id: 'billing', label: 'Billing', icon: CreditCard, component: BillingSettings },
    { id: 'audit', label: 'Audit Logs', icon: FileText, component: AuditLogs },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="w-6 h-6 text-ammos-primary" />
        <h1 className="text-2xl font-bold text-ammos-primary">Settings</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
          {settingsTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-1">
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {settingsTabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <tab.icon className="w-5 h-5" />
                  {tab.label} Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <tab.component />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};