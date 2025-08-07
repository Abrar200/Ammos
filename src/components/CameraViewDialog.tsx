import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { dmssService, type Camera, type RecordingInfo } from '@/lib/dmssService';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Download,
  Calendar,
  RefreshCw,
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface CameraViewDialogProps {
  camera: Camera | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CameraViewDialog = ({ camera, isOpen, onOpenChange }: CameraViewDialogProps) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [recordings, setRecordings] = useState<RecordingInfo[]>([]);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (camera && isOpen) {
      loadRecordings();
      setStreamError(false);
    }
  }, [camera, isOpen]);

  const loadRecordings = async () => {
    if (!camera) return;

    setLoadingRecordings(true);
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
      
      const recordingData = await dmssService.getRecordings(camera.id, startDate, endDate);
      setRecordings(recordingData);
    } catch (error) {
      console.error('Error loading recordings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recordings',
        variant: 'destructive'
      });
    } finally {
      setLoadingRecordings(false);
    }
  };

  const togglePlayback = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;

    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = async () => {
    if (!videoRef.current) return;

    try {
      if (!isFullscreen) {
        await videoRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const handleStreamError = () => {
    console.error('Stream error for camera:', camera?.name);
    setStreamError(true);
    toast({
      title: 'Stream Error',
      description: `Failed to load live stream for ${camera?.name}`,
      variant: 'destructive'
    });
  };

  const downloadRecording = async (recording: RecordingInfo) => {
    try {
      // In a real implementation, this would trigger a download
      console.log('Downloading recording:', recording);
      toast({
        title: 'Download Started',
        description: 'Recording download has started'
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download recording',
        variant: 'destructive'
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (startTime: string, endTime: string): string => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / 3600000);
    const minutes = Math.floor((durationMs % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  if (!camera) return null;

  const streamUrl = dmssService.getStreamUrl(camera.id);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {camera.name}
              <Badge variant={camera.status === 'online' ? 'default' : 'destructive'}>
                {camera.status}
              </Badge>
            </DialogTitle>
            <div className="text-sm text-gray-500">
              {camera.location} • Channel {camera.channel}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Live Stream */}
          <Card>
            <CardContent className="p-0">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                {camera.status === 'online' && !streamError ? (
                  <>
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      src={streamUrl || undefined}
                      autoPlay
                      muted={isMuted}
                      onError={handleStreamError}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />
                    
                    {/* Live indicator */}
                    <div className="absolute top-4 left-4 bg-red-600 text-white text-sm px-3 py-1 rounded flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      LIVE
                    </div>

                    {/* Recording indicator */}
                    {camera.recording && (
                      <div className="absolute top-4 right-4 bg-red-600 text-white text-sm px-3 py-1 rounded flex items-center gap-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        REC
                      </div>
                    )}

                    {/* Controls overlay */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-black bg-opacity-50 rounded-lg px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-white hover:bg-white hover:bg-opacity-20"
                          onClick={togglePlayback}
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-white hover:bg-white hover:bg-opacity-20"
                          onClick={toggleMute}
                        >
                          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </Button>
                      </div>

                      <div className="text-white text-sm">
                        {camera.resolution} • {camera.fps} FPS
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white hover:bg-opacity-20"
                        onClick={toggleFullscreen}
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-400" />
                      <p className="text-lg font-medium">
                        {streamError ? 'Stream Unavailable' : 'Camera Offline'}
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        {streamError 
                          ? 'Unable to connect to camera stream' 
                          : `Camera is currently ${camera.status}`
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Recordings */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Recordings (24h)</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadRecordings}
                  disabled={loadingRecordings}
                >
                  {loadingRecordings ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh
                </Button>
              </div>

              {loadingRecordings ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading recordings...
                </div>
              ) : recordings.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {recordings.map((recording, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(recording.startTime).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          Duration: {formatDuration(recording.startTime, recording.endTime)} • 
                          Size: {formatFileSize(recording.fileSize)}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadRecording(recording)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No recordings found for the last 24 hours.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};