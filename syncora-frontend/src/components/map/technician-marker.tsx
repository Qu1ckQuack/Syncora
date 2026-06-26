'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { TechnicianStatus } from '@/lib/types';
import { escapeHtml } from '@/lib/utils';
import { haversineDistance, formatEta, formatTimeAgo } from '@/lib/geo';

const statusColors: Record<TechnicianStatus, string> = {
  ONLINE: '#22c55e',
  BUSY: '#f59e0b',
  OFFLINE: '#6b7280',
};

interface TechnicianMarkerProps {
  id: string;
  name: string;
  status: TechnicianStatus;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  jobCount?: number;
  timestamp?: string;
  assignedOrderCoords?: [number, number][];
}

export function TechnicianMarker({
  id,
  name,
  status,
  latitude,
  longitude,
  accuracy,
  jobCount,
  timestamp,
  assignedOrderCoords,
}: TechnicianMarkerProps) {
  const [timeAgo, setTimeAgo] = useState(timestamp ? formatTimeAgo(timestamp) : '');
  const markerRef = useRef<L.Marker | null>(null);
  const prevPosRef = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (!timestamp) return;
    setTimeAgo(formatTimeAgo(timestamp));
    const interval = setInterval(() => {
      setTimeAgo(formatTimeAgo(timestamp!));
    }, 30_000);
    return () => clearInterval(interval);
  }, [timestamp]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    const el = marker.getElement();
    if (!el) return;

    const prevPos = prevPosRef.current;
    if (prevPos && (prevPos[0] !== latitude || prevPos[1] !== longitude)) {
      el.style.transition = 'transform 0.8s ease';
    } else if (!prevPos) {
      el.style.transition = 'transform 0.8s ease';
    }
    prevPosRef.current = [latitude, longitude];
  }, [latitude, longitude]);

  const nearestDist = useMemo(
    () =>
      assignedOrderCoords && assignedOrderCoords.length > 0
        ? Math.min(...assignedOrderCoords.map(([lat, lng]) => haversineDistance(latitude, longitude, lat, lng)))
        : null,
    [latitude, longitude, assignedOrderCoords],
  );

  const etaText = nearestDist != null ? formatEta(nearestDist) : null;

  const icon = useMemo(() => {
    const color = statusColors[status];
    return L.divIcon({
      className: 'technician-marker',
      html: `
        <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
          <div style="
            width: 28px; height: 28px;
            background: ${color};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex; align-items: center; justify-content: center;
          ">
            <span style="color:white; font-size:11px; font-weight:bold;">${escapeHtml(name.charAt(0).toUpperCase())}</span>
          </div>
          ${etaText ? `<span style="
            position:absolute; top:-18px;
            background:#333; color:white;
            font-size:9px; font-weight:600;
            padding:1px 5px; border-radius:8px;
            white-space:nowrap; box-shadow:0 1px 3px rgba(0,0,0,0.2);
          ">${escapeHtml(etaText)}</span>` : ''}
          ${timeAgo ? `<span style="
            margin-top:2px;
            font-size:8px; color:#666; background:rgba(255,255,255,0.9);
            padding:0 4px; border-radius:3px; white-space:nowrap;
          ">${escapeHtml(timeAgo)}</span>` : ''}
        </div>
      `,
      iconSize: [28, 42],
      iconAnchor: [14, 36],
      popupAnchor: [0, -42],
    });
  }, [status, name, etaText, timeAgo]);

  return (
    <Marker
      position={[latitude, longitude]}
      icon={icon}
      ref={markerRef}
      riseOnHover
      riseOffset={500}
    >
      <Popup>
        <div className="font-sans min-w-[150px]">
          <div className="font-semibold text-sm">{name}</div>
          <div className="text-[11px] text-muted-foreground mt-1">
            <div>Status: {status.toLowerCase()}</div>
            {etaText && <div>ETA: {etaText}</div>}
            {accuracy != null && <div>Accuracy: ±{accuracy.toFixed(1)}m</div>}
            {jobCount !== undefined && <div>Active Jobs: {jobCount}</div>}
            {timeAgo && <div>Updated: {timeAgo}</div>}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
