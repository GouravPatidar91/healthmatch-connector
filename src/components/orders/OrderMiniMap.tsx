import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Store, Home } from 'lucide-react';
import { MapIconSVGs, MapIconColors } from '@/components/maps/MapIcons';
import { MapLegend } from '@/components/maps/MapLegend';

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
  // Custom icons with enhanced styling
  const createCustomIcon = (color: string, iconType: 'shop' | 'home') => {
    const iconSvg = iconType === 'shop' ? MapIconSVGs.shop : MapIconSVGs.home;
    const label = iconType === 'shop' ? 'Pharmacy' : 'Delivery';

    return L.divIcon({
      html: `
        <div style="position: relative;">
          <div style="
            background: linear-gradient(135deg, ${color} 0%, ${color} 100%);
            width: 44px;
            height: 44px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          ">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              ${iconSvg}
            </svg>
          </div>
          <div style="
            position: absolute;
            bottom: -24px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.75);
            color: white;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
            white-space: nowrap;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          ">
            ${label}
          </div>
        </div>`,
      className: 'custom-mini-icon',
      iconSize: [44, 68],
      iconAnchor: [22, 34],
    });
  };

  const pharmacyIcon = createCustomIcon(MapIconColors.shop, 'shop');
  const customerIcon = createCustomIcon(MapIconColors.home, 'home');

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

      {/* Map Legend */}
      <MapLegend />
    </div>
  );
}
