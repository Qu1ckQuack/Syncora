'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Notification } from '@/lib/types';

async function fetchNotifications(): Promise<Notification[]> {
  const res = await fetch('/api/notifications');
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

async function markRead(id: string) {
  const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to mark notification as read');
  return res.json();
}

async function markAllRead() {
  const res = await fetch('/api/notifications/read-all', { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to mark all as read');
  return res.json();
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    refetchInterval: false,
    staleTime: 60000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
