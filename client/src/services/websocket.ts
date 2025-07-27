import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config';

// WebSocket connects to server root, not API endpoint
const WEBSOCKET_URL = API_BASE_URL.replace('/api', '');

interface BookingUpdate {
  type: 'driver_response' | 'ride_started' | 'ride_completed' | 'booking_created';
  action: string;
  booking: any;
  driver: {
    id: string;
    name: string;
  } | null;
  message: string;
  timestamp: string;
}

interface WebSocketService {
  socket: Socket | null;
  connect: (token: string) => void;
  disconnect: () => void;
  onBookingUpdate: (callback: (data: BookingUpdate) => void) => void;
  onConnection: (callback: () => void) => void;
  onDisconnection: (callback: () => void) => void;
  onError: (callback: (error: string) => void) => void;
  joinAdminRoom: () => void;
}

class WebSocketServiceClass implements WebSocketService {
  socket: Socket | null = null;

  connect(token: string): void {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    console.log('🔌 Connecting to WebSocket server...', WEBSOCKET_URL);
    console.log('🔑 Using token:', token ? `${token.substring(0, 20)}...` : 'No token');
    
    this.socket = io(WEBSOCKET_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected successfully');
      console.log('Socket ID:', this.socket?.id);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
    });

    this.socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting WebSocket...');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinAdminRoom(): void {
    if (this.socket?.connected) {
      console.log('📊 Joining admin dashboard room...');
      this.socket.emit('join_admin_room');
    }
  }

  onBookingUpdate(callback: (data: BookingUpdate) => void): void {
    if (this.socket) {
      // Remove any existing listeners first
      this.socket.off('booking_updated');
      this.socket.on('booking_updated', (data: BookingUpdate) => {
        console.log('📡 Received booking update:', data);
        callback(data);
      });
    }
  }

  onConnection(callback: () => void): void {
    if (this.socket) {
      this.socket.off('connect');
      this.socket.on('connect', callback);
    }
  }

  onDisconnection(callback: () => void): void {
    if (this.socket) {
      this.socket.off('disconnect');
      this.socket.on('disconnect', callback);
    }
  }

  onError(callback: (error: string) => void): void {
    if (this.socket) {
      this.socket.off('connect_error');
      this.socket.off('error');
      
      this.socket.on('connect_error', (error: any) => {
        callback(error.message || 'Connection error');
      });

      this.socket.on('error', (error: any) => {
        callback(error.message || 'WebSocket error');
      });
    }
  }
}

// Create singleton instance
const websocketService = new WebSocketServiceClass();

export default websocketService;
export type { BookingUpdate };