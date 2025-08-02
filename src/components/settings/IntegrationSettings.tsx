import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plug, CheckCircle, XCircle, Banknote, ShoppingCart, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const IntegrationSettings: React.FC = () => {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState({
    westpac: { connected: false, apiKey: '', accountNumber: '' },
    lightspeed: { connected: true, apiKey: 'ls_api_key_***', storeId: 'store_123' },
    xero: { connected: false, clientId: '', clientSecret: '' },
    myob: { connected: false, apiKey: '', companyFile: '' },
    quickbooks: { connected: false, clientId: '', clientSecret: '' },
  });

  const handleConnect = (service: string) => {
    setIntegrations(prev => ({
      ...prev,
      [service]: { ...prev[service as keyof typeof prev], connected: true }
    }));
    toast({
      title: "Integration Connected",
      description: `${service.toUpperCase()} has been connected successfully.`,
    });
  };

  const handleDisconnect = (service: string) => {
    setIntegrations(prev => ({
      ...prev,
      [service]: { ...prev[service as keyof typeof prev], connected: false }
    }));
    toast({
      title: "Integration Disconnected",
      description: `${service.toUpperCase()} has been disconnected.`,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="w-5 h-5" />
            Banking Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Banknote className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium">Westpac Open Banking</h3>
                <p className="text-sm text-gray-500">Connect your business account</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {integrations.westpac.connected ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  <XCircle className="w-3 h-3 mr-1" />
                  Disconnected
                </Badge>
              )}
            </div>
          </div>
          
          {!integrations.westpac.connected && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="westpacAccount">Account Number</Label>
                <Input
                  id="westpacAccount"
                  placeholder="Enter your Westpac account number"
                  value={integrations.westpac.accountNumber}
                  onChange={(e) => setIntegrations(prev => ({
                    ...prev,
                    westpac: { ...prev.westpac, accountNumber: e.target.value }
                  }))}
                />
              </div>
              <Button 
                onClick={() => handleConnect('westpac')}
                className="bg-ammos-primary hover:bg-ammos-primary/90"
              >
                Connect Westpac
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            POS Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">Lightspeed POS</h3>
                <p className="text-sm text-gray-500">Sync sales and inventory data</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {integrations.lightspeed.connected ? (
                <>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDisconnect('lightspeed')}
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  <XCircle className="w-3 h-3 mr-1" />
                  Disconnected
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Accounting Software
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {['xero', 'myob', 'quickbooks'].map((service) => (
            <div key={service} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Calculator className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium capitalize">{service}</h3>
                  <p className="text-sm text-gray-500">Sync financial data</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {integrations[service as keyof typeof integrations].connected ? (
                  <>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDisconnect(service)}
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button 
                    size="sm"
                    onClick={() => handleConnect(service)}
                    className="bg-ammos-primary hover:bg-ammos-primary/90"
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};