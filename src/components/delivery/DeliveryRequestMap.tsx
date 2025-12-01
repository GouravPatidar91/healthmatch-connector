import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { deliveryPartnerLocationService } from '@/services/deliveryPartnerLocationService';
import { routingService } from '@/services/routingService';

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
  const [actualRouteToPickup, setActualRouteToPickup] = useState<[number, number][]>([]);
  const [actualRouteToDelivery, setActualRouteToDelivery] = useState<[number, number][]>([]);
  const mapRef = useRef<L.Map | null>(null);
  const [userInteracting, setUserInteracting] = useState(false);
  const lastAutoFitTime = useRef<number>(0);

  useEffect(() => {
    // Get partner's current location and subscribe to updates
    const loadPartnerLocation = async () => {
      try {
        const location = await deliveryPartnerLocationService.getCurrentLocation(partnerId);
        if (location) {
          setPartnerLocation(location);
          updateRoutes(location.latitude, location.longitude);
        } else {
          // Fallback to browser geolocation
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const loc = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                };
                setPartnerLocation(loc);
                updateRoutes(loc.latitude, loc.longitude);
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

    // Subscribe to real-time location updates
    const channel = deliveryPartnerLocationService.subscribeToLocationUpdates(
      partnerId,
      (location) => {
        setPartnerLocation(location);
        updateRoutes(location.latitude, location.longitude);
      }
    );

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [partnerId]);

  // Update routes dynamically based on partner location
  const updateRoutes = async (partnerLat: number, partnerLng: number) => {
    try {
      // Fetch route to pickup
      const routeToPickup = await routingService.getRoute(
        { lat: partnerLat, lng: partnerLng },
        { lat: vendorLocation.latitude, lng: vendorLocation.longitude }
      );
      if (routeToPickup.length > 0) {
        setActualRouteToPickup(routeToPickup);
      }

      // Fetch route to delivery
      const routeToDelivery = await routingService.getRoute(
        { lat: partnerLat, lng: partnerLng },
        { lat: deliveryLocation.latitude, lng: deliveryLocation.longitude }
      );
      if (routeToDelivery.length > 0) {
        setActualRouteToDelivery(routeToDelivery);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  // Auto-fit bounds only if user hasn't interacted in last 30 seconds
  useEffect(() => {
    if (mapRef.current && partnerLocation) {
      const now = Date.now();
      const timeSinceLastFit = now - lastAutoFitTime.current;
      
      if (!userInteracting && timeSinceLastFit > 30000) {
        const bounds = L.latLngBounds([
          [partnerLocation.latitude, partnerLocation.longitude],
          [vendorLocation.latitude, vendorLocation.longitude],
          [deliveryLocation.latitude, deliveryLocation.longitude],
        ]);
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        lastAutoFitTime.current = now;
      }
    }
  }, [partnerLocation, vendorLocation, deliveryLocation, userInteracting]);

  // Track user interaction with map
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    let interactionTimeout: NodeJS.Timeout;

    const handleInteraction = () => {
      setUserInteracting(true);
      clearTimeout(interactionTimeout);
      // Reset after 30 seconds of no interaction
      interactionTimeout = setTimeout(() => {
        setUserInteracting(false);
      }, 30000);
    };

    map.on('dragstart', handleInteraction);
    map.on('zoomstart', handleInteraction);
    map.on('movestart', handleInteraction);

    return () => {
      map.off('dragstart', handleInteraction);
      map.off('zoomstart', handleInteraction);
      map.off('movestart', handleInteraction);
      clearTimeout(interactionTimeout);
    };
  }, [mapRef.current]);

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
          ref={mapRef}
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

              {/* Route to pickup (actual road route or fallback) */}
              <Polyline
                positions={
                  actualRouteToPickup.length > 0
                    ? actualRouteToPickup
                    : [
                        [partnerLocation.latitude, partnerLocation.longitude],
                        [vendorLocation.latitude, vendorLocation.longitude],
                      ]
                }
                color="#3b82f6"
                weight={4}
                opacity={0.8}
              />
              
              {/* Route from pickup to delivery */}
              <Polyline
                positions={[
                  [vendorLocation.latitude, vendorLocation.longitude],
                  [deliveryLocation.latitude, deliveryLocation.longitude],
                ]}
                color="#ef4444"
                weight={4}
                opacity={0.6}
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
