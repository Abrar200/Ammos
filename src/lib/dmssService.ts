// lib/dmssService.ts
// DMSS Surveillance System Integration Service

interface DMSSCredentials {
    server: string;
    port: number;
    username: string;
    password: string;
    protocol: 'http' | 'https';
  }
  
  interface Camera {
    id: string;
    name: string;
    location: string;
    status: 'online' | 'offline' | 'maintenance';
    recording: boolean;
    channel: number;
    deviceId: string;
    streamUrl?: string;
    thumbnailUrl?: string;
    resolution: string;
    fps: number;
    lastSeen?: string;
  }
  
  interface RecordingInfo {
    cameraId: string;
    startTime: string;
    endTime: string;
    fileSize: number;
    downloadUrl: string;
  }
  
  interface DMSSSystemInfo {
    isConnected: boolean;
    serverVersion: string;
    totalCameras: number;
    onlineCameras: number;
    recordingCameras: number;
    storageUsed: number;
    storageTotal: number;
  }
  
  class DMSSService {
    private credentials: DMSSCredentials | null = null;
    private isConnected = false;
    private mockMode = true; // Set to false for real DMSS integration
  
    // Mock data for development
    private mockCameras: Camera[] = [
      {
        id: 'cam_001',
        name: 'Front Entrance',
        location: 'Main Door',
        status: 'online',
        recording: true,
        channel: 1,
        deviceId: 'DVR001',
        resolution: '1920x1080',
        fps: 25,
        lastSeen: new Date().toISOString(),
        streamUrl: 'rtmp://demo-server/live/cam1',
        thumbnailUrl: '/api/camera/cam_001/thumbnail'
      },
      {
        id: 'cam_002',
        name: 'Cash Register',
        location: 'Counter Area',
        status: 'online',
        recording: true,
        channel: 2,
        deviceId: 'DVR001',
        resolution: '1920x1080',
        fps: 25,
        lastSeen: new Date().toISOString(),
        streamUrl: 'rtmp://demo-server/live/cam2',
        thumbnailUrl: '/api/camera/cam_002/thumbnail'
      },
      {
        id: 'cam_003',
        name: 'Kitchen Area',
        location: 'Kitchen',
        status: 'online',
        recording: true,
        channel: 3,
        deviceId: 'DVR001',
        resolution: '1280x720',
        fps: 15,
        lastSeen: new Date().toISOString(),
        streamUrl: 'rtmp://demo-server/live/cam3',
        thumbnailUrl: '/api/camera/cam_003/thumbnail'
      },
      {
        id: 'cam_004',
        name: 'Storage Room',
        location: 'Back Storage',
        status: 'offline',
        recording: false,
        channel: 4,
        deviceId: 'DVR001',
        resolution: '1280x720',
        fps: 15,
        lastSeen: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        streamUrl: 'rtmp://demo-server/live/cam4',
        thumbnailUrl: '/api/camera/cam_004/thumbnail'
      },
      {
        id: 'cam_005',
        name: 'Parking Area',
        location: 'Outside',
        status: 'online',
        recording: true,
        channel: 5,
        deviceId: 'DVR002',
        resolution: '1920x1080',
        fps: 30,
        lastSeen: new Date().toISOString(),
        streamUrl: 'rtmp://demo-server/live/cam5',
        thumbnailUrl: '/api/camera/cam_005/thumbnail'
      },
      {
        id: 'cam_006',
        name: 'Dining Area',
        location: 'Main Dining',
        status: 'maintenance',
        recording: false,
        channel: 6,
        deviceId: 'DVR002',
        resolution: '1920x1080',
        fps: 25,
        lastSeen: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        streamUrl: 'rtmp://demo-server/live/cam6',
        thumbnailUrl: '/api/camera/cam_006/thumbnail'
      }
    ];
  
    async connect(credentials: DMSSCredentials): Promise<boolean> {
      console.log('🔗 Connecting to DMSS server...', {
        server: credentials.server,
        port: credentials.port,
        username: credentials.username
      });
  
      if (this.mockMode) {
        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        this.credentials = credentials;
        this.isConnected = true;
        
        console.log('✅ DMSS connection established (mock mode)');
        return true;
      }
  
      try {
        // Real DMSS API connection would go here
        const response = await fetch(`${credentials.protocol}://${credentials.server}:${credentials.port}/api/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: credentials.username,
            password: credentials.password
          })
        });
  
        if (!response.ok) {
          throw new Error(`DMSS connection failed: ${response.statusText}`);
        }
  
        const result = await response.json();
        
        if (result.success) {
          this.credentials = credentials;
          this.isConnected = true;
          console.log('✅ DMSS connection established');
          return true;
        } else {
          throw new Error('Invalid credentials');
        }
      } catch (error) {
        console.error('❌ DMSS connection failed:', error);
        this.isConnected = false;
        return false;
      }
    }
  
    async disconnect(): Promise<void> {
      console.log('🔌 Disconnecting from DMSS...');
      
      if (this.mockMode) {
        this.isConnected = false;
        this.credentials = null;
        console.log('✅ DMSS disconnected (mock mode)');
        return;
      }
  
      if (this.credentials && this.isConnected) {
        try {
          await fetch(`${this.credentials.protocol}://${this.credentials.server}:${this.credentials.port}/api/logout`, {
            method: 'POST'
          });
        } catch (error) {
          console.error('Error during DMSS logout:', error);
        }
      }
  
      this.isConnected = false;
      this.credentials = null;
      console.log('✅ DMSS disconnected');
    }
  
    async getCameras(): Promise<Camera[]> {
      if (!this.isConnected) {
        throw new Error('Not connected to DMSS system');
      }
  
      if (this.mockMode) {
        // Simulate random status changes
        return this.mockCameras.map(camera => ({
          ...camera,
          lastSeen: camera.status === 'online' ? new Date().toISOString() : camera.lastSeen
        }));
      }
  
      try {
        const response = await fetch(`${this.credentials!.protocol}://${this.credentials!.server}:${this.credentials!.port}/api/cameras`);
        const data = await response.json();
        return data.cameras || [];
      } catch (error) {
        console.error('Error fetching cameras:', error);
        return [];
      }
    }
  
    async getCamera(cameraId: string): Promise<Camera | null> {
      const cameras = await this.getCameras();
      return cameras.find(cam => cam.id === cameraId) || null;
    }
  
    async startRecording(cameraId: string): Promise<boolean> {
      console.log(`▶️ Starting recording for camera ${cameraId}`);
      
      if (this.mockMode) {
        const camera = this.mockCameras.find(cam => cam.id === cameraId);
        if (camera) {
          camera.recording = true;
          return true;
        }
        return false;
      }
  
      try {
        const response = await fetch(`${this.credentials!.protocol}://${this.credentials!.server}:${this.credentials!.port}/api/cameras/${cameraId}/record`, {
          method: 'POST',
          body: JSON.stringify({ action: 'start' })
        });
        return response.ok;
      } catch (error) {
        console.error('Error starting recording:', error);
        return false;
      }
    }
  
    async stopRecording(cameraId: string): Promise<boolean> {
      console.log(`⏹️ Stopping recording for camera ${cameraId}`);
      
      if (this.mockMode) {
        const camera = this.mockCameras.find(cam => cam.id === cameraId);
        if (camera) {
          camera.recording = false;
          return true;
        }
        return false;
      }
  
      try {
        const response = await fetch(`${this.credentials!.protocol}://${this.credentials!.server}:${this.credentials!.port}/api/cameras/${cameraId}/record`, {
          method: 'POST',
          body: JSON.stringify({ action: 'stop' })
        });
        return response.ok;
      } catch (error) {
        console.error('Error stopping recording:', error);
        return false;
      }
    }
  
    async getSystemInfo(): Promise<DMSSSystemInfo> {
      if (!this.isConnected) {
        throw new Error('Not connected to DMSS system');
      }
  
      if (this.mockMode) {
        const onlineCameras = this.mockCameras.filter(cam => cam.status === 'online').length;
        const recordingCameras = this.mockCameras.filter(cam => cam.recording).length;
        
        return {
          isConnected: true,
          serverVersion: 'DMSS v4.2.1',
          totalCameras: this.mockCameras.length,
          onlineCameras,
          recordingCameras,
          storageUsed: 2.3, // TB
          storageTotal: 8.0 // TB
        };
      }
  
      try {
        const response = await fetch(`${this.credentials!.protocol}://${this.credentials!.server}:${this.credentials!.port}/api/system/info`);
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching system info:', error);
        throw error;
      }
    }
  
    async getRecordings(cameraId: string, startDate: Date, endDate: Date): Promise<RecordingInfo[]> {
      console.log(`📹 Fetching recordings for camera ${cameraId}`, { startDate, endDate });
      
      if (this.mockMode) {
        // Generate mock recordings
        const recordings: RecordingInfo[] = [];
        const current = new Date(startDate);
        
        while (current <= endDate) {
          if (Math.random() > 0.3) { // 70% chance of having a recording
            const endTime = new Date(current.getTime() + 3600000); // 1 hour recording
            recordings.push({
              cameraId,
              startTime: current.toISOString(),
              endTime: endTime.toISOString(),
              fileSize: Math.floor(Math.random() * 500) + 100, // 100-600 MB
              downloadUrl: `/api/recordings/${cameraId}/${current.getTime()}.mp4`
            });
          }
          current.setHours(current.getHours() + 1);
        }
        
        return recordings;
      }
  
      try {
        const response = await fetch(
          `${this.credentials!.protocol}://${this.credentials!.server}:${this.credentials!.port}/api/cameras/${cameraId}/recordings?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
        );
        const data = await response.json();
        return data.recordings || [];
      } catch (error) {
        console.error('Error fetching recordings:', error);
        return [];
      }
    }
  
    async testConnection(): Promise<boolean> {
      if (!this.credentials) return false;
      
      try {
        const response = await fetch(`${this.credentials.protocol}://${this.credentials.server}:${this.credentials.port}/api/ping`);
        return response.ok;
      } catch (error) {
        return false;
      }
    }
  
    getConnectionStatus(): boolean {
      return this.isConnected;
    }
  
    getCredentials(): DMSSCredentials | null {
      return this.credentials;
    }
  
    // Stream URL helpers
    getStreamUrl(cameraId: string): string | null {
      if (!this.isConnected) return null;
      
      const camera = this.mockCameras.find(cam => cam.id === cameraId);
      if (!camera) return null;
      
      if (this.mockMode) {
        // Return a placeholder stream URL for development
        return `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`;
      }
      
      return `${this.credentials!.protocol}://${this.credentials!.server}:${this.credentials!.port}/stream/${cameraId}`;
    }
  
    getThumbnailUrl(cameraId: string): string | null {
      if (!this.isConnected) return null;
      
      if (this.mockMode) {
        // Return placeholder thumbnail
        return `https://picsum.photos/320/240?random=${cameraId}`;
      }
      
      return `${this.credentials!.protocol}://${this.credentials!.server}:${this.credentials!.port}/thumbnail/${cameraId}`;
    }
  }
  
  // Export singleton instance
  export const dmssService = new DMSSService();
  export type { Camera, DMSSCredentials, DMSSSystemInfo, RecordingInfo };