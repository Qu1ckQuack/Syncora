'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  if (!res.ok) throw new Error('Failed to update status');
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

export function useWorkOrders() {
  return useQuery({
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });
}

async function createWorkOrder(data: {
  title: string;
  description?: string;
  priority?: string;
  customerId: string;
  location?: string;
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

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWorkOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });
}

export function useAssignTechnician() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignTechnician,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });
}
