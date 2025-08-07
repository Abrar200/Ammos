// pages/SurveillancePage.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { DMSSSetupDialog } from '@/components/DMSSSetupDialog';
import { CameraViewDialog } from '@/components/CameraViewDialog';
import { useToast } from '@/hooks/use-toast';
import { dmssService, type Camera, type DMSSSystemInfo } from '@/lib/dmssService';
import { 
  Camera as CameraIcon, 
  Monitor, 
  AlertTriangle, 
  Settings, 
  Play, 
  Pause, 
  Eye,
  Wifi,
  WifiOff,
  HardDrive,
  Activity,
  RefreshCw,
  ShieldAlert,
  Clock,
  Signal,
  Power,
  Lock,
  QrCode
} from 'lucide-react';

export const SurveillancePage = () => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [systemInfo, setSystemInfo] = useState<DMSSSystemInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [cameraViewOpen, setCameraViewOpen] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const { toast } = useToast();

  const isConnected = dmssService.getConnectionStatus();
  const authMethod = dmssService.getAuthMethod();

  useEffect(() => {
    if (isConnected) {
      refreshData();
      const interval = setInterval(() => {
        refreshData(false);
      }, 30000);
      return () => clearInterval(interval);
    } else {
      setInitialLoading(false);
      setCameras([]);
      setSystemInfo(null);
      setConnectionError(null);
    }
  }, [isConnected]);

  const refreshData = async (showToast = true) => {
    if (!isConnected) return;

    setLoading(true);
    setConnectionError(null);
    
    try {
      console.log('🔄 Refreshing surveillance data...');
      
      const [camerasData, systemData] = await Promise.all([
        dmssService.getCameras(),
        dmssService.getSystemInfo()
      ]);

      setCameras(camerasData);
      setSystemInfo(systemData);
      setLastRefresh(new Date());
      
      console.log('✅ Data refreshed:', { 
        cameras: camerasData.length, 
        system: systemData.systemName 
      });

      if (showToast) {
        toast({
          title: 'Data Refreshed',
          description: `Updated ${camerasData.length} cameras and system status`,
        });
      }

    } catch (error: any) {
      console.error('❌ Error refreshing data:', error);
      setConnectionError(error.message);
      
      if (error.message?.includes('authentication') || error.message?.includes('unauthorized')) {
        await dmssService.disconnect();
        setSetupDialogOpen(true);
      }
      
      if (showToast) {
        toast({
          title: 'Error',
          description: 'Failed to refresh surveillance data',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const handleRecordingToggle = async (cameraId: string, currentRecording: boolean) => {
    try {
      const camera = cameras.find(cam => cam.id === cameraId);
      if (!camera) return;

      console.log(`🎬 ${currentRecording ? 'Stopping' : 'Starting'} recording for ${camera.name}...`);

      setCameras(prev => prev.map(cam => 
        cam.id === cameraId 
          ? { ...cam, recording: !currentRecording }
          : cam
      ));

      let success;
      if (currentRecording) {
        success = await dmssService.stopRecording(cameraId);
      } else {
        success = await dmssService.startRecording(cameraId);
      }

      if (success) {
        toast({
          title: 'Success',
          description: `Recording ${!currentRecording ? 'started' : 'stopped'} for ${camera.name}`
        });
        
        setTimeout(() => refreshData(false), 1000);
      } else {
        setCameras(prev => prev.map(cam => 
          cam.id === cameraId 
            ? { ...cam, recording: currentRecording }
            : cam
        ));
        throw new Error('Failed to toggle recording');
      }
    } catch (error: any) {
      console.error('❌ Error toggling recording:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to toggle recording',
        variant: 'destructive'
      });
    }
  };

  const handleViewCamera = (camera: Camera) => {
    console.log('👁️ Opening camera view for:', camera.name);
    setSelectedCamera(camera);
    setCameraViewOpen(true);
  };

  const handleConnectionSuccess = () => {
    setConnectionError(null);
    refreshData();
  };

  const getStatusBadgeVariant = (status: Camera['status']) => {
    switch (status) {
      case 'online': return 'default';
      case 'offline': return 'destructive';
      case 'maintenance': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: Camera['status']) => {
    switch (status) {
      case 'online': return <Wifi className="h-3 w-3" />;
      case 'offline': return <WifiOff className="h-3 w-3" />;
      case 'maintenance': return <Settings className="h-3 w-3" />;
      default: return <AlertTriangle className="h-3 w-3" />;
    }
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Loading state for initial load
  if (initialLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="aspect-video w-full mb-4" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Not connected view
  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Surveillance System</h1>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CameraIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <CardTitle>No Surveillance System Connected</CardTitle>
            <CardDescription>
              Connect your DMSS surveillance system to monitor your restaurant's security cameras
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Lock className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-blue-900">Username & Password</h4>
                </div>
                <p className="text-sm text-blue-800">
                  Traditional authentication using your DMSS admin credentials
                </p>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <QrCode className="h-5 w-5 text-purple-600" />
                  <h4 className="font-medium text-purple-900">QR Code</h4>
                </div>
                <p className="text-sm text-purple-800">
                  Secure device sharing using your DMSS app's QR code
                </p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">What is DMSS?</h4>
              <p className="text-sm text-gray-800">
                DMSS (Device Management Support System) is a professional surveillance platform 
                that allows you to manage and monitor multiple security cameras from one dashboard.
              </p>
            </div>
            
            <Button onClick={() => setSetupDialogOpen(true)} size="lg">
              <Settings className="h-4 w-4 mr-2" />
              Configure DMSS Integration
            </Button>
          </CardContent>
        </Card>

        <DMSSSetupDialog
          isOpen={setupDialogOpen}
          onOpenChange={setSetupDialogOpen}
          onConnectionSuccess={handleConnectionSuccess}
        />
      </div>
    );
  }

  const storagePercentage = systemInfo ? (systemInfo.storageUsed / systemInfo.storageTotal) * 100 : 0;
  const onlineCameras = cameras.filter(cam => cam.status === 'online').length;
  const recordingCameras = cameras.filter(cam => cam.recording).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Surveillance System</h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-gray-600">Monitor and manage your security cameras</p>
            {lastRefresh && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                Last updated: {lastRefresh.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => refreshData()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setSetupDialogOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Connection Error Alert */}
      {connectionError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Connection Error</p>
                <p className="text-sm">{connectionError}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setSetupDialogOpen(true)}>
                Reconnect
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* System Status */}
      {systemInfo && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">System Status</p>
                  <p className="text-lg font-bold text-green-600">Online</p>
                  {systemInfo.uptime > 0 && (
                    <p className="text-xs text-gray-500">
                      Uptime: {formatUptime(systemInfo.uptime)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CameraIcon className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Cameras</p>
                  <p className="text-lg font-bold">
                    {onlineCameras}/{cameras.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-xs text-gray-500">{onlineCameras} online</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Play className="h-5 w-5 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Recording</p>
                  <p className="text-lg font-bold">{recordingCameras}</p>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <p className="text-xs text-gray-500">Active recordings</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Storage</p>
                  <p className="text-lg font-bold">{storagePercentage.toFixed(0)}%</p>
                  <div className="mt-1">
                    <Progress value={storagePercentage} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">
                      {formatBytes(systemInfo.storageUsed)} / {formatBytes(systemInfo.storageTotal)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Alerts */}
      {systemInfo && (
        <div className="space-y-3">
          {storagePercentage > 90 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Critical:</strong> Storage is {storagePercentage.toFixed(0)}% full. 
                Immediate action required to prevent recording failures.
              </AlertDescription>
            </Alert>
          )}
          
          {storagePercentage > 80 && storagePercentage <= 90 && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                Storage is {storagePercentage.toFixed(0)}% full. 
                Consider archiving old recordings or expanding storage capacity.
              </AlertDescription>
            </Alert>
          )}

          {cameras.filter(cam => cam.status === 'offline').length > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <ShieldAlert className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                {cameras.filter(cam => cam.status === 'offline').length} camera(s) are offline. 
                Check network connections and camera power status.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Camera Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cameras.map((camera) => (
          <Card key={camera.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{camera.name}</CardTitle>
                <Badge variant={getStatusBadgeVariant(camera.status)} className="flex items-center gap-1">
                  {getStatusIcon(camera.status)}
                  {camera.status}
                </Badge>
              </div>
              <CardDescription className="flex items-center justify-between">
                <span>{camera.location}</span>
                <span className="text-xs text-gray-500">{camera.resolution}</span>
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {/* Camera Preview */}
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-4 relative overflow-hidden">
                {camera.status === 'online' ? (
                  <>
                    <img
                      src={dmssService.getThumbnailUrl(camera.id) || undefined}
                      alt={`${camera.name} preview`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                      <div className="text-center text-white">
                        <CameraIcon className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">Live Feed</p>
                      </div>
                    </div>
                    
                    {/* Live indicator */}
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      LIVE
                    </div>
                    
                    {/* Signal strength indicator */}
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      <Signal className="h-3 w-3" />
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <Power className="h-8 w-8 text-red-400 mx-auto mb-2" />
                    <p className="text-sm text-red-500">
                      {camera.status === 'offline' ? 'Camera Offline' : 'Under Maintenance'}
                    </p>
                    {camera.lastSeen && (
                      <p className="text-xs text-gray-500 mt-1">
                        Last seen: {new Date(camera.lastSeen).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-600">
                  {camera.recording ? (
                    <>
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                      Recording
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-gray-400 rounded-full mr-2" />
                      Not Recording
                    </>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewCamera(camera)}
                    disabled={camera.status !== 'online'}
                    title="View camera"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRecordingToggle(camera.id, camera.recording)}
                    disabled={camera.status !== 'online'}
                    title={camera.recording ? 'Stop recording' : 'Start recording'}
                  >
                    {camera.recording ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </Button>
                </div>
              </div>

              {/* Additional Info */}
              <div className="mt-3 pt-3 border-t text-xs text-gray-500 flex justify-between">
                <span>Channel {camera.channel}</span>
                <span>{camera.fps} FPS</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Cameras Message */}
      {cameras.length === 0 && !loading && !connectionError && (
        <Card>
          <CardHeader className="text-center">
            <CameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <CardTitle>No Cameras Found</CardTitle>
            <CardDescription>
              No cameras are currently configured in your DMSS system
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Make sure your cameras are properly connected to your DMSS system and try refreshing.
            </p>
            <Button variant="outline" onClick={() => refreshData()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Cameras
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <DMSSSetupDialog
        isOpen={setupDialogOpen}
        onOpenChange={setSetupDialogOpen}
        onConnectionSuccess={handleConnectionSuccess}
      />

      <CameraViewDialog
        camera={selectedCamera}
        isOpen={cameraViewOpen}
        onOpenChange={setCameraViewOpen}
      />
    </div>
  );
};