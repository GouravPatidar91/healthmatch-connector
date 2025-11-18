import { useState, useEffect } from 'react';
import { deliveryPartnerLocationService, DeliveryPartnerLocation } from '@/services/deliveryPartnerLocationService';

/**
 * Hook to track delivery partner location in real-time
 * @param partnerId - The ID of the delivery partner to track
 * @param enabled - Whether to enable real-time tracking
 * @returns Current location and tracking state
 */
export function useDeliveryPartnerLocation(partnerId: string | null, enabled: boolean = true) {
  const [location, setLocation] = useState<DeliveryPartnerLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!partnerId || !enabled) {
      setLoading(false);
      return;
    }

    let isSubscribed = true;

    // Load initial location
    const loadInitialLocation = async () => {
      try {
        const initialLocation = await deliveryPartnerLocationService.getCurrentLocation(partnerId);
        if (isSubscribed) {
          setLocation(initialLocation);
          setLoading(false);
        }
      } catch (err) {
        if (isSubscribed) {
          setError('Failed to load location');
          setLoading(false);
        }
      }
    };

    loadInitialLocation();

    // Subscribe to real-time updates
    const channel = deliveryPartnerLocationService.subscribeToLocationUpdates(
      partnerId,
      (newLocation) => {
        if (isSubscribed) {
          setLocation(newLocation);
          setError(null);
        }
      }
    );

    return () => {
      isSubscribed = false;
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [partnerId, enabled]);

  return { location, loading, error };
}
