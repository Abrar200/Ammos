// components/DMSSSetupDialog.tsx - Enhanced Version
import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { dmssService, type DMSSCredentials, type DMSSQRCredentials } from '@/lib/dmssService';
import { QRScanner } from '@/lib/qrScanner';
import { 
  Settings, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  Info,
  Server,
  Lock,
  Network,
  X,
  QrCode,
  Camera,
  Upload,
  Scan,
  Eye,
  EyeOff,
  RefreshCw,
  HelpCircle
} from 'lucide-react';

interface DMSSSetupDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectionSuccess: () => void;
}

export const DMSSSetupDialog = ({ isOpen, onOpenChange, onConnectionSuccess }: DMSSSetupDialogProps) => {
  const [activeTab, setActiveTab] = useState<'password' | 'qr'>('password');
  const [credentials, setCredentials] = useState<DMSSCredentials>({
    server: '',
    port: 37777,
    username: 'admin',
    password: '',
    protocol: 'http'
  });
  const [qrCredentials, setQrCredentials] = useState<DMSSQRCredentials>({
    server: '',
    port: 37777,
    qrCode: '',
    protocol: 'http'
  });
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentStep, setCurrentStep] = useState<'config' | 'test' | 'connected'>('config');
  const [testResults, setTestResults] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [qrDebugInfo, setQrDebugInfo] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleCredentialsChange = (field: keyof DMSSCredentials, value: string | number) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
    resetStatus();
  };

  const handleQrCredentialsChange = (field: keyof DMSSQRCredentials, value: string | number) => {
    setQrCredentials(prev => ({
      ...prev,
      [field]: value
    }));
    resetStatus();
  };

  const resetStatus = () => {
    setConnectionStatus('idle');
    setTestResults(null);
    setErrorMessage('');
    setQrDebugInfo('');
    if (currentStep === 'test') {
      setCurrentStep('config');
    }
  };

  const validatePasswordForm = (): string | null => {
    if (!credentials.server.trim()) {
      return 'Server IP/Domain is required';
    }
    
    // Basic IP validation
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!ipRegex.test(credentials.server) && !domainRegex.test(credentials.server)) {
      return 'Please enter a valid IP address or domain name';
    }
    
    if (!credentials.username.trim()) {
      return 'Username is required';
    }
    if (!credentials.password.trim()) {
      return 'Password is required';
    }
    if (credentials.port < 1 || credentials.port > 65535) {
      return 'Port must be between 1 and 65535';
    }
    return null;
  };

  const validateQrForm = (): string | null => {
    if (!qrCredentials.server.trim()) {
      return 'Server IP/Domain is required';
    }
    if (!qrCredentials.qrCode.trim()) {
      return 'QR Code data is required';
    }
    if (qrCredentials.port < 1 || qrCredentials.port > 65535) {
      return 'Port must be between 1 and 65535';
    }
    return null;
  };

  const testConnection = async () => {
    const validationError = activeTab === 'password' ? validatePasswordForm() : validateQrForm();
    
    if (validationError) {
      toast({
        title: 'Validation Error',
        description: validationError,
        variant: 'destructive'
      });
      return;
    }

    setTesting(true);
    setConnectionStatus('idle');
    setErrorMessage('');
    setTestResults(null);

    try {
      console.log(`🧪 Testing DMSS ${activeTab} connection...`);
      
      let result;
      if (activeTab === 'password') {
        result = await dmssService.testConnection(credentials);
      } else {
        result = await dmssService.testQRConnection(qrCredentials);
      }
      
      if (result.success) {
        setConnectionStatus('success');
        setCurrentStep('test');
        setTestResults(result.systemInfo);
        toast({
          title: 'Connection Successful! 🎉',
          description: 'DMSS system is ready to connect'
        });
      } else {
        setConnectionStatus('error');
        setErrorMessage(result.message);
        toast({
          title: 'Connection Failed',
          description: result.message,
          variant: 'destructive'
        });
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
    setConnecting(true);
    try {
      console.log(`🔗 Finalizing DMSS ${activeTab} connection...`);
      
      let success = false;
      if (activeTab === 'password') {
        success = await dmssService.connect(credentials);
      } else {
        success = await dmssService.connectWithQR(qrCredentials);
      }

      if (success) {
        toast({
          title: 'DMSS Connected Successfully! 🎉',
          description: 'Your surveillance system is now active'
        });
        
        setCurrentStep('connected');
        onConnectionSuccess();
        
        setTimeout(() => {
          onOpenChange(false);
          resetDialog();
        }, 1500);
      } else {
        throw new Error('Connection failed');
      }
      
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
      setCurrentStep('config');
      toast({
        title: 'Disconnected',
        description: 'DMSS system disconnected successfully'
      });
      onConnectionSuccess();
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({
        title: 'Disconnect Error',
        description: 'Failed to disconnect properly',
        variant: 'destructive'
      });
    }
  };

  const handleQrUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a valid image file (JPG, PNG, etc.)',
        variant: 'destructive'
      });
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload an image smaller than 10MB',
        variant: 'destructive'
      });
      return;
    }

    try {
      setTesting(true);
      setUploadProgress('Reading image...');
      setQrDebugInfo('');

      console.log('📷 Processing QR image:', { 
        name: file.name, 
        size: file.size, 
        type: file.type 
      });

      toast({
        title: 'Scanning QR Code',
        description: 'Processing image, please wait...',
      });

      const result = await QRScanner.scanFromFile(file);

      console.log('QR scan result:', result);

      if (result.success && result.data) {
        setUploadProgress('QR code found! Validating...');
        
        const validation = QRScanner.validateDMSSQRCode(result.data);
        
        console.log('QR validation result:', validation);
        setQrDebugInfo(`QR Data Preview: ${result.data.substring(0, 200)}${result.data.length > 200 ? '...' : ''}`);

        if (!validation.valid) {
          toast({
            title: 'Invalid QR Code',
            description: validation.error || 'This doesn\'t appear to be a valid DMSS QR code',
            variant: 'destructive'
          });
          return;
        }

        const serverInfo = QRScanner.extractServerInfo(result.data);
        if (serverInfo.server) {
          setQrCredentials(prev => ({
            ...prev,
            server: serverInfo.server || prev.server,
            port: serverInfo.port || prev.port,
            deviceId: serverInfo.deviceId
          }));
        }

        handleQrCredentialsChange('qrCode', result.data);
        
        toast({
          title: 'QR Code Scanned Successfully! ✅',
          description: 'QR code data extracted and validated',
        });

      } else {
        setQrDebugInfo(`Scan failed: ${result.error || 'Unknown error'}`);
        toast({
          title: 'QR Code Not Found',
          description: result.error || 'Could not detect a QR code in this image. Please ensure the QR code is clearly visible and try again.',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('QR upload error:', error);
      setQrDebugInfo(`Error: ${error.message}`);
      toast({
        title: 'Scan Error',
        description: error.message || 'Failed to process QR code image',
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
      setUploadProgress('');
    }
  };

  const generateTestQRCode = () => {
    const testQR = QRScanner.createTestDMSSQRCode("TEST_DEVICE_" + Date.now().toString(36).substr(2, 4).toUpperCase());
    handleQrCredentialsChange('qrCode', testQR);
    setQrDebugInfo(`Generated test QR code with device ID`);
    toast({
      title: 'Test QR Generated',
      description: 'A test QR code has been generated for development purposes',
    });
  };

  const resetDialog = () => {
    setCurrentStep('config');
    setConnectionStatus('idle');
    setErrorMessage('');
    setTestResults(null);
    setActiveTab('password');
    setQrDebugInfo('');
    setUploadProgress('');
    setCredentials({
      server: '',
      port: 37777,
      username: 'admin',
      password: '',
      protocol: 'http'
    });
    setQrCredentials({
      server: '',
      port: 37777,
      qrCode: '',
      protocol: 'http'
    });
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetDialog();
    }
    onOpenChange(open);
  };

  const isConnected = dmssService.getConnectionStatus();
  const currentCredentials = dmssService.getCredentials();
  const authMethod = dmssService.getAuthMethod();

  const getStepIndicator = () => {
    const steps = [
      { id: 'config', label: 'Configure', completed: currentStep !== 'config' },
      { id: 'test', label: 'Test Connection', completed: currentStep === 'connected' },
      { id: 'connected', label: 'Connected', completed: currentStep === 'connected' }
    ];

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
              ${step.completed 
                ? 'bg-green-500 text-white' 
                : currentStep === step.id 
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }
            `}>
              {step.completed ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                index + 1
              )}
            </div>
            <span className={`ml-3 text-sm font-medium ${
              step.completed 
                ? 'text-green-700' 
                : currentStep === step.id 
                  ? 'text-blue-700'
                  : 'text-gray-500'
            }`}>
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div className={`mx-6 h-0.5 w-12 ${
                steps[index + 1].completed ? 'bg-green-300' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] flex flex-col">
        <DialogHeader className="pb-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-semibold">DMSS System Setup</DialogTitle>
                <p className="text-gray-500 mt-1">
                  Configure your surveillance system connection
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleClose(false)}
              className="h-10 w-10 p-0 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {getStepIndicator()}

          {isConnected && currentCredentials && (
            <Alert className="border-green-200 bg-green-50">
              <Wifi className="h-5 w-5 text-green-600" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-green-800">Currently Connected ✅</p>
                    <p className="text-green-700 text-sm">
                      {'server' in currentCredentials ? currentCredentials.server : 'QR Authentication'} 
                      {authMethod === 'password' && `:${currentCredentials.port} (${currentCredentials.username})`}
                      {authMethod === 'qr' && ' - QR Code Authentication'}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleDisconnect}>
                    <WifiOff className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-3">
                    <Network className="h-5 w-5 text-blue-600" />
                    Connection Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'password' | 'qr')} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="password" className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Username & Password
                      </TabsTrigger>
                      <TabsTrigger value="qr" className="flex items-center gap-2">
                        <QrCode className="h-4 w-4" />
                        QR Code
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="password" className="space-y-6 mt-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Server className="h-5 w-5 text-blue-600" />
                          <h4 className="font-medium">Server Configuration</h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="protocol" className="text-sm font-medium">
                              Protocol
                            </Label>
                            <Select
                              value={credentials.protocol}
                              onValueChange={(value: 'http' | 'https') => handleCredentialsChange('protocol', value)}
                              disabled={isConnected}
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="http">HTTP</SelectItem>
                                <SelectItem value="https">HTTPS (Secure)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="port" className="text-sm font-medium">Port</Label>
                            <Input
                              id="port"
                              type="number"
                              min="1"
                              max="65535"
                              value={credentials.port}
                              onChange={(e) => handleCredentialsChange('port', parseInt(e.target.value) || 37777)}
                              placeholder="37777"
                              disabled={isConnected}
                              className="h-11"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="server" className="text-sm font-medium">
                            Server IP Address / Domain
                          </Label>
                          <Input
                            id="server"
                            type="text"
                            value={credentials.server}
                            onChange={(e) => handleCredentialsChange('server', e.target.value)}
                            placeholder="192.168.1.100 or dmss.yourcompany.com"
                            disabled={isConnected}
                            className="h-11"
                          />
                          <p className="text-xs text-gray-500">
                            Enter the IP address or domain name of your DMSS server
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Lock className="h-5 w-5 text-green-600" />
                          <h4 className="font-medium">Authentication</h4>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                          <Input
                            id="username"
                            type="text"
                            value={credentials.username}
                            onChange={(e) => handleCredentialsChange('username', e.target.value)}
                            placeholder="admin"
                            disabled={isConnected}
                            autoComplete="username"
                            className="h-11"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                          <div className="relative">
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              value={credentials.password}
                              onChange={(e) => handleCredentialsChange('password', e.target.value)}
                              placeholder="Enter DMSS admin password"
                              disabled={isConnected}
                              autoComplete="current-password"
                              className="h-11 pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="qr" className="space-y-6 mt-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Server className="h-5 w-5 text-blue-600" />
                          <h4 className="font-medium">Server Configuration</h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="qr-protocol" className="text-sm font-medium">
                              Protocol
                            </Label>
                            <Select
                              value={qrCredentials.protocol}
                              onValueChange={(value: 'http' | 'https') => handleQrCredentialsChange('protocol', value)}
                              disabled={isConnected}
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="http">HTTP</SelectItem>
                                <SelectItem value="https">HTTPS (Secure)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="qr-port" className="text-sm font-medium">Port</Label>
                            <Input
                              id="qr-port"
                              type="number"
                              min="1"
                              max="65535"
                              value={qrCredentials.port}
                              onChange={(e) => handleQrCredentialsChange('port', parseInt(e.target.value) || 37777)}
                              placeholder="37777"
                              disabled={isConnected}
                              className="h-11"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="qr-server" className="text-sm font-medium">
                            Server IP Address / Domain
                          </Label>
                          <Input
                            id="qr-server"
                            type="text"
                            value={qrCredentials.server}
                            onChange={(e) => handleQrCredentialsChange('server', e.target.value)}
                            placeholder="192.168.1.100 or dmss.yourcompany.com"
                            disabled={isConnected}
                            className="h-11"
                          />
                          <p className="text-xs text-gray-500">
                            Enter the same server address from your DMSS system
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <QrCode className="h-5 w-5 text-purple-600" />
                          <h4 className="font-medium">QR Code Authentication</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card className="border-2 border-dashed border-gray-200 hover:border-purple-300 transition-colors">
                            <CardContent className="p-4 text-center">
                              <QrCode className="h-8 w-8 text-purple-500 mx-auto mb-3" />
                              <h5 className="font-medium mb-2">Enter QR Code Data</h5>
                              <p className="text-sm text-gray-600 mb-4">
                                Paste the QR code content from your DMSS app
                              </p>
                              <Textarea
                                placeholder="Paste QR code data here..."
                                value={qrCredentials.qrCode}
                                onChange={(e) => handleQrCredentialsChange('qrCode', e.target.value)}
                                className="min-h-[100px] text-xs"
                                disabled={isConnected}
                              />
                              <div className="mt-2 flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={generateTestQRCode}
                                  disabled={isConnected}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Generate Test
                                </Button>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="border-2 border-dashed border-gray-200 hover:border-blue-300 transition-colors">
                            <CardContent className="p-4 text-center">
                              <Camera className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                              <h5 className="font-medium mb-2">Upload QR Image</h5>
                              <p className="text-sm text-gray-600 mb-4">
                                Take a screenshot and upload the QR code image
                              </p>
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleQrUpload}
                                className="hidden"
                                disabled={isConnected}
                              />
                              <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isConnected || testing}
                                size="sm"
                                className="w-full"
                              >
                                {testing ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <Upload className="h-4 w-4 mr-2" />
                                )}
                                {uploadProgress || 'Choose Image'}
                              </Button>
                            </CardContent>
                          </Card>
                        </div>

                        {qrDebugInfo && (
                          <Alert className="border-blue-200 bg-blue-50">
                            <Info className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-800">
                              <p className="font-medium mb-2">QR Debug Information:</p>
                              <p className="text-xs font-mono bg-blue-100 p-2 rounded break-all">
                                {qrDebugInfo}
                              </p>
                            </AlertDescription>
                          </Alert>
                        )}

                        <Alert className="border-purple-200 bg-purple-50">
                          <HelpCircle className="h-4 w-4 text-purple-600" />
                          <AlertDescription className="text-purple-800">
                            <div className="space-y-2">
                              <p className="font-medium">How to get your QR code:</p>
                              <ol className="text-sm space-y-1 ml-4">
                                <li>1. Open your DMSS mobile app</li>
                                <li>2. Go to "Device Management" or "Add Device"</li>
                                <li>3. Find "My QR Code" or "Share Device"</li>
                                <li>4. Copy the QR code data or take a screenshot</li>
                              </ol>
                            </div>
                          </AlertDescription>
                        </Alert>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {connectionStatus === 'success' && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <div className="space-y-2">
                      <p className="font-semibold">Connection Successful! 🎉</p>
                      <p className="text-sm">
                        Your DMSS system is ready to connect. Click "Activate System" to start monitoring.
                      </p>
                      {testResults && (
                        <div className="mt-3 p-3 bg-green-100 rounded text-xs space-y-1">
                          <p><strong>Server:</strong> {testResults.serverAddress || 'Connected'}</p>
                          <p><strong>Port:</strong> {testResults.port || 'Default'}</p>
                          <p><strong>Method:</strong> {testResults.authMethod || 'Unknown'}</p>
                          {testResults.deviceId && (
                            <p><strong>Device ID:</strong> {testResults.deviceId}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {connectionStatus === 'error' && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <div className="space-y-2">
                      <p className="font-semibold">Connection Failed</p>
                      <p className="text-sm whitespace-pre-line">{errorMessage}</p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-base text-blue-800 flex items-center gap-3">
                    <Info className="h-5 w-5" />
                    Setup Guide
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-blue-700 space-y-4">
                  {activeTab === 'password' ? (
                    <div className="space-y-3">
                      <p className="font-medium">Username & Password Setup:</p>
                      <ul className="space-y-2 ml-4">
                        <li className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span>Ensure your DMSS system is powered on and connected to the network</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span>Verify the IP address is correct (usually starts with 192.168.x.x)</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span>Use admin credentials (default username is often "admin")</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span>Port 37777 is the standard DMSS port</span>
                        </li>
                      </ul>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="font-medium">QR Code Setup:</p>
                      <ul className="space-y-2 ml-4">
                        <li className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span>Open your DMSS mobile app and find device sharing</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span>Generate or find your device QR code</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span>Enter server IP manually or extract from QR</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span>Upload screenshot or paste QR data directly</span>
                        </li>
                      </ul>
                    </div>
                  )}
                  
                  <Separator className="bg-blue-200" />
                  
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <p className="text-xs text-blue-800 font-medium">💡 Troubleshooting Tips</p>
                    <p className="text-xs text-blue-700 mt-1">
                      {activeTab === 'password' 
                        ? 'If connection fails, check firewall settings, verify the IP address, and ensure DMSS web interface is enabled.'
                        : 'QR codes contain device sharing information. Make sure the QR code is recent and hasn\'t expired.'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-50 border-gray-200">
                <CardHeader>
                  <CardTitle className="text-base text-gray-800 flex items-center gap-3">
                    <Network className="h-5 w-5" />
                    Authentication Methods
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-700 space-y-3">
                  <div className="flex items-start gap-3">
                    <Lock className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Username & Password</p>
                      <p className="text-xs text-gray-600">Traditional login with admin credentials</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <QrCode className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">QR Code</p>
                      <p className="text-xs text-gray-600">Secure device sharing without passwords</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t flex-shrink-0">
          <div className="text-sm text-gray-500">
            {currentStep === 'config' && `Enter your DMSS ${activeTab === 'password' ? 'credentials' : 'QR code'} to get started`}
            {currentStep === 'test' && 'Connection verified successfully - ready to activate'}
            {currentStep === 'connected' && 'System is now active and monitoring'}
          </div>
          
          <div className="flex gap-3">
            {!isConnected && (
              <>
                {currentStep === 'config' && (
                  <Button
                    onClick={testConnection}
                    disabled={testing || connecting}
                    size="lg"
                    className="min-w-[140px]"
                  >
                    {testing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Scan className="h-4 w-4 mr-2" />
                        Test Connection
                      </>
                    )}
                  </Button>
                )}
                
                {currentStep === 'test' && connectionStatus === 'success' && (
                  <Button
                    onClick={handleConnect}
                    disabled={connecting}
                    size="lg"
                    className="min-w-[140px] bg-green-600 hover:bg-green-700"
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Activating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Activate System
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => handleClose(false)}
              disabled={connecting}
              size="lg"
            >
              {currentStep === 'connected' ? 'Done' : 'Cancel'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};