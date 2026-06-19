'use client';

import { useQuery } from '@tanstack/react-query';
import { useConnectionStore } from '@/lib/use-connection-status';
import type {
  AnalyticsOverview,
  CompletionTrend,
  TechnicianPerformance,
  AlertFrequency,
} from '@/lib/types';

async function fetchOverview(): Promise<AnalyticsOverview> {
  const res = await fetch('/api/analytics/overview');
  if (!res.ok) throw new Error('Failed to fetch analytics overview');
  return res.json();
}

async function fetchCompletionTrend(
  days: number,
  period: string,
): Promise<CompletionTrend[]> {
  const res = await fetch(
    `/api/analytics/trends/completion?days=${days}&period=${period}`,
  );
  if (!res.ok) throw new Error('Failed to fetch completion trend');
  return res.json();
}

async function fetchTechnicianPerformance(): Promise<TechnicianPerformance[]> {
  const res = await fetch('/api/analytics/technicians');
  if (!res.ok) throw new Error('Failed to fetch technician performance');
  return res.json();
}

async function fetchAlertFrequency(
  days: number,
): Promise<AlertFrequency[]> {
  const res = await fetch(`/api/analytics/alerts?days=${days}`);
  if (!res.ok) throw new Error('Failed to fetch alert frequency');
  return res.json();
}

export function useAnalyticsOverview() {
  const wsStatus = useConnectionStore((s) => s.status);
  const shouldPoll = wsStatus !== 'connected';

  return useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: fetchOverview,
    refetchInterval: shouldPoll ? 15_000 : false,
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
