'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSocket, disconnectSocket } from './socket-client';
import { useToastStore } from './toast-store';
import { useQueryClient } from '@tanstack/react-query';

type SocketStatus = 'connected' | 'disconnected' | 'reconnecting';

export function useSocket() {
  const [status, setStatus] = useState<SocketStatus>('disconnected');
  const qc = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  const handleStatusChange = useCallback((newStatus: SocketStatus) => {
    setStatus(newStatus);
    if (newStatus === 'reconnecting') {
      addToast({ type: 'warning', title: 'Reconnecting…', duration: 3000 });
    }
  }, [addToast]);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      setStatus('connected');
      addToast({ type: 'success', title: 'Connected', duration: 2000 });
    };
    const onDisconnect = () => setStatus('disconnected');
    const onReconnectAttempt = () => handleStatusChange('reconnecting');
    const onReconnect = () => {
      setStatus('connected');
      addToast({ type: 'success', title: 'Reconnected', duration: 2000 });
    };

    const onStatusChanged = () => qc.invalidateQueries({ queryKey: ['work-orders'] });
    const onAssigned = () => {
      qc.invalidateQueries({ queryKey: ['work-orders'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    };
    const onNotification = () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    };
    const onLocationUpdate = () => {
      qc.invalidateQueries({ queryKey: ['locations'] });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect_attempt', onReconnectAttempt);
    socket.io.on('reconnect', onReconnect);
    socket.on('workOrder.statusChanged', onStatusChanged);
    socket.on('workOrder.assigned', onAssigned);
    socket.on('notification.new', onNotification);
    socket.on('location.update', onLocationUpdate);

    if (socket.connected) setStatus('connected');

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
      socket.io.off('reconnect', onReconnect);
      socket.off('workOrder.statusChanged', onStatusChanged);
      socket.off('workOrder.assigned', onAssigned);
      socket.off('notification.new', onNotification);
      socket.off('location.update', onLocationUpdate);
    };
  }, [qc, addToast, handleStatusChange]);

  return { status };
}

export function useSocketEvent<T = unknown>(event: string, handler: (data: T) => void) {
  useEffect(() => {
    const socket = getSocket();
    socket.on(event, handler);
    return () => { socket.off(event, handler); };
  }, [event, handler]);
}
