import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { dmssService, type Camera, type RecordingInfo } from '../lib/dmssService';
import { 
  Play, 
  Pause, 
  Square,
  Volume2, 
  VolumeX, 
  Maximize, 
  Download,
  Calendar,
  Clock,
  FileVideo,
  Monitor,
  Wifi,
  Settings,
  RefreshCw,
  Camera as CameraIcon,
  AlertTriangle
} from 'lucide-react';

interface CameraViewDialogProps {
  camera: Camera | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CameraViewDialog = ({ camera, isOpen, onOpenChange }: CameraViewDialogProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [recordings, setRecordings] = useState<RecordingInfo[]>([]);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [volume, setVolume] = useState(50);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (camera && isOpen) {
      loadRecordings();
    }
  }, [camera, isOpen, selectedDate]);

  const loadRecordings = async () => {
    if (!camera) return;

    setLoadingRecordings(true);
    try {
      const date = new Date(selectedDate);
      const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      
      console.log(`📹 Loading recordings for ${camera.name} on ${selectedDate}`);
      const recordingData = await dmssService.getRecordings(camera.id, startDate, endDate);
      setRecordings(recordingData);
      
      console.log(`✅ Loaded ${recordingData.length} recordings`);
    } catch (error) {
      console.error('❌ Error loading recordings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recordings',
        variant: 'destructive'
      });
    } finally {
      setLoadingRecordings(false);
    }
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(error => {
        console.error('Error playing video:', error);
        toast({
          title: 'Playback Error',
          description: 'Failed to start video playback',
          variant: 'destructive'
        });
      });
    }
  };

  const handleMuteToggle = () => {
    if (!videoRef.current) return;
    
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (value: number) => {
    if (!videoRef.current) return;
    
    setVolume(value);
    videoRef.current.volume = value / 100;
  };

  const handleRecordingDownload = (recording: RecordingInfo) => {
    console.log(`⬇️ Downloading recording: ${recording.downloadUrl}`);
    
    // Create a temporary link to trigger download
    const link = document.createElement('a');
    link.href = recording.downloadUrl;
    link.download = `${camera?.name}_${new Date(recording.startTime).toISOString().split('T')[0]}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Download Started',
      description: `Downloading recording from ${new Date(recording.startTime).toLocaleString()}`
    });
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  const formatDuration = (startTime: string, endTime: string): string => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = end.getTime() - start.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (!camera) return null;

  const streamUrl = dmssService.getStreamUrl(camera.id);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <CameraIcon className="h-5 w-5" />
            {camera.name}
            <Badge 
              variant={camera.status === 'online' ? 'default' : 'destructive'}
              className="ml-2"
            >
              <Wifi className="h-3 w-3 mr-1" />
              {camera.status}
            </Badge>
            {camera.recording && (
              <Badge variant="destructive" className="ml-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1" />
                Recording
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-1">
            {/* Video Player Section */}
            <div className="lg:col-span-2 space-y-4">
              {/* Live Stream */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Live Stream
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Video Container */}
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    {camera.status === 'online' && streamUrl ? (
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        poster={dmssService.getThumbnailUrl(camera.id) || undefined}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                        onVolumeChange={(e) => {
                          const video = e.target as HTMLVideoElement;
                          setVolume(video.volume * 100);
                          setIsMuted(video.muted);
                        }}
                      >
                        <source src={streamUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <div className="flex items-center justify-center h-full text-white">
                        <div className="text-center">
                          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p className="text-lg font-medium">Camera Offline</p>
                          <p className="text-sm text-gray-400">
                            Cannot display live stream
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Video Controls Overlay */}
                    {camera.status === 'online' && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handlePlayPause}
                            className="text-white hover:bg-white/20"
                          >
                            {isPlaying ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleMuteToggle}
                            className="text-white hover:bg-white/20"
                          >
                            {isMuted ? (
                              <VolumeX className="h-4 w-4" />
                            ) : (
                              <Volume2 className="h-4 w-4" />
                            )}
                          </Button>

                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={volume}
                              onChange={(e) => handleVolumeChange(Number(e.target.value))}
                              className="w-20 accent-white"
                            />
                            <span className="text-xs text-white min-w-[3ch]">
                              {Math.round(volume)}%
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-xs text-white/80">
                            <span>{camera.resolution}</span>
                            <span>•</span>
                            <span>{camera.fps} FPS</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stream Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">Location</Label>
                      <p className="font-medium">{camera.location}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Device ID</Label>
                      <p className="font-medium">{camera.deviceId}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Channel</Label>
                      <p className="font-medium">CH {camera.channel}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Last Seen</Label>
                      <p className="font-medium">
                        {camera.lastSeen ? new Date(camera.lastSeen).toLocaleTimeString() : 'Never'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recordings Section */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileVideo className="h-5 w-5" />
                    Recordings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Date Selector */}
                  <div className="space-y-2">
                    <Label htmlFor="date-select" className="text-sm">Select Date</Label>
                    <div className="flex gap-2">
                      <Input
                        id="date-select"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={loadRecordings}
                        disabled={loadingRecordings}
                      >
                        <RefreshCw className={`h-4 w-4 ${loadingRecordings ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>

                  {/* Recordings List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">
                        Recordings ({recordings.length})
                      </Label>
                      {recordings.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {recordings.reduce((total, r) => total + r.fileSize, 0) > 0 && 
                            formatFileSize(recordings.reduce((total, r) => total + r.fileSize, 0))
                          }
                        </span>
                      )}
                    </div>

                    <ScrollArea className="h-[300px] border rounded-lg p-2">
                      {loadingRecordings ? (
                        <div className="flex items-center justify-center h-32">
                          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : recordings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-center">
                          <FileVideo className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No recordings found for this date
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {recordings.map((recording, index) => (
                            <Card key={index} className="p-3">
                              <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm">
                                      <Calendar className="h-3 w-3 text-muted-foreground" />
                                      <span>
                                        {new Date(recording.startTime).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <Clock className="h-3 w-3 text-muted-foreground" />
                                      <span>
                                        {new Date(recording.startTime).toLocaleTimeString()} - {' '}
                                        {new Date(recording.endTime).toLocaleTimeString()}
                                      </span>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRecordingDownload(recording)}
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                                
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>
                                    Duration: {formatDuration(recording.startTime, recording.endTime)}
                                  </span>
                                  <span>
                                    Size: {formatFileSize(recording.fileSize)}
                                  </span>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>

              {/* Camera Info Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Camera Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          camera.status === 'online' ? 'bg-green-500' : 
                          camera.status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        <span className="font-medium capitalize">{camera.status}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Recording</Label>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          camera.recording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'
                        }`} />
                        <span className="font-medium">
                          {camera.recording ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Resolution</Label>
                      <p className="font-medium">{camera.resolution}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Frame Rate</Label>
                      <p className="font-medium">{camera.fps} FPS</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Channel</Label>
                      <p className="font-medium">Channel {camera.channel}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Device</Label>
                      <p className="font-medium">{camera.deviceId}</p>
                    </div>
                  </div>

                  {camera.streamUrl && (
                    <div className="pt-2 border-t">
                      <Label className="text-xs text-muted-foreground">Stream URL</Label>
                      <p className="text-xs font-mono bg-muted p-2 rounded mt-1 break-all">
                        {camera.streamUrl}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};