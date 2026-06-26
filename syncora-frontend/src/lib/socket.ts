'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getSocket, disconnectSocket } from './socket-client';
import { useToastStore } from './toast-store';
import { useConnectionStore } from './use-connection-status';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from './auth-store';

type SocketStatus = 'connected' | 'disconnected' | 'reconnecting';

export function useSocket(onEvent?: () => void) {
  const [status, setStatus] = useState<SocketStatus>('disconnected');
  const qc = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const handleStatusChange = useCallback((newStatus: SocketStatus) => {
    setStatus(newStatus);
    if (newStatus === 'reconnecting') {
      addToast({ type: 'warning', title: 'Reconnecting…', duration: 3000 });
    }
  }, [addToast]);

  const notify = useCallback(() => {
    onEventRef.current?.();
  }, []);

  const setConnectionStatus = useConnectionStore((s) => s.setStatus);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      setStatus('connected');
      setConnectionStatus('connected');
      addToast({ type: 'success', title: 'Connected', duration: 2000 });
    };
    const onDisconnect = () => {
      setStatus('disconnected');
      setConnectionStatus('disconnected');
    };
    const onReconnectAttempt = () => {
      handleStatusChange('reconnecting');
      setConnectionStatus('reconnecting');
    };
    const onReconnect = () => {
      setStatus('connected');
      setConnectionStatus('connected');
      addToast({ type: 'success', title: 'Reconnected', duration: 2000 });
    };

    const notifyAnd = <T,>(fn: (payload?: T) => void) => (payload?: T) => { fn(payload); notify(); };

    const onStatusChanged = notifyAnd(() => qc.invalidateQueries({ queryKey: ['work-orders'] }));
    const onAssigned = notifyAnd(() => {
      qc.invalidateQueries({ queryKey: ['work-orders'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    });
    const onNotification = notifyAnd(() => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    });
    const onLocationUpdate = notifyAnd(() => {
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.role === 'CUSTOMER') return;
      qc.invalidateQueries({ queryKey: ['locations'] });
    });
    const onEvidenceAdded = notifyAnd((payload?: { workOrderId?: string }) => {
      qc.invalidateQueries({ queryKey: ['work-orders'] });
      if (payload?.workOrderId) {
        qc.invalidateQueries({ queryKey: ['work-orders', payload.workOrderId] });
        qc.invalidateQueries({ queryKey: ['evidence', payload.workOrderId] });
      } else {
        qc.invalidateQueries({ queryKey: ['evidence'] });
      }
    });

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect_attempt', onReconnectAttempt);
    socket.io.on('reconnect', onReconnect);
    socket.on('workOrder.statusChanged', onStatusChanged);
    socket.on('workOrder.assigned', onAssigned);
    socket.on('notification.new', onNotification);
    socket.on('location.update', onLocationUpdate);
    socket.on('workOrder.evidenceAdded', onEvidenceAdded);

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
      socket.off('workOrder.evidenceAdded', onEvidenceAdded);
    };
  }, [qc, addToast, handleStatusChange, setConnectionStatus]);

  return { status };
}

export function useSocketEvent<T = unknown>(event: string, handler: (data: T) => void) {
  useEffect(() => {
    const socket = getSocket();
    socket.on(event, handler);
    return () => { socket.off(event, handler); };
  }, [event, handler]);
}
