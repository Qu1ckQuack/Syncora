'use client';

import { usePollingQuery } from '@/lib/use-polling-query';

interface TechnicianLocationRaw {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: string;
}

export interface TechnicianWithLocation {
  id: string;
  name: string;
  technicianStatus: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: string | null;
  technician: {
    id: string;
    name: string;
    technicianStatus: string | null;
  };
}

interface ApiResponseItem {
  id: string;
  name: string;
  technicianStatus: string | null;
  technicianLocations: TechnicianLocationRaw[];
}

async function fetchAllTechnicianLocations(): Promise<TechnicianWithLocation[]> {
  const res = await fetch('/api/locations/technicians', { credentials: 'include' });
  if (!res.ok) return [];
  const data: ApiResponseItem[] = await res.json();
  return data.map((item) => {
    const loc = item.technicianLocations[0];
    return {
      id: item.id,
      name: item.name,
      technicianStatus: item.technicianStatus,
      latitude: loc?.latitude ?? 0,
      longitude: loc?.longitude ?? 0,
      accuracy: loc?.accuracy ?? null,
      timestamp: loc?.timestamp ?? null,
      technician: {
        id: item.id,
        name: item.name,
        technicianStatus: item.technicianStatus,
      },
    };
  });
}

export function useTechnicianLocations() {
  return usePollingQuery({
    queryKey: ['locations', 'technicians'],
    queryFn: fetchAllTechnicianLocations,
  }, 30_000);
}
