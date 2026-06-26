'use client';

import React from 'react';
import { MapContainerWrapper } from '@/components/map/map-container';
import { WorkOrderMarker } from '@/components/map/work-order-marker';
import { TechnicianMarker } from '@/components/map/technician-marker';
import { RoutePolyline } from '@/components/map/route-polyline';
import type { WorkOrder } from '@/lib/types';
import type { TechnicianWithLocation } from '@/lib/hooks/use-locations';

interface MapViewProps {
  workOrders: WorkOrder[];
  technicians: TechnicianWithLocation[];
  userRole?: 'HQ' | 'TECHNICIAN' | 'CUSTOMER' | 'DEALER';
}

function getStatus(loc: TechnicianWithLocation, assignedCount: number): 'ONLINE' | 'BUSY' | 'OFFLINE' {
  if (loc.technician.technicianStatus === 'OFFLINE') return 'OFFLINE';
  if (loc.technician.technicianStatus === 'BUSY') return 'BUSY';
  if (assignedCount > 0) return 'BUSY';
  return 'ONLINE';
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
      {userRole && (userRole === 'HQ' || userRole === 'CUSTOMER') &&
        technicians.map((loc) => {
          const assigned = workOrders.filter(
            (o) =>
              o.latitude != null &&
              o.longitude != null &&
              o.technician?.id === loc.technician.id,
          );
          const assignedOrderCoords: [number, number][] = assigned.map((o) => [o.latitude!, o.longitude!]);
          const status = getStatus(loc, assigned.length);
          return (
            <React.Fragment key={loc.id}>
              {assigned.map((order) => (
                <RoutePolyline
                  key={`${loc.id}-${order.id}`}
                  from={[loc.latitude, loc.longitude]}
                  to={[order.latitude!, order.longitude!]}
                />
              ))}
              <TechnicianMarker
                id={loc.technician.id}
                name={loc.technician.name}
                status={status}
                latitude={loc.latitude}
                longitude={loc.longitude}
                accuracy={loc.accuracy}
                timestamp={loc.timestamp ?? undefined}
                jobCount={assigned.length}
                assignedOrderCoords={assignedOrderCoords}
              />
            </React.Fragment>
          );
        })}
    </MapContainerWrapper>
  );
}
