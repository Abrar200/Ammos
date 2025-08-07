// lib/dmssService.ts
export interface DMSSCredentials {
    server: string;
    port: number;
    username: string;
    password: string;
    protocol: 'http' | 'https';
  }
  
  export interface DMSSQRCredentials {
    server: string;
    port: number;
    qrCode: string;
    deviceId?: string;
    protocol: 'http' | 'https';
  }
  
  export interface Camera {
    id: string;
    name: string;
    location: string;
    channel: number;
    status: 'online' | 'offline' | 'maintenance';
    recording: boolean;
    resolution: string;
    fps: number;
    lastSeen?: string;
  }
  
  export interface DMSSSystemInfo {
    totalCameras: number;
    onlineCameras: number;
    recordingCameras: number;
    storageUsed: number;
    storageTotal: number;
    systemName: string;
    version: string;
    uptime: number;
  }
  
  export interface RecordingInfo {
    id: string;
    cameraId: string;
    startTime: string;
    endTime: string;
    fileSize: number;
    filePath: string;
    recordingType: 'manual' | 'scheduled' | 'motion';
  }
  
  export interface QRCodeData {
    deviceId: string;
    serverAddress: string;
    port: number;
    authToken: string;
    timestamp: number;
  }
  
  class DMSSService {
    private isConnected = false;
    private credentials: DMSSCredentials | null = null;
    private qrCredentials: DMSSQRCredentials | null = null;
    private authMethod: 'password' | 'qr' | null = null;
    private authToken: string | null = null;
    private baseUrl: string | null = null;
  
    async connect(credentials: DMSSCredentials): Promise<boolean> {
      try {
        console.log('🔗 Connecting to DMSS with credentials...', { 
          server: credentials.server, 
          port: credentials.port,
          username: credentials.username 
        });
  
        this.baseUrl = `${credentials.protocol}://${credentials.server}:${credentials.port}`;
        
        const loginResponse = await this.makeRequest('/api/v1/auth/login', 'POST', {
          username: credentials.username,
          password: credentials.password
        });
  
        if (!loginResponse.success) {
          throw new Error(loginResponse.message || 'Authentication failed');
        }
  
        this.authToken = loginResponse.data.token;
        this.credentials = credentials;
        this.authMethod = 'password';
        this.isConnected = true;
  
        console.log('✅ DMSS connection established successfully');
        return true;
  
      } catch (error: any) {
        console.error('❌ DMSS connection failed:', error);
        this.cleanup();
        throw new Error(error.message || 'Failed to connect to DMSS system');
      }
    }
  
    async connectWithQR(qrCredentials: DMSSQRCredentials): Promise<boolean> {
      try {
        console.log('🔗 Connecting to DMSS with QR code...');
  
        const qrData = this.parseQRCode(qrCredentials.qrCode);
        
        this.baseUrl = `${qrCredentials.protocol}://${qrCredentials.server}:${qrCredentials.port}`;
  
        const authResponse = await this.makeRequest('/api/v1/auth/qr-login', 'POST', {
          deviceId: qrData.deviceId,
          authToken: qrData.authToken,
          timestamp: qrData.timestamp,
          clientInfo: {
            platform: 'web',
            version: '1.0.0',
            deviceName: 'Restaurant Dashboard'
          }
        });
  
        if (!authResponse.success) {
          throw new Error(authResponse.message || 'QR authentication failed');
        }
  
        this.authToken = authResponse.data.token;
        this.qrCredentials = qrCredentials;
        this.authMethod = 'qr';
        this.isConnected = true;
  
        console.log('✅ DMSS QR connection established successfully');
        return true;
  
      } catch (error: any) {
        console.error('❌ DMSS QR connection failed:', error);
        this.cleanup();
        throw new Error(error.message || 'Failed to connect using QR code');
      }
    }
  
    async disconnect(): Promise<void> {
      try {
        if (this.isConnected && this.authToken) {
          await this.makeRequest('/api/v1/auth/logout', 'POST');
        }
      } catch (error) {
        console.warn('Warning during disconnect:', error);
      } finally {
        this.cleanup();
      }
    }
  
    private cleanup(): void {
      this.isConnected = false;
      this.credentials = null;
      this.qrCredentials = null;
      this.authMethod = null;
      this.authToken = null;
      this.baseUrl = null;
    }
  
    private parseQRCode(qrCode: string): QRCodeData {
      try {
        try {
          const parsed = JSON.parse(qrCode);
          return {
            deviceId: parsed.deviceId || parsed.id,
            serverAddress: parsed.server || parsed.address,
            port: parsed.port || 37777,
            authToken: parsed.token || parsed.authToken,
            timestamp: parsed.timestamp || Date.now()
          };
        } catch {
          return this.parseEncodedQR(qrCode);
        }
      } catch (error) {
        throw new Error('Invalid QR code format');
      }
    }
  
    private parseEncodedQR(qrCode: string): QRCodeData {
      const parts = qrCode.split(':');
      
      if (parts.length < 4) {
        throw new Error('Invalid QR code format');
      }
  
      return {
        deviceId: parts[0],
        serverAddress: parts[1],
        port: parseInt(parts[2]) || 37777,
        authToken: parts[3],
        timestamp: parts[4] ? parseInt(parts[4]) : Date.now()
      };
    }
  
    async getCameras(): Promise<Camera[]> {
      if (!this.isConnected) throw new Error('Not connected to DMSS');
  
      try {
        const response = await this.makeRequest('/api/v1/cameras');
        
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch cameras');
        }
  
        return response.data.cameras.map((cam: any) => ({
          id: cam.id,
          name: cam.name,
          location: cam.location,
          channel: cam.channel,
          status: cam.online ? 'online' : 'offline',
          recording: cam.recording,
          resolution: cam.resolution || '1920x1080',
          fps: cam.fps || 25,
          lastSeen: cam.lastSeen
        }));
  
      } catch (error: any) {
        console.error('Error fetching cameras:', error);
        throw new Error(error.message || 'Failed to fetch cameras');
      }
    }
  
    async getSystemInfo(): Promise<DMSSSystemInfo> {
      if (!this.isConnected) throw new Error('Not connected to DMSS');
  
      try {
        const response = await this.makeRequest('/api/v1/system/info');
        
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch system info');
        }
  
        const data = response.data;
        return {
          totalCameras: data.totalCameras,
          onlineCameras: data.onlineCameras,
          recordingCameras: data.recordingCameras,
          storageUsed: data.storage.used,
          storageTotal: data.storage.total,
          systemName: data.systemName,
          version: data.version,
          uptime: data.uptime
        };
  
      } catch (error: any) {
        console.error('Error fetching system info:', error);
        throw new Error(error.message || 'Failed to fetch system info');
      }
    }
  
    async startRecording(cameraId: string): Promise<boolean> {
      if (!this.isConnected) throw new Error('Not connected to DMSS');
  
      try {
        const response = await this.makeRequest(`/api/v1/cameras/${cameraId}/record/start`, 'POST');
        return response.success;
      } catch (error) {
        console.error('Error starting recording:', error);
        return false;
      }
    }
  
    async stopRecording(cameraId: string): Promise<boolean> {
      if (!this.isConnected) throw new Error('Not connected to DMSS');
  
      try {
        const response = await this.makeRequest(`/api/v1/cameras/${cameraId}/record/stop`, 'POST');
        return response.success;
      } catch (error) {
        console.error('Error stopping recording:', error);
        return false;
      }
    }
  
    async getRecordings(cameraId: string, startDate: Date, endDate: Date): Promise<RecordingInfo[]> {
      if (!this.isConnected) throw new Error('Not connected to DMSS');
  
      try {
        const response = await this.makeRequest(
          `/api/v1/cameras/${cameraId}/recordings?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
        );
        
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch recordings');
        }
  
        return response.data.recordings;
  
      } catch (error: any) {
        console.error('Error fetching recordings:', error);
        throw new Error(error.message || 'Failed to fetch recordings');
      }
    }
  
    getStreamUrl(cameraId: string): string | null {
      if (!this.isConnected || !this.baseUrl) return null;
      return `${this.baseUrl}/api/v1/cameras/${cameraId}/stream?token=${this.authToken}`;
    }
  
    getThumbnailUrl(cameraId: string): string | null {
      if (!this.isConnected || !this.baseUrl) return null;
      return `${this.baseUrl}/api/v1/cameras/${cameraId}/thumbnail?token=${this.authToken}`;
    }
  
    getConnectionStatus(): boolean {
      return this.isConnected;
    }
  
    getCredentials(): DMSSCredentials | DMSSQRCredentials | null {
      return this.authMethod === 'password' ? this.credentials : this.qrCredentials;
    }
  
    getAuthMethod(): 'password' | 'qr' | null {
      return this.authMethod;
    }
  
    async testConnection(credentials: DMSSCredentials): Promise<{ success: boolean; message: string; systemInfo?: any }> {
      const tempBaseUrl = `${credentials.protocol}://${credentials.server}:${credentials.port}`;
      
      try {
        console.log('🧪 Testing DMSS connection...');
        
        const healthResponse = await this.makeRequestDirect(tempBaseUrl, '/api/v1/health');
        
        if (!healthResponse.ok) {
          throw new Error(`Server unreachable: ${healthResponse.status}`);
        }
  
        const loginResponse = await this.makeRequestDirect(tempBaseUrl, '/api/v1/auth/login', 'POST', {
          username: credentials.username,
          password: credentials.password
        });
  
        const loginData = await loginResponse.json();
  
        if (!loginResponse.ok || !loginData.success) {
          throw new Error(loginData.message || 'Authentication failed');
        }
  
        const systemResponse = await this.makeRequestDirect(
          tempBaseUrl, 
          '/api/v1/system/info',
          'GET',
          null,
          { 'Authorization': `Bearer ${loginData.data.token}` }
        );
  
        const systemData = await systemResponse.json();
  
        return {
          success: true,
          message: 'Connection successful',
          systemInfo: systemData.data
        };
  
      } catch (error: any) {
        console.error('Connection test failed:', error);
        return {
          success: false,
          message: error.message || 'Connection test failed'
        };
      }
    }
  
    async testQRConnection(qrCredentials: DMSSQRCredentials): Promise<{ success: boolean; message: string; systemInfo?: any }> {
      const tempBaseUrl = `${qrCredentials.protocol}://${qrCredentials.server}:${qrCredentials.port}`;
      
      try {
        console.log('🧪 Testing DMSS QR connection...');
        
        const qrData = this.parseQRCode(qrCredentials.qrCode);
        
        const healthResponse = await this.makeRequestDirect(tempBaseUrl, '/api/v1/health');
        
        if (!healthResponse.ok) {
          throw new Error(`Server unreachable: ${healthResponse.status}`);
        }
  
        const authResponse = await this.makeRequestDirect(tempBaseUrl, '/api/v1/auth/qr-login', 'POST', {
          deviceId: qrData.deviceId,
          authToken: qrData.authToken,
          timestamp: qrData.timestamp
        });
  
        const authData = await authResponse.json();
  
        if (!authResponse.ok || !authData.success) {
          throw new Error(authData.message || 'QR authentication failed');
        }
  
        return {
          success: true,
          message: 'QR connection successful',
          systemInfo: { method: 'qr', deviceId: qrData.deviceId }
        };
  
      } catch (error: any) {
        console.error('QR connection test failed:', error);
        return {
          success: false,
          message: error.message || 'QR connection test failed'
        };
      }
    }
  
    private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any): Promise<any> {
      if (!this.baseUrl) throw new Error('No base URL configured');
      
      return this.makeRequestDirect(this.baseUrl, endpoint, method, data, {
        'Authorization': `Bearer ${this.authToken}`
      });
    }
  
    private async makeRequestDirect(
      baseUrl: string, 
      endpoint: string, 
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
      data?: any,
      headers: Record<string, string> = {}
    ): Promise<any> {
      const url = `${baseUrl}${endpoint}`;
      
      const requestConfig: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...headers
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout using AbortSignal
      };
  
      if (data && method !== 'GET') {
        requestConfig.body = JSON.stringify(data);
      }
  
      const response = await fetch(url, requestConfig);
      
      if (method === 'GET' || headers['Authorization']) {
        return response.json();
      }
      
      return response;
    }
  }
  
  export const dmssService = new DMSSService();
  export default dmssService;