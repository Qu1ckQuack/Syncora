'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Evidence } from '@/lib/types';

async function fetchEvidence(workOrderId: string): Promise<Evidence[]> {
  const res = await fetch(`/api/work-orders/${workOrderId}/evidence`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Failed to fetch evidence');
  }
  return res.json();
}

async function uploadEvidence({
  workOrderId,
  file,
}: {
  workOrderId: string;
  file: File;
}): Promise<Evidence> {
  const formData = new FormData();
  formData.append('workOrderId', workOrderId);
  formData.append('file', file);

  const res = await fetch('/api/evidence', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Failed to upload evidence');
  }

  return res.json();
}

export function useEvidence(workOrderId: string, enabled = true) {
  return useQuery({
    queryKey: ['evidence', workOrderId],
    queryFn: () => fetchEvidence(workOrderId),
    enabled: enabled && !!workOrderId,
  });
}

export function useUploadEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadEvidence,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['evidence', variables.workOrderId] });
    },
  });
}
