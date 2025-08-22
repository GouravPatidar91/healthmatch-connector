import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';

// Fix for Leaflet default icons in Webpack
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Set the default icon
L.Marker.prototype.options.icon = DefaultIcon;

interface LocationMapSelectorProps {
  onLocationSelect: (location: { latitude: number; longitude: number; address: string; city: string }) => void;
  initialLocation?: { latitude: number; longitude: number };
  className?: string;
}

// Simple marker component that handles clicks
function ClickableMap({ onLocationSelect }: {
  onLocationSelect: (location: { latitude: number; longitude: number; address: string; city: string }) => void;
}) {
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);

  const reverseGeocode = useCallback(async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data?.display_name) {
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
      
      return {
        formattedAddress: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        city: ''
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return {
        formattedAddress: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        city: ''
      };
    }
  }, []);

  const handleMapClick = useCallback(async (e: any) => {
    const { lat, lng } = e.latlng;
    const position: [number, number] = [lat, lng];
    setMarkerPosition(position);
    
    const addressData = await reverseGeocode(lat, lng);
    onLocationSelect({
      latitude: lat,
      longitude: lng,
      address: addressData.formattedAddress,
      city: addressData.city
    });
  }, [onLocationSelect, reverseGeocode]);

  useMapEvents({
    click: handleMapClick,
  });

  return markerPosition ? <Marker position={markerPosition} /> : null;
}

export function LocationMapSelector({ onLocationSelect, initialLocation, className }: LocationMapSelectorProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [mapKey, setMapKey] = useState(0); // Force re-render key

  const defaultCenter: [number, number] = initialLocation 
    ? [initialLocation.latitude, initialLocation.longitude] 
    : [28.6139, 77.2090]; // Default to New Delhi

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
      
      // Force map re-render with new center
      setMapKey(prev => prev + 1);
      
      // Automatically geocode and update
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        
        if (data?.display_name) {
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
            key={mapKey}
            center={defaultCenter}
            zoom={13}
            scrollWheelZoom={true}
            className="h-full w-full"
            style={{ height: '400px', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickableMap onLocationSelect={onLocationSelect} />
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