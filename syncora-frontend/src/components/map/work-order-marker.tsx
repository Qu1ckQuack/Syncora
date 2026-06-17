'use client';

import { useEffect } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { WorkOrderStatus } from '@/lib/types';

const statusColors: Record<WorkOrderStatus, string> = {
  PENDING: '#f59e0b',
  EN_ROUTE: '#3b82f6',
  IN_PROGRESS: '#8b5cf6',
  COMPLETED: '#22c55e',
  DELAYED: '#ef4444',
  CANCELLED: '#6b7280',
};

interface WorkOrderMarkerProps {
  id: string;
  orderNumber: string;
  title: string;
  status: WorkOrderStatus;
  latitude: number;
  longitude: number;
  technicianName?: string | null;
  customerName?: string | null;
}

export function WorkOrderMarker({
  id,
  orderNumber,
  title,
  status,
  latitude,
  longitude,
  technicianName,
  customerName,
}: WorkOrderMarkerProps) {
  const map = useMap();

  useEffect(() => {
    const icon = L.divIcon({
      className: 'work-order-marker',
      html: `<div style="
        width: 16px; height: 16px;
        background: ${statusColors[status]};
        border: 2px solid white;
        border-radius: 4px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      popupAnchor: [0, -10],
    });

    const marker = L.marker([latitude, longitude], { icon }).addTo(map);

    marker.bindPopup(`
      <div style="font-family: system-ui, sans-serif; min-width: 180px;">
        <div style="font-weight: 600; font-size: 14px;">${orderNumber}</div>
        <div style="font-size: 13px; color: #666; margin: 2px 0;">${title}</div>
        <div style="font-size: 11px; color: #999; margin-top: 4px;">
          Status: ${status.toLowerCase().replace('_', ' ')}
          ${technicianName ? `<br/>Technician: ${technicianName}` : ''}
          ${customerName ? `<br/>Customer: ${customerName}` : ''}
        </div>
        <a href="/dashboard/work-orders/${id}" style="
          display: inline-block; margin-top: 6px;
          font-size: 12px; color: #7B2FF7; text-decoration: none;
        ">View details →</a>
      </div>
    `);

    return () => {
      marker.remove();
    };
  }, [id, latitude, longitude, status, orderNumber, title, technicianName, customerName, map]);

  return null;
}
