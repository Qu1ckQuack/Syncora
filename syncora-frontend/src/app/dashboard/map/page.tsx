'use client';

import dynamic from 'next/dynamic';
import { useAuthStore } from '@/lib/auth-store';
import { useWorkOrders } from '@/lib/hooks/use-work-orders';
import { useTechnicianLocations } from '@/lib/hooks/use-locations';
import { useSocket } from '@/lib/socket';
import { Skeleton } from '@/components/shared/Skeleton';

const MapView = dynamic(
  () => import('./map-view'),
  { ssr: false, loading: () => <Skeleton className="h-full w-full rounded-lg" /> },
);

export default function MapPage() {
  const user = useAuthStore((s) => s.user);
  const { data: workOrders, isLoading: ordersLoading } = useWorkOrders();
  const { data: techLocations, isLoading: locsLoading } = useTechnicianLocations();
  const { status } = useSocket();

  if (ordersLoading || locsLoading) {
    return (
      <div className="h-[calc(100vh-12rem)]">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    );
  }

  const ordersWithCoords = (workOrders ?? []).filter(
    (o) => o.latitude != null && o.longitude != null,
  );

  const technicians = (techLocations ?? []).filter(
    (l) => l.latitude != null && l.longitude != null,
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Map View</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {ordersWithCoords.length} work orders · {technicians.length} technicians
          <span className="ml-2 inline-flex items-center">
            <span className={`h-2 w-2 rounded-full ${status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="ml-1 text-xs">{status === 'connected' ? 'Live' : 'Offline'}</span>
          </span>
        </p>
      </div>
      <div className="h-[calc(100vh-16rem)] rounded-lg overflow-hidden border border-border">
        <MapView
          workOrders={ordersWithCoords}
          technicians={technicians}
          userRole={user?.role ?? 'CUSTOMER'}
        />
      </div>
    </div>
  );
}
