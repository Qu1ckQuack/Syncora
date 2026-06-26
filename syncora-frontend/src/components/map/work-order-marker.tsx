'use client';

import { useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { WorkOrderStatus } from '@/lib/types';
import { escapeHtml } from '@/lib/utils';

const statusColors: Record<WorkOrderStatus, string> = {
  PENDING: '#f59e0b',
  ACCEPTED: '#16a34a',
  DECLINED: '#dc2626',
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
  const color = statusColors[status];

  const icon = useRef(
    L.divIcon({
      className: 'work-order-marker',
      html: `
        <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
          <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0z" fill="${color}" stroke="white" stroke-width="2"/>
            <circle cx="14" cy="14" r="4" fill="white"/>
          </svg>
          <span style="
            margin-top: 1px; font-size: 9px; font-weight: 600; color: #333;
            background: white; padding: 0 4px; border-radius: 4px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.15);
            white-space: nowrap;
          ">${escapeHtml(orderNumber)}</span>
        </div>
      `,
      iconSize: [28, 42],
      iconAnchor: [14, 36],
      popupAnchor: [0, -42],
    }),
  ).current;

  return (
    <Marker position={[latitude, longitude]} icon={icon}>
      <Popup>
        <div className="font-sans min-w-[180px]">
          <div className="font-semibold text-sm">{orderNumber}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{title}</div>
          <div className="text-[11px] text-muted-foreground/80 mt-1">
            <div>Status: {status.toLowerCase().replace('_', ' ')}</div>
            {technicianName && <div>Technician: {technicianName}</div>}
            {customerName && <div>Customer: {customerName}</div>}
          </div>
          <a
            href={`/dashboard/work-orders/${id}`}
            className="inline-block mt-1.5 text-xs text-syncora-500 no-underline hover:underline"
          >
            View details ?
          </a>
        </div>
      </Popup>
    </Marker>
  );
}
