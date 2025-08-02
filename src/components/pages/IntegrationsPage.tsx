import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CreditCard, 
  Building2, 
  Users, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Calendar,
  Shield
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'connected' | 'disconnected' | 'error';
  category: string;
}

const integrations: Integration[] = [
  {
    id: 'lightspeed',
    name: 'Lightspeed POS',
    description: 'Connect your POS system for real-time revenue tracking',
    icon: CreditCard,
    status: 'disconnected',
    category: 'POS Systems'
  },
  {
    id: 'westpac',
    name: 'Westpac Banking',
    description: 'Import bank transactions automatically via Open Banking',
    icon: Building2,
    status: 'disconnected',
    category: 'Banking'
  },
  {
    id: 'deputy',
    name: 'Deputy',
    description: 'Sync staff schedules and payroll data',
    icon: Users,
    status: 'disconnected',
    category: 'Payroll'
  },
  {
    id: 'mynowbookit',
    name: 'My Now Book It',
    description: 'Sync reservation and booking data',
    icon: Calendar,
    status: 'disconnected',
    category: 'Reservations'
  },
  {
    id: 'dmss',
    name: 'DMSS',
    description: 'Surveillance application for remote monitoring of security devices',
    icon: Shield,
    status: 'disconnected',
    category: 'Security & Surveillance'
  },
  {
    id: 'xero',
    name: 'Xero Accounting',
    description: 'Sync accounting data and invoices',
    icon: Settings,
    status: 'disconnected',
    category: 'Accounting'
  }
];

export const IntegrationsPage = () => {
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [connectionData, setConnectionData] = useState<Record<string, any>>({});

  const handleConnect = (integrationId: string) => {
    setSelectedIntegration(integrationId);
  };

  const handleSaveConnection = () => {
    // Here you would typically make an API call to save the connection
    console.log('Saving connection for:', selectedIntegration, connectionData);
    setSelectedIntegration(null);
    setConnectionData({});
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Not Connected</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-600 mt-2">Connect your business tools to automate data flow</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          return (
            <Card key={integration.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <CardDescription className="text-sm text-gray-500">
                        {integration.category}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(integration.status)}
                    {getStatusBadge(integration.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{integration.description}</p>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleConnect(integration.id)}
                    variant={integration.status === 'connected' ? 'outline' : 'default'}
                    size="sm"
                  >
                    {integration.status === 'connected' ? 'Reconfigure' : 'Connect'}
                  </Button>
                  {integration.status === 'connected' && (
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedIntegration && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              Connect {integrations.find(i => i.id === selectedIntegration)?.name}
            </CardTitle>
            <CardDescription>
              Enter your connection details below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedIntegration === 'lightspeed' && (
              <>
                <div>
                  <Label htmlFor="api-key">API Key</Label>
                  <Input
                    id="api-key"
                    placeholder="Enter your Lightspeed API key"
                    value={connectionData.apiKey || ''}
                    onChange={(e) => setConnectionData({...connectionData, apiKey: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="store-id">Store ID</Label>
                  <Input
                    id="store-id"
                    placeholder="Enter your store ID"
                    value={connectionData.storeId || ''}
                    onChange={(e) => setConnectionData({...connectionData, storeId: e.target.value})}
                  />
                </div>
              </>
            )}
            
            {selectedIntegration === 'westpac' && (
              <>
                <div>
                  <Label htmlFor="client-id">Client ID</Label>
                  <Input
                    id="client-id"
                    placeholder="Enter your Westpac Open Banking Client ID"
                    value={connectionData.clientId || ''}
                    onChange={(e) => setConnectionData({...connectionData, clientId: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="account-number">Account Number</Label>
                  <Input
                    id="account-number"
                    placeholder="Enter your account number"
                    value={connectionData.accountNumber || ''}
                    onChange={(e) => setConnectionData({...connectionData, accountNumber: e.target.value})}
                  />
                </div>
              </>
            )}

            {selectedIntegration === 'deputy' && (
              <>
                <div>
                  <Label htmlFor="deputy-token">Access Token</Label>
                  <Input
                    id="deputy-token"
                    placeholder="Enter your Deputy access token"
                    value={connectionData.accessToken || ''}
                    onChange={(e) => setConnectionData({...connectionData, accessToken: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="endpoint">Endpoint URL</Label>
                  <Input
                    id="endpoint"
                    placeholder="https://your-company.deputy.com"
                    value={connectionData.endpoint || ''}
                    onChange={(e) => setConnectionData({...connectionData, endpoint: e.target.value})}
                  />
                </div>
              </>
            )}

            {selectedIntegration === 'mynowbookit' && (
              <>
                <div>
                  <Label htmlFor="restaurant-id">Restaurant ID</Label>
                  <Input
                    id="restaurant-id"
                    placeholder="Enter your restaurant ID"
                    value={connectionData.restaurantId || ''}
                    onChange={(e) => setConnectionData({...connectionData, restaurantId: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="api-token">API Token</Label>
                  <Input
                    id="api-token"
                    placeholder="Enter your My Now Book It API token"
                    value={connectionData.apiToken || ''}
                    onChange={(e) => setConnectionData({...connectionData, apiToken: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    placeholder="https://your-app.com/webhooks/mynowbookit"
                    value={connectionData.webhookUrl || ''}
                    onChange={(e) => setConnectionData({...connectionData, webhookUrl: e.target.value})}
                  />
                </div>
              </>
            )}

            {selectedIntegration === 'xero' && (
              <>
                <div>
                  <Label htmlFor="client-id-xero">Client ID</Label>
                  <Input
                    id="client-id-xero"
                    placeholder="Enter your Xero Client ID"
                    value={connectionData.clientId || ''}
                    onChange={(e) => setConnectionData({...connectionData, clientId: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="client-secret">Client Secret</Label>
                  <Input
                    id="client-secret"
                    type="password"
                    placeholder="Enter your Xero Client Secret"
                    value={connectionData.clientSecret || ''}
                    onChange={(e) => setConnectionData({...connectionData, clientSecret: e.target.value})}
                  />
                </div>
              </>
            )}

            {selectedIntegration === 'dmss' && (
              <>
                <div>
                  <Label htmlFor="dmss-server">Server URL</Label>
                  <Input
                    id="dmss-server"
                    placeholder="Enter your DMSS server URL"
                    value={connectionData.serverUrl || ''}
                    onChange={(e) => setConnectionData({...connectionData, serverUrl: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="dmss-username">Username</Label>
                  <Input
                    id="dmss-username"
                    placeholder="Enter your DMSS username"
                    value={connectionData.username || ''}
                    onChange={(e) => setConnectionData({...connectionData, username: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="dmss-password">Password</Label>
                  <Input
                    id="dmss-password"
                    type="password"
                    placeholder="Enter your DMSS password"
                    value={connectionData.password || ''}
                    onChange={(e) => setConnectionData({...connectionData, password: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="device-id">Device ID</Label>
                  <Input
                    id="device-id"
                    placeholder="Enter your security device ID"
                    value={connectionData.deviceId || ''}
                    onChange={(e) => setConnectionData({...connectionData, deviceId: e.target.value})}
                  />
                </div>
              </>
            )}

            <div className="flex space-x-2 pt-4">
              <Button onClick={handleSaveConnection}>Save Connection</Button>
              <Button variant="outline" onClick={() => setSelectedIntegration(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};