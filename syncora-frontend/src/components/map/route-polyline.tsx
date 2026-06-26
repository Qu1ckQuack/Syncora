'use client';

import { useEffect, useRef } from 'react';
import { Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

interface RoutePolylineProps {
  from: [number, number];
  to: [number, number];
  color?: string;
}

export function RoutePolyline({
  from,
  to,
  color = '#7B2FF7',
}: RoutePolylineProps) {
  const map = useMap();
  const arrowRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (arrowRef.current) {
      arrowRef.current.remove();
      arrowRef.current = null;
    }

    const midLat = (from[0] + to[0]) / 2;
    const midLng = (from[1] + to[1]) / 2;
    const angle = Math.atan2(to[0] - from[0], to[1] - from[1]) * (180 / Math.PI);

    const arrowIcon = L.divIcon({
      className: 'route-arrow',
      html: `
        <div style="
          width: 12px; height: 12px;
          transform: rotate(${angle}deg);
        ">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="${color}" xmlns="http://www.w3.org/2000/svg">
            <polygon points="0,0 12,6 0,12 2,6" />
          </svg>
        </div>
      `,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });

    const arrow = L.marker([midLat, midLng], { icon: arrowIcon, interactive: false }).addTo(map);
    arrowRef.current = arrow;

    return () => {
      if (arrowRef.current) {
        arrowRef.current.remove();
        arrowRef.current = null;
      }
    };
  }, [from[0], from[1], to[0], to[1], color, map]);

  return (
    <Polyline
      positions={[from, to]}
      pathOptions={{
        color,
        weight: 2.5,
        opacity: 0.6,
        dashArray: '8 6',
      }}
    />
  );
}
