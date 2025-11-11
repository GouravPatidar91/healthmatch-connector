import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MapboxLocationPickerProps {
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

export function MapboxLocationPicker({
  open,
  onClose,
  onLocationSelect,
  initialLocation,
}: MapboxLocationPickerProps) {
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState('');
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    initialLocation ? { lat: initialLocation.latitude, lng: initialLocation.longitude } : null
  );

  // Fetch Mapbox token
  useEffect(() => {
    if (open) {
      fetchMapboxToken();
    }
  }, [open]);

  const fetchMapboxToken = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      
      if (error) throw error;
      
      if (data?.token) {
        setMapboxToken(data.token);
        setLoading(false);
      } else {
        throw new Error('No token received');
      }
    } catch (error) {
      console.error('Error fetching Mapbox token:', error);
      toast({
        title: 'Error',
        description: 'Failed to load map. Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  // Initialize map
  useEffect(() => {
    if (!open || !mapContainer.current || !mapboxToken || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    const initialCenter: [number, number] = position 
      ? [position.lng, position.lat]
      : [77.5946, 12.9716]; // Bangalore as default

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter,
      zoom: 14,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add marker
    marker.current = new mapboxgl.Marker({
      draggable: true,
      color: '#6366f1',
    })
      .setLngLat(initialCenter)
      .addTo(map.current);

    // Update position on marker drag
    marker.current.on('dragend', () => {
      if (marker.current) {
        const lngLat = marker.current.getLngLat();
        const newPosition = { lat: lngLat.lat, lng: lngLat.lng };
        setPosition(newPosition);
        reverseGeocode(newPosition.lat, newPosition.lng);
      }
    });

    // Update marker on map click
    map.current.on('click', (e) => {
      const newPosition = { lat: e.lngLat.lat, lng: e.lngLat.lng };
      setPosition(newPosition);
      
      if (marker.current) {
        marker.current.setLngLat([e.lngLat.lng, e.lngLat.lat]);
      }
      
      reverseGeocode(newPosition.lat, newPosition.lng);
    });

    // Initial reverse geocode
    if (position) {
      reverseGeocode(position.lat, position.lng);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [open, mapboxToken]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&types=address,place`
      );
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const place = data.features[0];
        setAddress(place.place_name);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          
          setPosition(newPos);
          
          if (map.current && marker.current) {
            map.current.flyTo({
              center: [newPos.lng, newPos.lat],
              zoom: 15,
            });
            marker.current.setLngLat([newPos.lng, newPos.lat]);
          }
          
          reverseGeocode(newPos.lat, newPos.lng);
        },
        (error) => {
          toast({
            title: 'Location Error',
            description: 'Could not get your current location.',
            variant: 'destructive',
          });
        }
      );
    }
  };

  const handleConfirm = () => {
    if (!position) {
      toast({
        title: 'No Location Selected',
        description: 'Please select a location on the map.',
        variant: 'destructive',
      });
      return;
    }

    if (!address) {
      toast({
        title: 'Address Required',
        description: 'Please wait for the address to load.',
        variant: 'destructive',
      });
      return;
    }

    onLocationSelect({
      latitude: position.lat,
      longitude: position.lng,
      address,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Delivery Location</DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4">
          {loading ? (
            <div className="h-96 flex items-center justify-center bg-muted rounded-lg">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="relative h-96 rounded-lg overflow-hidden border">
                <div ref={mapContainer} className="w-full h-full" />
                
                <Button
                  onClick={handleUseCurrentLocation}
                  className="absolute top-4 left-4 shadow-lg"
                  size="sm"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Use Current Location
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Delivery Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter or select address on map"
                />
                <p className="text-xs text-muted-foreground">
                  Click on the map or drag the marker to select your location
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!position || !address || loading}>
            Confirm Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
