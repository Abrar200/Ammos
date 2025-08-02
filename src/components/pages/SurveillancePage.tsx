import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Monitor, AlertTriangle, Settings, Play, Pause } from 'lucide-react';

export const SurveillancePage = () => {
  // Mock data for cameras - in real app this would come from DMSS integration
  const cameras = [
    { id: 1, name: 'Front Entrance', status: 'online', location: 'Main Door', recording: true },
    { id: 2, name: 'Cash Register', status: 'online', location: 'Counter Area', recording: true },
    { id: 3, name: 'Storage Room', status: 'offline', location: 'Back Storage', recording: false },
    { id: 4, name: 'Parking Area', status: 'online', location: 'Outside', recording: true },
  ];

  const isIntegrated = false; // This would check if DMSS is connected

  if (!isIntegrated) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Surveillance System</h1>
        </div>

        <Card>
          <CardHeader className="text-center">
            <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <CardTitle>No Surveillance System Connected</CardTitle>
            <CardDescription>
              Connect your DMSS surveillance system to monitor your shop's security cameras
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Configure DMSS Integration
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Surveillance System</h1>
        <Button variant="outline">
          <Monitor className="h-4 w-4 mr-2" />
          View All Cameras
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cameras.map((camera) => (
          <Card key={camera.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{camera.name}</CardTitle>
                <Badge variant={camera.status === 'online' ? 'default' : 'destructive'}>
                  {camera.status}
                </Badge>
              </div>
              <CardDescription>{camera.location}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                {camera.status === 'online' ? (
                  <div className="text-center">
                    <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Live Feed</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                    <p className="text-sm text-red-500">Camera Offline</p>
                  </div>
                )}
              </div>
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
                <Button size="sm" variant="outline">
                  {camera.recording ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};