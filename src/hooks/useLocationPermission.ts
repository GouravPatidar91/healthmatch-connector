import { useState, useEffect } from 'react';

export type PermissionState = 'prompt' | 'granted' | 'denied' | 'unavailable';

export interface UseLocationPermissionReturn {
  permissionState: PermissionState;
  location: { lat: number; lng: number } | null;
  isLoading: boolean;
  error: string | null;
  requestPermission: () => Promise<void>;
  retryPermission: () => Promise<void>;
}

export function useLocationPermission(): UseLocationPermissionReturn {
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setPermissionState('unavailable');
      return;
    }

    // Check current permission state if supported
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          setPermissionState('granted');
          getCurrentLocation();
        } else if (result.state === 'denied') {
          setPermissionState('denied');
        } else {
          setPermissionState('prompt');
        }
      }).catch(() => {
        // Permissions API not supported, try to get location directly
        setPermissionState('prompt');
      });
    }
  }, []);

  const getCurrentLocation = () => {
    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setPermissionState('granted');
        setIsLoading(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError(err.message);
        setPermissionState('denied');
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const requestPermission = async () => {
    if (!navigator.geolocation) {
      setPermissionState('unavailable');
      setError('Geolocation is not supported by your browser');
      return;
    }

    getCurrentLocation();
  };

  const retryPermission = async () => {
    setError(null);
    await requestPermission();
  };

  return {
    permissionState,
    location,
    isLoading,
    error,
    requestPermission,
    retryPermission
  };
}
