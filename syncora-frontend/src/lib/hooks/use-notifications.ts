'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useConnectionStore } from '@/lib/use-connection-status';
import type { Notification, NotificationPreference } from '@/lib/types';

async function fetchNotifications(): Promise<Notification[]> {
  const res = await fetch('/api/notifications', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

async function fetchUnreadCount(): Promise<{ count: number }> {
  const res = await fetch('/api/notifications/unread-count', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch unread count');
  return res.json();
}

async function markRead(id: string) {
  const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH', credentials: 'include' });
  if (!res.ok) throw new Error('Failed to mark notification as read');
  return res.json();
}

async function markAllRead() {
  const res = await fetch('/api/notifications/read-all', { method: 'PATCH', credentials: 'include' });
  if (!res.ok) throw new Error('Failed to mark all as read');
  return res.json();
}

async function fetchPreferences(): Promise<NotificationPreference> {
  const res = await fetch('/api/notifications/preferences', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch notification preferences');
  return res.json();
}

async function updatePreferences(data: Partial<NotificationPreference>): Promise<NotificationPreference> {
  const res = await fetch('/api/notifications/preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to update notification preferences');
  return res.json();
}

export function useNotifications() {
  const wsStatus = useConnectionStore((s) => s.status);
  const shouldPoll = wsStatus !== 'connected';

  return useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    refetchInterval: shouldPoll ? 15_000 : false,
    staleTime: 60000,
  });
}

export function useUnreadCount() {
  const wsStatus = useConnectionStore((s) => s.status);
  const shouldPoll = wsStatus !== 'connected';

  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadCount,
    refetchInterval: shouldPoll ? 15_000 : 30_000,
    staleTime: 10000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notifications', 'preferences'],
    queryFn: fetchPreferences,
    staleTime: 60000,
  });
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updatePreferences,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', 'preferences'] }),
  });
}
