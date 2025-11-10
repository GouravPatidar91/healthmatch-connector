import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bike, Store, Home, MapPin, Clock } from 'lucide-react';
import { deliveryPartnerLocationService, DeliveryPartnerLocation } from '@/services/deliveryPartnerLocationService';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LiveOrderTrackingMapProps {
  deliveryPartnerId: string;
  deliveryPartnerName: string;
  vehicleType: string;
  pharmacyLocation: { lat: number; lng: number };
  pharmacyName: string;
  customerLocation: { lat: number; lng: number };
  customerAddress: string;
  orderStatus: string;
}

export function LiveOrderTrackingMap({
  deliveryPartnerId,
  deliveryPartnerName,
  vehicleType,
  pharmacyLocation,
  pharmacyName,
  customerLocation,
  customerAddress,
  orderStatus,
}: LiveOrderTrackingMapProps) {
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryPartnerLocation | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [eta, setETA] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const mapRef = useRef<L.Map | null>(null);

  // Custom icons
  const createCustomIcon = (color: string, IconComponent: any) => {
    return L.divIcon({
      html: `<div style="background-color: ${color}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          ${IconComponent === 'bike' ? '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><path d="M5 12h14"></path>' : 
            IconComponent === 'store' ? '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>' :
            '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle>'}
        </svg>
      </div>`,
      className: 'custom-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  };

  const deliveryIcon = createCustomIcon('hsl(var(--primary))', 'bike');
  const pharmacyIcon = createCustomIcon('hsl(142, 76%, 36%)', 'store');
  const customerIcon = createCustomIcon('hsl(221, 83%, 53%)', 'home');

  useEffect(() => {
    // Fetch initial location
    const fetchLocation = async () => {
      const location = await deliveryPartnerLocationService.getCurrentLocation(deliveryPartnerId);
      if (location) {
        setDeliveryLocation(location);
        updateDistanceAndETA(location.latitude, location.longitude);
        updateLastUpdateTime(location.timestamp);
      }
    };

    fetchLocation();

    // Subscribe to real-time updates
    const channel = deliveryPartnerLocationService.subscribeToLocationUpdates(
      deliveryPartnerId,
      (location) => {
        setDeliveryLocation(location);
        updateDistanceAndETA(location.latitude, location.longitude);
        updateLastUpdateTime(location.timestamp);
      }
    );

    return () => {
      channel.unsubscribe();
    };
  }, [deliveryPartnerId]);

  const updateDistanceAndETA = (lat: number, lng: number) => {
    const dist = deliveryPartnerLocationService.calculateDistance(
      lat,
      lng,
      customerLocation.lat,
      customerLocation.lng
    );
    setDistance(dist);
    setETA(deliveryPartnerLocationService.estimateETA(dist));
  };

  const updateLastUpdateTime = (timestamp: string) => {
    const now = Date.now();
    const updateTime = new Date(timestamp).getTime();
    const secondsAgo = Math.floor((now - updateTime) / 1000);
    
    if (secondsAgo < 60) {
      setLastUpdate(`${secondsAgo}s ago`);
    } else {
      const minutesAgo = Math.floor(secondsAgo / 60);
      setLastUpdate(`${minutesAgo}m ago`);
    }
  };

  // Update last update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (deliveryLocation) {
        updateLastUpdateTime(deliveryLocation.timestamp);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deliveryLocation]);

  // Auto-fit bounds when markers update
  useEffect(() => {
    if (mapRef.current && deliveryLocation) {
      const bounds = L.latLngBounds([
        [pharmacyLocation.lat, pharmacyLocation.lng],
        [customerLocation.lat, customerLocation.lng],
        [deliveryLocation.latitude, deliveryLocation.longitude],
      ]);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [deliveryLocation, pharmacyLocation, customerLocation]);

  const center: [number, number] = deliveryLocation
    ? [deliveryLocation.latitude, deliveryLocation.longitude]
    : [customerLocation.lat, customerLocation.lng];

  const routeCoordinates: [number, number][] = deliveryLocation
    ? [
        [deliveryLocation.latitude, deliveryLocation.longitude],
        [customerLocation.lat, customerLocation.lng],
      ]
    : [];

  const isStale = deliveryLocation && deliveryPartnerLocationService.isLocationStale(deliveryLocation.timestamp);

  return (
    <Card className="overflow-hidden">
      <div className="p-4 bg-muted/50 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Bike className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold">{deliveryPartnerName}</h3>
              <p className="text-sm text-muted-foreground">{vehicleType}</p>
            </div>
          </div>
          <Badge variant={isStale ? "secondary" : "default"}>
            {isStale ? "Location Unavailable" : "Live Tracking"}
          </Badge>
        </div>
        
        {distance !== null && eta !== null && !isStale && (
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{distance.toFixed(1)} km away</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>ETA: {eta} min</span>
            </div>
            <div className="text-muted-foreground ml-auto">
              Updated {lastUpdate}
            </div>
          </div>
        )}

        {isStale && (
          <p className="text-sm text-muted-foreground">
            Last location update was more than 2 minutes ago
          </p>
        )}
      </div>

      <div style={{ height: '400px', width: '100%' }}>
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Pharmacy Marker */}
          <Marker position={[pharmacyLocation.lat, pharmacyLocation.lng]} icon={pharmacyIcon}>
            <Popup>
              <div className="text-center">
                <Store className="w-5 h-5 mx-auto mb-1" />
                <strong>{pharmacyName}</strong>
                <p className="text-sm text-muted-foreground">Pharmacy</p>
              </div>
            </Popup>
          </Marker>

          {/* Customer Marker */}
          <Marker position={[customerLocation.lat, customerLocation.lng]} icon={customerIcon}>
            <Popup>
              <div className="text-center">
                <Home className="w-5 h-5 mx-auto mb-1" />
                <strong>Delivery Address</strong>
                <p className="text-sm text-muted-foreground">{customerAddress}</p>
              </div>
            </Popup>
          </Marker>

          {/* Delivery Partner Marker */}
          {deliveryLocation && !isStale && (
            <>
              <Marker
                position={[deliveryLocation.latitude, deliveryLocation.longitude]}
                icon={deliveryIcon}
              >
                <Popup>
                  <div className="text-center">
                    <Bike className="w-5 h-5 mx-auto mb-1" />
                    <strong>{deliveryPartnerName}</strong>
                    <p className="text-sm text-muted-foreground">
                      {distance?.toFixed(1)} km away • ETA {eta} min
                    </p>
                  </div>
                </Popup>
              </Marker>

              {/* Route Line */}
              <Polyline
                positions={routeCoordinates}
                color="hsl(var(--primary))"
                weight={3}
                opacity={0.7}
                dashArray="10, 10"
              />
            </>
          )}
        </MapContainer>
      </div>
    </Card>
  );
}
