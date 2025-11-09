import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PharmacyLocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

export const PharmacyLocationPicker: React.FC<PharmacyLocationPickerProps> = ({
  onLocationSelect,
  initialLat = 28.6139, // Default to New Delhi
  initialLng = 77.2090
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Fetch Mapbox token from edge function
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch('https://bpflebtklgnivcanhlbp.supabase.co/functions/v1/get-mapbox-token');
        const data = await response.json();
        if (data.token) {
          setMapboxToken(data.token);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
        setLoading(false);
      }
    };

    fetchToken();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [initialLng, initialLat],
      zoom: 13,
      attributionControl: false
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add geocoder control for search
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      }),
      'top-right'
    );

    // Create draggable marker
    marker.current = new mapboxgl.Marker({
      draggable: true,
      color: '#3b82f6'
    })
      .setLngLat([initialLng, initialLat])
      .addTo(map.current);

    // Update location when marker is dragged
    marker.current.on('dragend', () => {
      if (marker.current) {
        const lngLat = marker.current.getLngLat();
        updateLocation(lngLat.lat, lngLat.lng);
      }
    });

    // Update marker on map click
    map.current.on('click', (e) => {
      if (marker.current) {
        marker.current.setLngLat(e.lngLat);
        updateLocation(e.lngLat.lat, e.lngLat.lng);
      }
    });

    // Initial location update
    if (initialLat && initialLng) {
      updateLocation(initialLat, initialLng);
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  const updateLocation = async (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    onLocationSelect(lat, lng);

    // Reverse geocode to get address
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        setAddress(data.features[0].place_name);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (map.current && marker.current) {
            map.current.flyTo({
              center: [longitude, latitude],
              zoom: 15
            });
            marker.current.setLngLat([longitude, latitude]);
            updateLocation(latitude, longitude);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[400px] bg-secondary/20 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  if (!mapboxToken) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load map. Please refresh the page or contact support.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full h-[400px] rounded-lg overflow-hidden border-2 border-border">
        <div ref={mapContainer} className="absolute inset-0" />
        
        {/* Location button overlay */}
        <div className="absolute top-4 left-4 z-10">
          <Button
            type="button"
            size="sm"
            onClick={handleUseCurrentLocation}
            className="shadow-lg bg-background hover:bg-secondary"
            variant="outline"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Use Current Location
          </Button>
        </div>
      </div>

      {/* Selected location info */}
      {selectedLocation && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm mb-1">Selected Location</p>
              {address && (
                <p className="text-sm text-muted-foreground mb-2">{address}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Latitude: {selectedLocation.lat.toFixed(6)}, Longitude: {selectedLocation.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}

      <Alert>
        <MapPin className="h-4 w-4" />
        <AlertDescription>
          <strong>Tip:</strong> Click on the map or drag the marker to select your pharmacy's exact location. 
          This ensures customers can find you easily and receive accurate delivery estimates.
        </AlertDescription>
      </Alert>
    </div>
  );
};
