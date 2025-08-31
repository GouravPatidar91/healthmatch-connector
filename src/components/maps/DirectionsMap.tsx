import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation, MapPin, Clock, Route } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Fix default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const startIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiMyNTYzRUIiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHRleHQgeD0iMTIiIHk9IjE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxMiIgZm9udC13ZWlnaHQ9ImJvbGQiPlM8L3RleHQ+Cjwvc3ZnPgo8L3N2Zz4K',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15]
});

const clinicIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiNEQzI2MjYiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHRleHQgeD0iMTIiIHk9IjE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxMiIgZm9udC13ZWlnaHQ9ImJvbGQiPkM8L3RleHQ+Cjwvc3ZnPgo8L3N2Zz4K',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15]
});

interface DirectionInfo {
  distance: string;
  duration: string;
  route: [number, number][];
}

interface DirectionsMapProps {
  clinicLocation: {
    latitude: number;
    longitude: number;
    name: string;
    address: string;
  };
  className?: string;
}

export function DirectionsMap({ clinicLocation, className }: DirectionsMapProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [directions, setDirections] = useState<DirectionInfo | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isGettingDirections, setIsGettingDirections] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const { toast } = useToast();

  const defaultCenter: [number, number] = [clinicLocation.latitude, clinicLocation.longitude];

  const getCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);
      
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      const { latitude, longitude } = position.coords;
      const location: [number, number] = [latitude, longitude];
      setUserLocation(location);
      
      toast({
        title: "Location Found",
        description: "Your current location has been set as the starting point.",
      });

      // Auto-get directions
      await getDirections(location, [clinicLocation.latitude, clinicLocation.longitude]);
    } catch (error) {
      console.error('Error getting location:', error);
      toast({
        title: "Location Error",
        description: "Failed to get your current location. Please enable location access.",
        variant: "destructive"
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const getDirections = async (start: [number, number], end: [number, number]) => {
    try {
      setIsGettingDirections(true);
      
      // Using OpenRouteService API (free tier available)
      const response = await fetch(
        `https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf6248fa2545b732ce46c2b0a2dbef42e8f8b4&start=${start[1]},${start[0]}&end=${end[1]},${end[0]}`
      );
      
      if (!response.ok) {
        // Fallback: Simple straight line
        const distance = calculateDistance(start[0], start[1], end[0], end[1]);
        const estimatedDuration = Math.round(distance * 2); // rough estimate: 2 minutes per km
        
        setDirections({
          distance: `${distance.toFixed(1)} km`,
          duration: `${estimatedDuration} min`,
          route: [start, end]
        });
        return;
      }

      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const route = data.features[0];
        const coordinates = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
        const distance = (route.properties.segments[0].distance / 1000).toFixed(1);
        const duration = Math.round(route.properties.segments[0].duration / 60);
        
        setDirections({
          distance: `${distance} km`,
          duration: `${duration} min`,
          route: coordinates
        });
      }
    } catch (error) {
      console.error('Error getting directions:', error);
      
      // Fallback calculation
      if (start && end) {
        const distance = calculateDistance(start[0], start[1], end[0], end[1]);
        const estimatedDuration = Math.round(distance * 2);
        
        setDirections({
          distance: `${distance.toFixed(1)} km`,
          duration: `${estimatedDuration} min`,
          route: [start, end]
        });
      }
    } finally {
      setIsGettingDirections(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in kilometers
    return d;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${clinicLocation.latitude},${clinicLocation.longitude}`;
    window.open(url, '_blank');
  };

  const openInAppleMaps = () => {
    const url = `https://maps.apple.com/?daddr=${clinicLocation.latitude},${clinicLocation.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Route className="h-5 w-5" />
          Directions to Clinic
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
          >
            <Navigation className="h-4 w-4 mr-2" />
            {isGettingLocation ? 'Getting Location...' : 'Get My Location'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={openInGoogleMaps}
          >
            Open in Google Maps
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={openInAppleMaps}
          >
            Open in Apple Maps
          </Button>
        </div>
        
        {directions && (
          <div className="flex gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Distance: {directions.distance}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Duration: {directions.duration}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full rounded-lg overflow-hidden border">
          <MapContainer
            center={defaultCenter}
            zoom={userLocation ? 13 : 15}
            scrollWheelZoom={true}
            className="h-full w-full"
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Clinic marker */}
            <Marker 
              position={[clinicLocation.latitude, clinicLocation.longitude]} 
              icon={clinicIcon}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold">{clinicLocation.name}</h3>
                  <p className="text-sm text-gray-600">{clinicLocation.address}</p>
                </div>
              </Popup>
            </Marker>
            
            {/* User location marker */}
            {userLocation && (
              <Marker position={userLocation} icon={startIcon}>
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold">Your Location</h3>
                    <p className="text-sm text-gray-600">Starting point</p>
                  </div>
                </Popup>
              </Marker>
            )}
            
            {/* Route polyline */}
            {directions && directions.route.length > 1 && (
              <Polyline 
                positions={directions.route} 
                color="blue" 
                weight={4}
                opacity={0.7}
              />
            )}
          </MapContainer>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          <p>
            <MapPin className="h-4 w-4 inline mr-1" />
            Click "Get My Location" to see directions from your current position
          </p>
          {isGettingDirections && (
            <p className="text-blue-600 mt-2">Calculating route...</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}