import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { dmssService, type DMSSCredentials } from '@/lib/dmssService';
import { Settings, Wifi, WifiOff, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface DMSSSetupDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectionSuccess: () => void;
}

export const DMSSSetupDialog = ({ isOpen, onOpenChange, onConnectionSuccess }: DMSSSetupDialogProps) => {
  const [credentials, setCredentials] = useState<DMSSCredentials>({
    server: 'localhost',
    port: 37777,
    username: 'admin',
    password: '',
    protocol: 'http'
  });
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const { toast } = useToast();

  const handleInputChange = (field: keyof DMSSCredentials, value: string | number) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
    setConnectionStatus('idle');
  };

  const testConnection = async () => {
    setTesting(true);
    setConnectionStatus('idle');
    setErrorMessage('');

    try {
      console.log('🧪 Testing DMSS connection...');
      
      // Validate inputs
      if (!credentials.server || !credentials.username || !credentials.password) {
        throw new Error('Please fill in all required fields');
      }

      // Test connection
      const success = await dmssService.connect(credentials);
      
      if (success) {
        setConnectionStatus('success');
        toast({
          title: 'Connection Successful',
          description: 'Successfully connected to DMSS system'
        });
      } else {
        setConnectionStatus('error');
        setErrorMessage('Failed to connect to DMSS system. Please check your credentials.');
      }
    } catch (error: any) {
      console.error('❌ Connection test failed:', error);
      setConnectionStatus('error');
      setErrorMessage(error.message || 'Connection failed');
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect to DMSS system',
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleConnect = async () => {
    if (connectionStatus !== 'success') {
      await testConnection();
      return;
    }

    setConnecting(true);
    try {
      console.log('🔗 Establishing DMSS connection...');
      
      // Connection already established during test, just finalize
      toast({
        title: 'DMSS Connected',
        description: 'Surveillance system is now active'
      });
      
      onConnectionSuccess();
      onOpenChange(false);
      
    } catch (error: any) {
      console.error('❌ Failed to finalize connection:', error);
      toast({
        title: 'Connection Error',
        description: error.message || 'Failed to establish connection',
        variant: 'destructive'
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await dmssService.disconnect();
      setConnectionStatus('idle');
      toast({
        title: 'Disconnected',
        description: 'DMSS system disconnected'
      });
      onConnectionSuccess();
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  const isConnected = dmssService.getConnectionStatus();
  const currentCredentials = dmssService.getCredentials();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            DMSS System Setup
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Connection Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {isConnected ? (
                    <>
                      <Wifi className="h-4 w-4 text-green-600" />
                      Connected
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-gray-400" />
                      Not Connected
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isConnected && currentCredentials ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Server: {currentCredentials.server}:{currentCredentials.port}
                    </p>
                    <p className="text-sm text-gray-600">
                      User: {currentCredentials.username}
                    </p>
                    <Button size="sm" variant="outline" onClick={handleDisconnect}>
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Configure your DMSS surveillance system connection
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Connection Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="protocol">Protocol</Label>
                  <Select
                    value={credentials.protocol}
                    onValueChange={(value: 'http' | 'https') => handleInputChange('protocol', value)}
                    disabled={isConnected}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="http">HTTP</SelectItem>
                      <SelectItem value="https">HTTPS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    type="number"
                    value={credentials.port}
                    onChange={(e) => handleInputChange('port', parseInt(e.target.value) || 37777)}
                    placeholder="37777"
                    disabled={isConnected}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="server">Server IP/Domain</Label>
                <Input
                  id="server"
                  type="text"
                  value={credentials.server}
                  onChange={(e) => handleInputChange('server', e.target.value)}
                  placeholder="192.168.1.100 or your-dmss-server.com"
                  disabled={isConnected}
                />
              </div>

              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={credentials.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="admin"
                  disabled={isConnected}
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter DMSS password"
                  disabled={isConnected}
                />
              </div>
            </div>

            {/* Connection Status Alert */}
            {connectionStatus === 'success' && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Connection successful! Ready to connect to DMSS system.
                </AlertDescription>
              </Alert>
            )}

            {connectionStatus === 'error' && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Setup Instructions */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-blue-800">Setup Instructions</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-700 space-y-2">
                <p>1. Ensure your DMSS system is running and accessible</p>
                <p>2. Use the default port 37777 for DMSS systems</p>
                <p>3. Enter your DMSS admin credentials</p>
                <p>4. Test the connection before finalizing</p>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Action Buttons - Fixed at bottom */}
        {!isConnected && (
          <div className="flex gap-2 pt-4 border-t flex-shrink-0">
            <Button
              variant="outline"
              onClick={testConnection}
              disabled={testing || connecting}
              className="flex-1"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>
            
            <Button
              onClick={handleConnect}
              disabled={testing || connecting || connectionStatus !== 'success'}
              className="flex-1"
            >
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect'
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};