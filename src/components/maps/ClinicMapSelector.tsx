import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Fix default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom clinic icon
const clinicIcon = new L.Icon({
  iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface ClinicLocation {
  latitude: number;
  longitude: number;
  address: string;
  name?: string;
}

interface ClinicMapSelectorProps {
  onLocationSelect: (location: ClinicLocation) => void;
  initialLocation?: { latitude: number; longitude: number };
  className?: string;
}

function MapClickHandler({ onLocationSelect }: {
  onLocationSelect: (location: ClinicLocation) => void;
}) {
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const { toast } = useToast();

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
          address.neighbourhood || address.suburb,
          address.city_district,
        ].filter(Boolean).join(', ');
        
        return detailedAddress || data.display_name;
      }
      
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  }, []);

  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      const position: [number, number] = [lat, lng];
      setMarkerPosition(position);
      
      const address = await reverseGeocode(lat, lng);
      onLocationSelect({
        latitude: lat,
        longitude: lng,
        address: address
      });

      toast({
        title: "Clinic Location Selected",
        description: `Location: ${address}`,
      });
    },
  });

  return markerPosition ? <Marker position={markerPosition} icon={clinicIcon} /> : null;
}

export function ClinicMapSelector({ onLocationSelect, initialLocation, className }: ClinicMapSelectorProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapKey, setMapKey] = useState(0);
  const mapRef = useRef<L.Map | null>(null);
  const { toast } = useToast();

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
      
      const address = await reverseGeocode(latitude, longitude);
      onLocationSelect({
        latitude,
        longitude,
        address: address
      });

      // Update map center
      setMapKey(prev => prev + 1);

      toast({
        title: "Current Location Selected",
        description: `Location: ${address}`,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      toast({
        title: "Location Error",
        description: "Failed to get your current location. Please click on the map to select manually.",
        variant: "destructive"
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
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
          address.neighbourhood || address.suburb,
          address.city_district,
        ].filter(Boolean).join(', ');
        
        return detailedAddress || data.display_name;
      }
      
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const location = data[0];
        const lat = parseFloat(location.lat);
        const lng = parseFloat(location.lon);
        
        onLocationSelect({
          latitude: lat,
          longitude: lng,
          address: location.display_name
        });

        // Update map center
        setMapKey(prev => prev + 1);

        toast({
          title: "Location Found",
          description: `Found: ${location.display_name}`,
        });
      } else {
        toast({
          title: "Location Not Found",
          description: "Could not find the specified location. Please try a different search term.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for location. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Select Clinic/Lab Location</CardTitle>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              placeholder="Search for location (e.g., hospital name, address)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
              className="flex-1"
            />
            <Button 
              variant="outline" 
              size="icon"
              onClick={searchLocation}
              disabled={!searchQuery.trim()}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="w-fit"
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
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onLocationSelect={onLocationSelect} />
          </MapContainer>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          <MapPin className="h-4 w-4 inline mr-1" />
          Search for a location or click anywhere on the map to select your clinic/lab location
        </p>
      </CardContent>
    </Card>
  );
}