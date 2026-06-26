'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { getSocket } from '@/lib/socket-client';
import { useAuthStore } from '@/lib/auth-store';
import { useToastStore } from '@/lib/toast-store';
import type { ToastType } from '@/lib/toast-store';

function createBlueDotIcon(): L.DivIcon {
  return L.divIcon({
    className: 'user-location-marker',
    html: `
      <div style="position:relative; width:24px; height:24px;">
        <div style="
          position:absolute; inset:0;
          width:24px; height:24px;
          background:rgba(59,130,246,0.2);
          border-radius:50%;
          animation: pulse-blue 2s ease-in-out infinite;
        "></div>
        <div style="
          position:absolute; top:4px; left:4px;
          width:16px; height:16px;
          background:#3b82f6;
          border:2.5px solid white;
          border-radius:50%;
          box-shadow:0 1px 4px rgba(0,0,0,0.3);
        "></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

const userIcon = createBlueDotIcon();

const geoErrorMessages: Record<number, { title: string; message: string; type: ToastType }> = {
  1: { title: 'Location blocked', message: 'Enable location access in your browser settings to use the map.', type: 'warning' },
  2: { title: 'Location unavailable', message: 'Your device could not determine your position. Try again later.', type: 'error' },
  3: { title: 'Location timed out', message: 'Taking too long to find your location. Try again?', type: 'warning' },
};

interface UserLocationMarkerProps {
  enableTracking?: boolean;
}

export function UserLocationMarker({ enableTracking = true }: UserLocationMarkerProps) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);
  const watcherRef = useRef<number | null>(null);
  const firstFixRef = useRef(true);
  const lastEmitRef = useRef(0);
  const addToast = useToastStore((s) => s.addToast);
  const locatingToastRef = useRef(false);

  useEffect(() => {
    if (!enableTracking || !navigator.geolocation) {
      if (enableTracking) {
        addToast({ type: 'error', title: 'Geolocation not supported', message: 'Your browser does not support location services.', duration: 5000 });
      }
      return;
    }

    if (!locatingToastRef.current) {
      locatingToastRef.current = true;
      addToast({ type: 'info', title: 'Locating you…', duration: 2500 });
    }

    watcherRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        if (!markerRef.current) {
          const marker = L.marker([latitude, longitude], {
            icon: userIcon,
            zIndexOffset: 1000,
          }).addTo(map);
          markerRef.current = marker;
        } else {
          markerRef.current.setLatLng([latitude, longitude]);
        }

        if (firstFixRef.current) {
          firstFixRef.current = false;
          addToast({ type: 'success', title: 'Location found', duration: 2000 });
          map.flyTo([latitude, longitude], map.getZoom() < 13 ? 13 : undefined);
        }

        const user = useAuthStore.getState().user;
        if (user?.role === 'TECHNICIAN') {
          const now = Date.now();
          if (now - lastEmitRef.current >= 1000) {
            lastEmitRef.current = now;
            const socket = getSocket();
            socket.emit('location.update', {
              latitude,
              longitude,
              accuracy: Math.round(accuracy) || undefined,
            });
          }
        }
      },
      (err) => {
        const fallback = { title: 'Location error', message: err.message || 'Unknown error', type: 'error' as ToastType };
        const info = geoErrorMessages[err.code] ?? fallback;
        addToast({ type: info.type, title: info.title, message: info.message, duration: 6000 });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      },
    );

    return () => {
      if (watcherRef.current != null) {
        navigator.geolocation.clearWatch(watcherRef.current);
        watcherRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, [map, enableTracking, addToast]);

  return null;
}
