'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { UserLocationMarker } from './user-location-marker';
import { MapErrorBoundary } from './map-error-boundary';

interface MapContainerWrapperProps {
  center?: [number, number];
  zoom?: number;
  className?: string;
  children: ReactNode;
  whenReady?: () => void;
  enableUserLocation?: boolean;
}

export function MapContainerWrapper({
  center = [40.7128, -74.006],
  zoom = 12,
  className = 'h-full w-full rounded-lg',
  children,
  enableUserLocation = true,
}: MapContainerWrapperProps) {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <MapErrorBoundary>
    <MapContainer
      center={center}
      zoom={zoom}
      className={className}
      ref={mapRef}
      scrollWheelZoom
      zoomControl={false}
    >
      <ZoomControl position="bottomright" />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
      <UserLocationMarker enableTracking={enableUserLocation} />
    </MapContainer>
    </MapErrorBoundary>
  );
}
