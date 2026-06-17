'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const defaultIcon = L.divIcon({
  className: 'location-picker-marker',
  html: `<div style="
    width: 20px; height: 20px;
    background: #7B2FF7;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  className?: string;
}

function ClickHandler({
  onLocationChange,
}: {
  onLocationChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LocationPicker({
  latitude,
  longitude,
  onLocationChange,
  className = '',
}: LocationPickerProps) {
  const hasLocation = latitude != null && longitude != null;
  const center: [number, number] = hasLocation
    ? [latitude!, longitude!]
    : [40.7128, -74.006];
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (markerRef.current && hasLocation) {
      markerRef.current.setLatLng([latitude!, longitude!]);
    }
  }, [latitude, longitude, hasLocation]);

  return (
    <div className={`rounded-lg overflow-hidden border border-border ${className}`}>
      <MapContainer
        center={center}
        zoom={hasLocation ? 14 : 11}
        className="h-48 w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onLocationChange={onLocationChange} />
        {hasLocation && (
          <Marker
            position={[latitude!, longitude!]}
            icon={defaultIcon}
            ref={markerRef}
          />
        )}
      </MapContainer>
      {hasLocation && (
        <div className="px-3 py-1.5 text-xs text-muted-foreground bg-muted/50">
          {latitude!.toFixed(6)}, {longitude!.toFixed(6)}
        </div>
      )}
    </div>
  );
}
