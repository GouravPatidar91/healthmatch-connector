import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationMapSelectorProps {
  onLocationSelect: (location: { latitude: number; longitude: number; address: string; city: string }) => void;
  initialLocation?: { latitude: number; longitude: number };
  className?: string;
}

// Component to handle map clicks
function LocationMarker({ onLocationSelect, initialLocation }: {
  onLocationSelect: (location: { latitude: number; longitude: number; address: string; city: string }) => void;
  initialLocation?: { latitude: number; longitude: number };
}) {
  const [position, setPosition] = useState<[number, number] | null>(
    initialLocation ? [initialLocation.latitude, initialLocation.longitude] : null
  );

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        const address = data.address || {};
        const detailedAddress = [
          address.house_number,
          address.road || address.street,
          address.neighbourhood || address.suburb || address.village,
          address.city_district || address.town || address.municipality,
        ].filter(Boolean).join(', ');
        
        const city = address.city || address.town || address.village || address.municipality || '';
        
        return {
          formattedAddress: detailedAddress || data.display_name,
          city: city
        };
      }
      
      throw new Error('No address found');
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return {
        formattedAddress: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        city: ''
      };
    }
  };

  const map = useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      
      try {
        const addressData = await reverseGeocode(lat, lng);
        onLocationSelect({
          latitude: lat,
          longitude: lng,
          address: addressData.formattedAddress,
          city: addressData.city
        });
      } catch (error) {
        onLocationSelect({
          latitude: lat,
          longitude: lng,
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          city: ''
        });
      }
    },
  });

  // Set initial position if provided
  useEffect(() => {
    if (initialLocation && map) {
      const newPos: [number, number] = [initialLocation.latitude, initialLocation.longitude];
      setPosition(newPos);
      map.flyTo(newPos, 15);
    }
  }, [initialLocation, map]);

  return position === null ? null : (
    <Marker position={position} />
  );
}

export function LocationMapSelector({ onLocationSelect, initialLocation, className }: LocationMapSelectorProps) {
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(
    initialLocation ? [initialLocation.latitude, initialLocation.longitude] : null
  );
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

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
      const newLocation: [number, number] = [latitude, longitude];
      setCurrentLocation(newLocation);
      
      if (mapRef.current) {
        mapRef.current.flyTo(newLocation, 15);
      }

      // Automatically geocode and update
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        
        if (data && data.display_name) {
          const address = data.address || {};
          const detailedAddress = [
            address.house_number,
            address.road || address.street,
            address.neighbourhood || address.suburb || address.village,
            address.city_district || address.town || address.municipality,
          ].filter(Boolean).join(', ');
          
          const city = address.city || address.town || address.village || address.municipality || '';
          
          onLocationSelect({
            latitude,
            longitude,
            address: detailedAddress || data.display_name,
            city: city
          });
        }
      } catch (geocodeError) {
        onLocationSelect({
          latitude,
          longitude,
          address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          city: ''
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const defaultCenter: [number, number] = currentLocation || [28.6139, 77.2090]; // Default to New Delhi

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Select Your Location</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
          >
            <Navigation className="h-4 w-4 mr-2" />
            {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full rounded-lg overflow-hidden border">
          <MapContainer
            center={defaultCenter}
            zoom={13}
            scrollWheelZoom={true}
            className="h-full w-full"
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker onLocationSelect={onLocationSelect} initialLocation={initialLocation} />
          </MapContainer>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          <MapPin className="h-4 w-4 inline mr-1" />
          Click anywhere on the map to select your precise location
        </p>
      </CardContent>
    </Card>
  );
}