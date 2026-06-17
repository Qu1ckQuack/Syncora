'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface MapContainerWrapperProps {
  center?: [number, number];
  zoom?: number;
  className?: string;
  children: ReactNode;
  whenReady?: () => void;
}

export function MapContainerWrapper({
  center = [40.7128, -74.006],
  zoom = 12,
  className = 'h-full w-full rounded-lg',
  children,
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
    <MapContainer
      center={center}
      zoom={zoom}
      className={className}
      ref={mapRef}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </MapContainer>
  );
}
