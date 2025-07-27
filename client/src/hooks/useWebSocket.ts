import { useEffect, useState, useCallback } from 'react';
import websocketService, { BookingUpdate } from '../services/websocket';

interface UseWebSocketReturn {
  isConnected: boolean;
  connectionError: string | null;
  connect: (token: string) => void;
  disconnect: () => void;
  onBookingUpdate: (callback: (data: BookingUpdate) => void) => void;
}

export const useWebSocket = (): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const connect = useCallback((token: string) => {
    websocketService.connect(token);
    
    // Set up connection status listeners
    websocketService.onConnection(() => {
      setIsConnected(true);
      setConnectionError(null);
      websocketService.joinAdminRoom();
    });

    websocketService.onDisconnection(() => {
      setIsConnected(false);
    });

    websocketService.onError((error: string) => {
      setConnectionError(error);
      setIsConnected(false);
    });
  }, []);

  const disconnect = useCallback(() => {
    websocketService.disconnect();
    setIsConnected(false);
    setConnectionError(null);
  }, []);

  const onBookingUpdate = useCallback((callback: (data: BookingUpdate) => void) => {
    websocketService.onBookingUpdate(callback);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      websocketService.disconnect();
    };
  }, []);

  return {
    isConnected,
    connectionError,
    connect,
    disconnect,
    onBookingUpdate
  };
};