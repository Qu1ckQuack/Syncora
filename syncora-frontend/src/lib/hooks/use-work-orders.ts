'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePollingQuery, useInvalidatingMutation } from '@/lib/use-polling-query';
import type { WorkOrder } from '@/lib/types';

async function fetchWorkOrders(): Promise<WorkOrder[]> {
  const res = await fetch('/api/work-orders', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch work orders');
  return res.json();
}

async function fetchWorkOrder(id: string): Promise<WorkOrder> {
  const res = await fetch(`/api/work-orders/${id}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch work order');
  return res.json();
}

async function updateStatus({
  id,
  status,
  note,
}: {
  id: string;
  status: string;
  note?: string;
}) {
  const res = await fetch(`/api/work-orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, note }),
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Failed to update status');
  }
  return res.json();
}

async function assignTechnician({
  id,
  technicianId,
}: {
  id: string;
  technicianId: string;
}) {
  const res = await fetch(`/api/work-orders/${id}/assign`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ technicianId }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to assign technician');
  return res.json();
}

async function respondToAssignment({
  id,
  action,
}: {
  id: string;
  action: 'accept' | 'decline';
}): Promise<WorkOrder> {
  const res = await fetch(`/api/work-orders/${id}/${action}`, {
    method: 'PATCH',
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Failed to ${action} work order`);
  }
  return res.json();
}

async function createWorkOrder(data: {
  title: string;
  description?: string;
  priority?: string;
  customerId: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  scheduledStart?: string;
  scheduledEnd?: string;
}): Promise<WorkOrder> {
  const res = await fetch('/api/work-orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to create work order');
  return res.json();
}

export function useWorkOrders() {
  return usePollingQuery({
    queryKey: ['work-orders'],
    queryFn: fetchWorkOrders,
  });
}

export function useWorkOrder(id: string) {
  return useQuery({
    queryKey: ['work-orders', id],
    queryFn: () => fetchWorkOrder(id),
    enabled: !!id,
  });
}

export function useUpdateStatus() {
  return useInvalidatingMutation(updateStatus, [['work-orders']]);
}

export function useRespondToAssignment() {
  const queryClient = useQueryClient();
  return useInvalidatingMutation(respondToAssignment, [['work-orders']]);
}

export function useCreateWorkOrder() {
  return useInvalidatingMutation(createWorkOrder, [['work-orders']]);
}

export function useAssignTechnician() {
  return useInvalidatingMutation(assignTechnician, [['work-orders']]);
}
