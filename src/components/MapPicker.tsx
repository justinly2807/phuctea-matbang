'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

interface MapPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationChange: (lat: number, lng: number) => void;
  address?: string;
}

// Fix default marker icon
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function MapPicker({ latitude, longitude, onLocationChange, address }: MapPickerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const defaultLat = latitude || 10.7769;
    const defaultLng = longitude || 106.7009;

    const map = L.map(containerRef.current).setView([defaultLat, defaultLng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const marker = L.marker([defaultLat, defaultLng], {
      draggable: true,
      icon: defaultIcon,
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onLocationChange(pos.lat, pos.lng);
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onLocationChange(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Geocode address
  useEffect(() => {
    if (!address || address.length < 5 || !mapRef.current || !markerRef.current) return;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=vn&limit=1`
        );
        const data = await res.json();
        if (data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          markerRef.current?.setLatLng([lat, lng]);
          mapRef.current?.setView([lat, lng], 16);
          onLocationChange(lat, lng);
        }
      } catch {
        // Ignore geocoding errors
      } finally {
        setIsSearching(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  return (
    <div className="relative">
      <div ref={containerRef} className="w-full h-[200px] rounded-xl overflow-hidden border border-gray-200" />
      {isSearching && (
        <div className="absolute top-2 right-2 bg-white px-3 py-1 rounded-full shadow text-xs text-gray-500">
          Tìm vị trí...
        </div>
      )}
      <p className="text-xs text-gray-400 mt-1 text-center">
        Nhấn hoặc kéo ghim để điều chỉnh vị trí
      </p>
    </div>
  );
}
