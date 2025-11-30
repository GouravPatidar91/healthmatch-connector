import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { deliveryPartnerLocationService } from '@/services/deliveryPartnerLocationService';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different locations
const createIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position: relative;">
        <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 24 16 24s16-15.163 16-24C32 7.163 24.837 0 16 0z" 
                fill="${color}" stroke="white" stroke-width="2"/>
          <circle cx="16" cy="16" r="6" fill="white"/>
        </svg>
        <div style="position: absolute; top: 40px; left: 50%; transform: translateX(-50%); 
                    background: white; padding: 2px 6px; border-radius: 4px; 
                    font-size: 10px; font-weight: bold; white-space: nowrap; 
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);">
          ${label}
        </div>
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });
};

const partnerIcon = createIcon('#10b981', 'Your Location');
const pickupIcon = createIcon('#3b82f6', 'Pickup');
const deliveryIcon = createIcon('#ef4444', 'Delivery');

interface DeliveryRequestMapProps {
  partnerId: string;
  vendorLocation: { latitude: number; longitude: number };
  vendorName: string;
  vendorAddress: string;
  deliveryLocation: { latitude: number; longitude: number };
  deliveryAddress: string;
  customerPhone?: string;
}

export const DeliveryRequestMap: React.FC<DeliveryRequestMapProps> = ({
  partnerId,
  vendorLocation,
  vendorName,
  vendorAddress,
  deliveryLocation,
  deliveryAddress,
  customerPhone,
}) => {
  const [partnerLocation, setPartnerLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    // Get partner's current location
    const loadPartnerLocation = async () => {
      try {
        const location = await deliveryPartnerLocationService.getCurrentLocation(partnerId);
        if (location) {
          setPartnerLocation(location);
        } else {
          // Fallback to browser geolocation
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                setPartnerLocation({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                });
              },
              (error) => {
                console.error('Error getting location:', error);
              }
            );
          }
        }
      } catch (error) {
        console.error('Error loading partner location:', error);
      }
    };

    loadPartnerLocation();
  }, [partnerId]);

  // Calculate center and bounds
  const locations = [
    vendorLocation,
    deliveryLocation,
    ...(partnerLocation ? [partnerLocation] : []),
  ];

  const center: [number, number] = partnerLocation
    ? [partnerLocation.latitude, partnerLocation.longitude]
    : [vendorLocation.latitude, vendorLocation.longitude];

  // Calculate distances
  const distanceToPickup = partnerLocation
    ? deliveryPartnerLocationService.calculateDistance(
        partnerLocation.latitude,
        partnerLocation.longitude,
        vendorLocation.latitude,
        vendorLocation.longitude
      )
    : null;

  const distanceToDelivery = partnerLocation
    ? deliveryPartnerLocationService.calculateDistance(
        partnerLocation.latitude,
        partnerLocation.longitude,
        deliveryLocation.latitude,
        deliveryLocation.longitude
      )
    : null;

  return (
    <div className="space-y-2">
      {/* Distance Info */}
      {partnerLocation && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded">
            <p className="text-muted-foreground">To Pickup</p>
            <p className="font-semibold text-blue-600 dark:text-blue-400">
              {distanceToPickup?.toFixed(1)} km
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-950 p-2 rounded">
            <p className="text-muted-foreground">To Delivery</p>
            <p className="font-semibold text-red-600 dark:text-red-400">
              {distanceToDelivery?.toFixed(1)} km
            </p>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="h-[300px] rounded-lg overflow-hidden border">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          dragging={true}
          zoomControl={true}
          doubleClickZoom={true}
          touchZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Vendor/Pickup Marker */}
          <Marker
            position={[vendorLocation.latitude, vendorLocation.longitude]}
            icon={pickupIcon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{vendorName}</p>
                <p className="text-muted-foreground">{vendorAddress}</p>
              </div>
            </Popup>
          </Marker>

          {/* Delivery Location Marker */}
          <Marker
            position={[deliveryLocation.latitude, deliveryLocation.longitude]}
            icon={deliveryIcon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">Delivery Location</p>
                <p className="text-muted-foreground">{deliveryAddress}</p>
                {customerPhone && (
                  <p className="text-muted-foreground mt-1">📞 {customerPhone}</p>
                )}
              </div>
            </Popup>
          </Marker>

          {/* Partner Location Marker */}
          {partnerLocation && (
            <>
              <Marker
                position={[partnerLocation.latitude, partnerLocation.longitude]}
                icon={partnerIcon}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">Your Current Location</p>
                    <p className="text-muted-foreground">
                      {distanceToPickup?.toFixed(1)} km from pickup
                    </p>
                  </div>
                </Popup>
              </Marker>

              {/* Route line from partner to pickup to delivery */}
              <Polyline
                positions={[
                  [partnerLocation.latitude, partnerLocation.longitude],
                  [vendorLocation.latitude, vendorLocation.longitude],
                  [deliveryLocation.latitude, deliveryLocation.longitude],
                ]}
                color="#8b5cf6"
                weight={3}
                opacity={0.7}
                dashArray="10, 10"
              />
            </>
          )}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex justify-around text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span>You</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Pickup</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Delivery</span>
        </div>
      </div>
    </div>
  );
};
