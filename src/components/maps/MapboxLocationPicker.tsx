import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, Search, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

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
    if (!mapboxToken) return;
    
    setIsLoadingAddress(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&types=address,place`
      );
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const place = data.features[0];
        const addressText = place.place_name;
        setAddress(addressText);
        
        // Show success toast
        toast({
          title: 'Location Found',
          description: addressText.length > 50 ? addressText.substring(0, 50) + '...' : addressText,
        });
      } else {
        setAddress('');
        toast({
          title: 'Address Not Found',
          description: 'Could not find address for this location',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      toast({
        title: 'Error',
        description: 'Failed to get address. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const searchLocation = async (query: string) => {
    if (!query.trim() || !mapboxToken) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      // Use current position as proximity bias if available
      const proximity = position ? `${position.lng},${position.lat}` : '77.5946,12.9716'; // Default to Bangalore
      
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&proximity=${proximity}&types=address,place,locality,neighborhood,poi&limit=5`
      );
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        setSearchResults(data.features);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('Location search error:', error);
      toast({
        title: 'Search Error',
        description: 'Could not search for locations. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchResultClick = (result: any) => {
    const [lng, lat] = result.center;
    const newPos = { lat, lng };
    
    setPosition(newPos);
    setAddress(result.place_name);
    setSearchQuery(result.place_name);
    setShowSearchResults(false);
    
    if (map.current && marker.current) {
      map.current.flyTo({
        center: [lng, lat],
        zoom: 15,
      });
      marker.current.setLngLat([lng, lat]);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchLocation(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, mapboxToken]);

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
    console.log('Confirm clicked - Position:', position, 'Address:', address);
    
    if (!position) {
      toast({
        title: 'No Location Selected',
        description: 'Please click on the map to select a location.',
        variant: 'destructive',
      });
      return;
    }

    if (!address || address.trim() === '') {
      toast({
        title: 'Address Required',
        description: 'Please wait for the address to load or enter manually.',
        variant: 'destructive',
      });
      return;
    }

    console.log('Confirming location:', {
      latitude: position.lat,
      longitude: position.lng,
      address,
    });

    onLocationSelect({
      latitude: position.lat,
      longitude: position.lng,
      address,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Select Delivery Location</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            This location will be used for finding nearby pharmacies and delivery
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="h-96 flex items-center justify-center bg-muted rounded-lg">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search Box */}
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search for a location, address, or landmark..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                        setShowSearchResults(false);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                
                {/* Search Results Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-60 overflow-hidden">
                    <ScrollArea className="max-h-60">
                      {searchResults.map((result, index) => (
                        <button
                          key={result.id || index}
                          onClick={() => handleSearchResultClick(result)}
                          className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b last:border-b-0"
                        >
                          <div className="flex items-start gap-3">
                            <MapPin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{result.text}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {result.place_name}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </ScrollArea>
                  </div>
                )}
              </div>

              <div className="relative h-96 rounded-lg overflow-hidden border">
                <div ref={mapContainer} className="w-full h-full" />
                
                <Button
                  onClick={handleUseCurrentLocation}
                  className="absolute top-4 left-4 shadow-lg z-10"
                  size="sm"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Use Current Location
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Delivery Address</Label>
                <div className="relative">
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={isLoadingAddress ? "Loading address..." : "Enter or select address on map"}
                    disabled={isLoadingAddress}
                  />
                  {isLoadingAddress && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Click on the map or drag the marker to select your location
                </p>
                {position && (
                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded-md">
                    📍 Coordinates: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                    {address && (
                      <span className="block mt-1 text-primary">
                        ✓ Address loaded successfully
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/20">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!position || !address || loading || isLoadingAddress}
            className="min-w-32"
          >
            {isLoadingAddress ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Confirm Location'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
