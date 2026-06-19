'use client';

import { useQuery } from '@tanstack/react-query';
import { useConnectionStore } from '@/lib/use-connection-status';
import type { TechnicianLocation } from '@/lib/types';

async function fetchLatestByTechnician(technicianId: string): Promise<TechnicianLocation | null> {
  const res = await fetch(`/api/locations/technician/${technicianId}`);
  if (!res.ok) return null;
  return res.json();
}

async function fetchAllTechnicianLocations(): Promise<(TechnicianLocation & { technician: { id: string; name: string } })[]> {
  const res = await fetch('/api/users?role=TECHNICIAN');
  if (!res.ok) return [];
  const users: { id: string; name: string }[] = await res.json();
  const locations = await Promise.all(
    users.map(async (u) => {
      const loc = await fetchLatestByTechnician(u.id);
      return loc ? { ...loc, technician: u } : null;
    }),
  );
  return locations.filter(Boolean) as (TechnicianLocation & { technician: { id: string; name: string } })[];
}

export function useTechnicianLocations() {
  const wsStatus = useConnectionStore((s) => s.status);
  const shouldPoll = wsStatus !== 'connected';

  return useQuery({
    queryKey: ['locations', 'technicians'],
    queryFn: fetchAllTechnicianLocations,
    refetchInterval: shouldPoll ? 15_000 : 30_000,
  });
}

export function useTechnicianLocation(technicianId: string) {
  const wsStatus = useConnectionStore((s) => s.status);
  const shouldPoll = wsStatus !== 'connected';

  return useQuery({
    queryKey: ['locations', 'technician', technicianId],
    queryFn: () => fetchLatestByTechnician(technicianId),
    refetchInterval: shouldPoll ? 15_000 : 30_000,
  });
}
