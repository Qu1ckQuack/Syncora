'use client';

import { useEffect } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { TechnicianStatus } from '@/lib/types';

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
}

export function TechnicianMarker({
  id,
  name,
  status,
  latitude,
  longitude,
  accuracy,
  jobCount,
}: TechnicianMarkerProps) {
  const map = useMap();

  useEffect(() => {
    const icon = L.divIcon({
      className: 'technician-marker',
      html: `<div style="
        width: 24px; height: 24px;
        background: ${statusColors[status]};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
      ">
        <span style="color: white; font-size: 10px; font-weight: bold;">${name.charAt(0).toUpperCase()}</span>
      </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -14],
    });

    const marker = L.marker([latitude, longitude], { icon }).addTo(map);

    let popupHtml = `
      <div style="font-family: system-ui, sans-serif; min-width: 150px;">
        <div style="font-weight: 600; font-size: 14px;">${name}</div>
        <div style="font-size: 11px; color: #999; margin-top: 4px;">
          Status: ${status.toLowerCase()}
    `;
    if (accuracy) {
      popupHtml += `<br/>Accuracy: ±${accuracy.toFixed(1)}m`;
    }
    if (jobCount !== undefined) {
      popupHtml += `<br/>Active Jobs: ${jobCount}`;
    }
    popupHtml += `</div></div>`;

    marker.bindPopup(popupHtml);

    return () => {
      marker.remove();
    };
  }, [id, latitude, longitude, status, name, accuracy, jobCount, map]);

  return null;
}
