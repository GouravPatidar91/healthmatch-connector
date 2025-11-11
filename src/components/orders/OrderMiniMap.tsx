import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Store, Home } from 'lucide-react';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface OrderMiniMapProps {
  pharmacyLocation: { lat: number; lng: number };
  pharmacyName: string;
  customerLocation: { lat: number; lng: number };
  customerAddress: string;
  distance?: number;
}

export function OrderMiniMap({
  pharmacyLocation,
  pharmacyName,
  customerLocation,
  customerAddress,
  distance,
}: OrderMiniMapProps) {
  // Custom icons
  const createCustomIcon = (color: string, iconType: 'store' | 'home') => {
    const iconSvg = iconType === 'store'
      ? '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>'
      : '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle>';

    return L.divIcon({
      html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          ${iconSvg}
        </svg>
      </div>`,
      className: 'custom-mini-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  const pharmacyIcon = createCustomIcon('hsl(142, 76%, 36%)', 'store');
  const customerIcon = createCustomIcon('hsl(221, 83%, 53%)', 'home');

  // Calculate center point between pharmacy and customer
  const centerLat = (pharmacyLocation.lat + customerLocation.lat) / 2;
  const centerLng = (pharmacyLocation.lng + customerLocation.lng) / 2;

  // Route coordinates
  const routeCoordinates: [number, number][] = [
    [pharmacyLocation.lat, pharmacyLocation.lng],
    [customerLocation.lat, customerLocation.lng],
  ];

  return (
    <div className="relative w-full h-[300px] rounded-lg overflow-hidden border">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Pharmacy Marker */}
        <Marker position={[pharmacyLocation.lat, pharmacyLocation.lng]} icon={pharmacyIcon}>
          <Popup>
            <div className="text-center">
              <Store className="w-4 h-4 mx-auto mb-1" />
              <strong className="text-sm">{pharmacyName}</strong>
              <p className="text-xs text-muted-foreground">Pharmacy</p>
            </div>
          </Popup>
        </Marker>

        {/* Customer Marker */}
        <Marker position={[customerLocation.lat, customerLocation.lng]} icon={customerIcon}>
          <Popup>
            <div className="text-center">
              <Home className="w-4 h-4 mx-auto mb-1" />
              <strong className="text-sm">Delivery Location</strong>
              <p className="text-xs text-muted-foreground">{customerAddress}</p>
            </div>
          </Popup>
        </Marker>

        {/* Route Line */}
        <Polyline
          positions={routeCoordinates}
          color="hsl(var(--primary))"
          weight={2}
          opacity={0.6}
          dashArray="5, 5"
        />
      </MapContainer>

      {/* Distance Badge */}
      {distance && (
        <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-md border">
          <p className="text-xs font-medium">
            {distance.toFixed(1)} km
          </p>
        </div>
      )}
    </div>
  );
}
