import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL 
  ? import.meta.env.VITE_BACKEND_URL 
  : 'http://localhost:3001';

let socket = null;
const connectionListeners = new Set();
const dataListeners = new Set();
let globalConnected = false;

const getSocketInstance = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    socket.on('connect', () => {
      globalConnected = true;
      connectionListeners.forEach(listener => listener(true));
      console.log('[Socket Singleton] Terhubung ke server.');
    });

    socket.on('disconnect', () => {
      globalConnected = false;
      connectionListeners.forEach(listener => listener(false));
      console.log('[Socket Singleton] Terputus dari server.');
    });

    socket.on('sensor_data', (data) => {
      dataListeners.forEach(listener => listener(data));
    });
  }
  return socket;
};

export const useSocket = (onSensorData) => {
  const [isConnected, setIsConnected] = useState(globalConnected);
  const onSensorDataRef = useRef(onSensorData);

  // Update callback ref to prevent useEffect from re-binding
  useEffect(() => {
    onSensorDataRef.current = onSensorData;
  }, [onSensorData]);

  useEffect(() => {
    const activeSocket = getSocketInstance();
    
    // Sync initial state
    setIsConnected(activeSocket.connected);

    const handleConnectionStatus = (status) => {
      setIsConnected(status);
    };

    const handleIncomingData = (data) => {
      if (onSensorDataRef.current) {
        onSensorDataRef.current(data);
      }
    };

    // Register listeners
    connectionListeners.add(handleConnectionStatus);
    dataListeners.add(handleIncomingData);

    // Cleanup
    return () => {
      connectionListeners.delete(handleConnectionStatus);
      dataListeners.delete(handleIncomingData);
    };
  }, []);

  return { isConnected, socket: socket };
};
