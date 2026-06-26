'use client';

import { useQuery } from '@tanstack/react-query';
import { usePollingQuery } from '@/lib/use-polling-query';
import type {
  AnalyticsOverview,
  CompletionTrend,
  TechnicianPerformance,
  AlertFrequency,
} from '@/lib/types';

async function fetchOverview(): Promise<AnalyticsOverview> {
  const res = await fetch('/api/analytics/overview', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch analytics overview');
  return res.json();
}

async function fetchCompletionTrend(
  days: number,
  period: string,
): Promise<CompletionTrend[]> {
  const res = await fetch(
    `/api/analytics/trends/completion?days=${days}&period=${period}`,
    { credentials: 'include' },
  );
  if (!res.ok) throw new Error('Failed to fetch completion trend');
  return res.json();
}

async function fetchTechnicianPerformance(): Promise<TechnicianPerformance[]> {
  const res = await fetch('/api/analytics/technicians', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch technician performance');
  return res.json();
}

async function fetchAlertFrequency(
  days: number,
): Promise<AlertFrequency[]> {
  const res = await fetch(`/api/analytics/alerts?days=${days}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch alert frequency');
  return res.json();
}

export function useAnalyticsOverview() {
  return usePollingQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: fetchOverview,
    staleTime: 30000,
  });
}

export function useCompletionTrend(days: number, period: string) {
  return useQuery({
    queryKey: ['analytics', 'trends', 'completion', days, period],
    queryFn: () => fetchCompletionTrend(days, period),
    staleTime: 60000,
  });
}

export function useTechnicianPerformance() {
  return useQuery({
    queryKey: ['analytics', 'technicians'],
    queryFn: fetchTechnicianPerformance,
    staleTime: 30000,
  });
}

export function useAlertFrequency(days: number) {
  return useQuery({
    queryKey: ['analytics', 'alerts', days],
    queryFn: () => fetchAlertFrequency(days),
    staleTime: 60000,
  });
}
