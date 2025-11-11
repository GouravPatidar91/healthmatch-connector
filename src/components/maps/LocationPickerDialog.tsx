import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocationPermission } from '@/hooks/useLocationPermission';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LocationPickerDialogProps {
  open: boolean;
  onClose: () => void;
  onLocationSelect: (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
}

// Component to handle map clicks
function LocationMarker({ 
  position, 
  setPosition 
}: { 
  position: [number, number]; 
  setPosition: (pos: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return <Marker position={position} draggable eventHandlers={{
    dragend: (e) => {
      const marker = e.target;
      const position = marker.getLatLng();
      setPosition([position.lat, position.lng]);
    },
  }} />;
}

export function LocationPickerDialog({
  open,
  onClose,
  onLocationSelect,
  initialLocation,
}: LocationPickerDialogProps) {
  const { toast } = useToast();
  const { 
    location: currentLocation, 
    isLoading: locationLoading,
    requestPermission 
  } = useLocationPermission();
  
  const [position, setPosition] = useState<[number, number]>(
    initialLocation 
      ? [initialLocation.latitude, initialLocation.longitude]
      : [28.6139, 77.2090] // Default to Delhi
  );
  const [address, setAddress] = useState('');
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);

  // Update position when current location is available
  useEffect(() => {
    if (currentLocation && !initialLocation) {
      setPosition([currentLocation.lat, currentLocation.lng]);
      reverseGeocode(currentLocation.lat, currentLocation.lng);
    }
  }, [currentLocation, initialLocation]);

  // Reverse geocode to get address from coordinates
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocodingLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await response.json();
      if (data.display_name) {
        setAddress(data.display_name);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setIsGeocodingLoading(false);
    }
  };

  // Update address when position changes
  useEffect(() => {
    if (position) {
      reverseGeocode(position[0], position[1]);
    }
  }, [position]);

  const handleUseCurrentLocation = async () => {
    if (currentLocation) {
      setPosition([currentLocation.lat, currentLocation.lng]);
    } else {
      await requestPermission();
    }
  };

  const handleConfirm = () => {
    if (!address.trim()) {
      toast({
        title: 'Address Required',
        description: 'Please wait for address to load or enter manually',
        variant: 'destructive',
      });
      return;
    }

    onLocationSelect({
      latitude: position[0],
      longitude: position[1],
      address: address,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Select Delivery Location
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Location Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleUseCurrentLocation}
            disabled={locationLoading}
          >
            {locationLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4 mr-2" />
            )}
            Use My Current Location
          </Button>

          {/* Map */}
          <div className="border rounded-lg overflow-hidden" style={{ height: '400px' }}>
            <MapContainer
              center={position}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker position={position} setPosition={setPosition} />
            </MapContainer>
          </div>

          {/* Address Input */}
          <div className="space-y-2">
            <Label htmlFor="address">Delivery Address</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter delivery address"
              disabled={isGeocodingLoading}
            />
            {isGeocodingLoading && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading address...
              </p>
            )}
          </div>

          {/* Coordinates Display */}
          <div className="text-sm text-muted-foreground">
            <p>Coordinates: {position[0].toFixed(6)}, {position[1].toFixed(6)}</p>
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              💡 Tip: Click on the map or drag the marker to select your delivery location
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isGeocodingLoading}>
            Confirm Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
