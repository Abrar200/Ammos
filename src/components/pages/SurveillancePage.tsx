import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DMSSSetupDialog } from '../DMSSSetupDialog';
import { CameraViewDialog } from '../CameraViewDialog';
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
  Video,
  Users,
  Server
} from 'lucide-react';

export const SurveillancePage = () => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [systemInfo, setSystemInfo] = useState<DMSSSystemInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [cameraViewOpen, setCameraViewOpen] = useState(false);
  const { toast } = useToast();

  const isConnected = dmssService.getConnectionStatus();

  useEffect(() => {
    if (isConnected) {
      refreshData();
      // Set up periodic refresh
      const interval = setInterval(refreshData, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const refreshData = async () => {
    if (!isConnected) return;

    setLoading(true);
    try {
      console.log('🔄 Refreshing surveillance data...');
      
      const [camerasData, systemData] = await Promise.all([
        dmssService.getCameras(),
        dmssService.getSystemInfo()
      ]);

      setCameras(camerasData);
      setSystemInfo(systemData);
      
      console.log('✅ Data refreshed:', { cameras: camerasData.length, system: systemData });
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh surveillance data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecordingToggle = async (cameraId: string, currentRecording: boolean) => {
    try {
      const camera = cameras.find(cam => cam.id === cameraId);
      if (!camera) return;

      console.log(`🎬 Toggling recording for ${camera.name}...`);

      // Optimistic update
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
      } else {
        // Revert optimistic update on failure
        setCameras(prev => prev.map(cam => 
          cam.id === cameraId 
            ? { ...cam, recording: currentRecording }
            : cam
        ));
        throw new Error('Failed to toggle recording');
      }
    } catch (error) {
      console.error('❌ Error toggling recording:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle recording',
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

  const formatStorage = (used: number, total: number) => {
    const percentage = (used / total) * 100;
    return {
      used: used.toFixed(1),
      total: total.toFixed(1),
      percentage: percentage.toFixed(1)
    };
  };

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Surveillance System</h1>
            <p className="text-muted-foreground">
              Monitor and manage your DMSS surveillance cameras
            </p>
          </div>
          <Button onClick={() => setSetupDialogOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Setup DMSS
          </Button>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No DMSS system connected. Please configure your surveillance system to get started.
          </AlertDescription>
        </Alert>

        <Card className="border-dashed">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <CameraIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>Connect Your DMSS System</CardTitle>
            <CardDescription>
              Set up your surveillance system connection to start monitoring cameras, managing recordings, and viewing live feeds.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => setSetupDialogOpen(true)} size="lg">
              <Settings className="h-4 w-4 mr-2" />
              Configure DMSS Connection
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Surveillance System</h1>
          <p className="text-muted-foreground">
            Monitor and manage your DMSS surveillance cameras
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={refreshData} 
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

      {/* System Overview */}
      {systemInfo && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cameras</CardTitle>
              <CameraIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemInfo.totalCameras}</div>
              <p className="text-xs text-muted-foreground">
                {systemInfo.onlineCameras} online
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recording</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemInfo.recordingCameras}</div>
              <p className="text-xs text-muted-foreground">
                cameras active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatStorage(systemInfo.storageUsed, systemInfo.storageTotal).percentage}%
              </div>
              <p className="text-xs text-muted-foreground">
                {formatStorage(systemInfo.storageUsed, systemInfo.storageTotal).used}TB / {formatStorage(systemInfo.storageUsed, systemInfo.storageTotal).total}TB used
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Online</div>
              <p className="text-xs text-muted-foreground">
                {systemInfo.serverVersion}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Camera Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Cameras</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Wifi className="h-3 w-3 mr-1" />
              Online
            </Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </Badge>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              <Settings className="h-3 w-3 mr-1" />
              Maintenance
            </Badge>
          </div>
        </div>

        {cameras.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="text-center py-12">
              <CameraIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Cameras Found</h3>
              <p className="text-muted-foreground mb-4">
                No cameras are currently detected on your DMSS system.
              </p>
              <Button onClick={refreshData} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cameras.map((camera) => (
              <Card key={camera.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{camera.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <Monitor className="h-3 w-3" />
                        {camera.location}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={getStatusBadgeVariant(camera.status)}
                      className="flex items-center gap-1"
                    >
                      {getStatusIcon(camera.status)}
                      {camera.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Camera Preview */}
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                    {camera.status === 'online' && camera.thumbnailUrl ? (
                      <img 
                        src={dmssService.getThumbnailUrl(camera.id) || undefined}
                        alt={camera.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <CameraIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                    
                    {/* Recording Indicator */}
                    {camera.recording && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded text-xs">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        REC
                      </div>
                    )}
                  </div>

                  {/* Camera Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Resolution:</span>
                      <span>{camera.resolution}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">FPS:</span>
                      <span>{camera.fps}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Channel:</span>
                      <span>{camera.channel}</span>
                    </div>
                    {camera.lastSeen && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Seen:</span>
                        <span>{new Date(camera.lastSeen).toLocaleTimeString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleViewCamera(camera)}
                      disabled={camera.status !== 'online'}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    
                    <Button
                      size="sm"
                      variant={camera.recording ? "destructive" : "default"}
                      onClick={() => handleRecordingToggle(camera.id, camera.recording)}
                      disabled={camera.status !== 'online'}
                      className="flex-1"
                    >
                      {camera.recording ? (
                        <>
                          <Pause className="h-4 w-4 mr-1" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-1" />
                          Record
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

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