import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bike, Store, Home, MapPin, Clock } from 'lucide-react';
import { deliveryPartnerLocationService, DeliveryPartnerLocation } from '@/services/deliveryPartnerLocationService';
import { cn } from '@/lib/utils';
import { MapIconSVGs, MapIconColors, getVehicleIconData } from '@/components/maps/MapIcons';
import { MapLegend } from '@/components/maps/MapLegend';
import { routingService } from '@/services/routingService';

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
  className?: string;
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
  className
}: LiveOrderTrackingMapProps) {
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryPartnerLocation | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [eta, setETA] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [actualRoute, setActualRoute] = useState<[number, number][]>([]);
  const mapRef = useRef<L.Map | null>(null);

  // Get vehicle icon data
  const vehicleIconData = getVehicleIconData(vehicleType);

  const createCustomIcon = (color: string, iconSvg: string, isVehicle: boolean = false) => {
    const pulseAnimation = isVehicle 
      ? `<div style="position: absolute; top: -4px; right: -4px; background: white; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.25);">
          <div style="width: 10px; height: 10px; border-radius: 50%; background: #10b981; animation: pulse 2s ease-in-out infinite;"></div>
        </div>`
      : '';
    
    const size = isVehicle ? 56 : 42;
    const iconSize = isVehicle ? 28 : 22;
    const borderWidth = isVehicle ? 4 : 3;

    return L.divIcon({
      html: `<div style="
        background: linear-gradient(135deg, ${color} 0%, ${color} 100%);
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: ${borderWidth}px solid white;
        box-shadow: 0 6px 20px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2);
        position: relative;
        transition: all 0.3s ease;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: white;">
          ${iconSvg}
        </svg>
        ${pulseAnimation}
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { 
            opacity: 1; 
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          }
          50% { 
            opacity: 0.8; 
            transform: scale(1.1);
            box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
          }
        }
        .custom-vehicle-icon:hover {
          transform: scale(1.1);
        }
      </style>`,
      className: isVehicle ? 'custom-vehicle-icon' : 'custom-icon',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  const deliveryIcon = createCustomIcon(vehicleIconData.color, vehicleIconData.iconSvg, true);
  const pharmacyIcon = createCustomIcon(MapIconColors.shop, MapIconSVGs.shop);
  const customerIcon = createCustomIcon(MapIconColors.home, MapIconSVGs.home);

  // Fetch initial location and subscribe to updates
  useEffect(() => {
    if (!deliveryPartnerId) return;

    let isSubscribed = true;

    const loadInitialLocation = async () => {
      try {
        const location = await deliveryPartnerLocationService.getCurrentLocation(deliveryPartnerId);
        if (isSubscribed && location) {
          setDeliveryLocation(location);
          updateDistanceAndETA(location.latitude, location.longitude);
          updateLastUpdateTime(location.timestamp);
        }
      } catch (err) {
        console.error('Failed to load delivery partner location:', err);
      }
    };

    loadInitialLocation();

    // Subscribe to real-time location updates
    const channel = deliveryPartnerLocationService.subscribeToLocationUpdates(
      deliveryPartnerId,
      (location) => {
        if (isSubscribed) {
          setDeliveryLocation(location);
          updateDistanceAndETA(location.latitude, location.longitude);
          setLastUpdate(new Date().toLocaleTimeString());
        }
      }
    );

    return () => {
      isSubscribed = false;
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [deliveryPartnerId, customerLocation]);

  const updateDistanceAndETA = (lat: number, lng: number) => {
    const dist = deliveryPartnerLocationService.calculateDistance(
      lat,
      lng,
      customerLocation.lat,
      customerLocation.lng
    );
    setDistance(dist);
    setETA(deliveryPartnerLocationService.estimateETA(dist));
    
    // Fetch actual road route
    routingService.getRoute(
      { lat, lng },
      { lat: customerLocation.lat, lng: customerLocation.lng }
    ).then(route => {
      if (route.length > 0) {
        setActualRoute(route);
      }
    });
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
    <Card className="overflow-hidden shadow-lg">
      <div className={cn("relative", className)}>
        <div className="p-5 bg-gradient-to-br from-primary/5 via-muted/30 to-background border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <div 
              className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
              style={{ backgroundColor: vehicleIconData.color }}
            >
              <Bike className="w-7 h-7 text-white" />
              {!isStale && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background">
                  <div className="w-full h-full bg-green-500 rounded-full animate-ping opacity-75" />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-bold text-xl text-foreground">{deliveryPartnerName}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-background/60 rounded-full text-xs font-medium">
                  <span style={{ color: vehicleIconData.color }}>●</span>
                  <span className="capitalize">{vehicleType}</span>
                </span>
              </p>
            </div>
          </div>
          <Badge 
            variant={isStale ? "secondary" : "default"} 
            className={`text-sm font-semibold px-3 py-1.5 ${!isStale ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : ''}`}
          >
            {isStale ? "📍 Location Unavailable" : "🔴 Live Tracking"}
          </Badge>
        </div>
        
        {distance !== null && eta !== null && !isStale && (
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-2 px-3 py-2 bg-background/80 backdrop-blur-sm rounded-lg border shadow-sm">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-semibold">{distance.toFixed(1)} km</span>
              <span className="text-muted-foreground">away</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-background/80 backdrop-blur-sm rounded-lg border shadow-sm">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-semibold">ETA: {eta} min</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-background/80 backdrop-blur-sm rounded-lg border shadow-sm ml-auto">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-muted-foreground">Updated {lastUpdate}</span>
            </div>
          </div>
        )}

        {isStale && (
          <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
            <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">
              Last location update was more than 2 minutes ago
            </p>
          </div>
        )}
      </div>

      <div style={{ height: '450px', width: '100%' }} className="relative">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
          className="rounded-b-lg"
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
                positions={actualRoute.length > 0 ? actualRoute : routeCoordinates}
                color={vehicleIconData.color}
                weight={4}
                opacity={0.8}
                dashArray="10, 5"
                className="animate-pulse"
              />
              </>
            )}
          </MapContainer>
          
          {/* Map Legend */}
          <MapLegend />
        </div>
        </div>
      </Card>
    );
  }
