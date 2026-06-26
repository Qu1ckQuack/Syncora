'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePollingQuery, useInvalidatingMutation } from '@/lib/use-polling-query';
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
  return usePollingQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    staleTime: 60000,
  });
}

export function useUnreadCount() {
  return usePollingQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadCount,
    staleTime: 10000,
  }, 30_000);
}

export function useMarkRead() {
  return useInvalidatingMutation(markRead as (id: string) => Promise<unknown>, [
    ['notifications'],
    ['notifications', 'unread-count'],
  ]);
}

export function useMarkAllRead() {
  return useInvalidatingMutation(markAllRead, [
    ['notifications'],
    ['notifications', 'unread-count'],
  ]);
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
