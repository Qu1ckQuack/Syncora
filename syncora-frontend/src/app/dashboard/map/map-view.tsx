'use client';

import { MapContainerWrapper } from '@/components/map/map-container';
import { WorkOrderMarker } from '@/components/map/work-order-marker';
import { TechnicianMarker } from '@/components/map/technician-marker';
import type { WorkOrder, TechnicianLocation, Role } from '@/lib/types';

interface MapViewProps {
  workOrders: WorkOrder[];
  technicians: (TechnicianLocation & { technician: { id: string; name: string } })[];
  userRole: Role;
}

export default function MapView({ workOrders, technicians, userRole }: MapViewProps) {
  const center: [number, number] =
    workOrders.length > 0 && workOrders[0].latitude != null && workOrders[0].longitude != null
      ? [workOrders[0].latitude, workOrders[0].longitude]
      : technicians.length > 0
        ? [technicians[0].latitude, technicians[0].longitude]
        : [40.7128, -74.006];

  return (
    <MapContainerWrapper center={center} zoom={11}>
      {workOrders.map((order) =>
        order.latitude != null && order.longitude != null ? (
          <WorkOrderMarker
            key={order.id}
            id={order.id}
            orderNumber={order.orderNumber}
            title={order.title}
            status={order.status}
            latitude={order.latitude}
            longitude={order.longitude}
            technicianName={order.technician?.name}
            customerName={order.customer?.name}
          />
        ) : null,
      )}
      {(userRole === 'MODERATOR' || userRole === 'CUSTOMER') &&
        technicians.map((loc) => (
          <TechnicianMarker
            key={loc.id}
            id={loc.technician.id}
            name={loc.technician.name}
            status="ONLINE"
            latitude={loc.latitude}
            longitude={loc.longitude}
            accuracy={loc.accuracy}
          />
        ))}
    </MapContainerWrapper>
  );
}
