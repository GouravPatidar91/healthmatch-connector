import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface DeliveryPartnerLocation {
  latitude: number;
  longitude: number;
  timestamp: string;
}

class DeliveryPartnerLocationService {
  private watchId: number | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private currentPartnerId: string | null = null;

  /**
   * Update delivery partner's current location
   */
  async updateLocation(
    partnerId: string,
    latitude: number,
    longitude: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('delivery_partners')
        .update({
          current_latitude: latitude,
          current_longitude: longitude,
          location_updated_at: new Date().toISOString()
        })
        .eq('id', partnerId);

      if (error) {
        console.error('Error updating location:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating location:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get current location of a delivery partner
   */
  async getCurrentLocation(partnerId: string): Promise<DeliveryPartnerLocation | null> {
    try {
      const { data, error } = await supabase
        .from('delivery_partners')
        .select('current_latitude, current_longitude, location_updated_at')
        .eq('id', partnerId)
        .single();

      if (error || !data) {
        console.error('Error fetching location:', error);
        return null;
      }

      if (!data.current_latitude || !data.current_longitude) {
        return null;
      }

      return {
        latitude: data.current_latitude,
        longitude: data.current_longitude,
        timestamp: data.location_updated_at || new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching location:', error);
      return null;
    }
  }

  /**
   * Subscribe to real-time location updates for a delivery partner
   */
  subscribeToLocationUpdates(
    partnerId: string,
    callback: (location: DeliveryPartnerLocation) => void
  ): RealtimeChannel {
    const channel = supabase
      .channel(`delivery-location-${partnerId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'delivery_partners',
          filter: `id=eq.${partnerId}`
        },
        (payload) => {
          const newData = payload.new as any;
          if (newData.current_latitude && newData.current_longitude) {
            callback({
              latitude: newData.current_latitude,
              longitude: newData.current_longitude,
              timestamp: newData.location_updated_at || new Date().toISOString()
            });
          }
        }
      )
      .subscribe();

    return channel;
  }

  /**
   * Start continuous location tracking for delivery partner
   */
  async startLocationTracking(partnerId: string): Promise<{ success: boolean; error?: string }> {
    if (!navigator.geolocation) {
      return { success: false, error: 'Geolocation is not supported by your browser' };
    }

    this.currentPartnerId = partnerId;

    return new Promise((resolve) => {
      this.watchId = navigator.geolocation.watchPosition(
        async (position) => {
          if (this.currentPartnerId === partnerId) {
            await this.updateLocation(
              partnerId,
              position.coords.latitude,
              position.coords.longitude
            );
          }
          resolve({ success: true });
        },
        (error) => {
          console.error('Geolocation error:', error);
          resolve({ success: false, error: error.message });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  /**
   * Stop location tracking
   */
  stopLocationTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.currentPartnerId = null;
  }

  /**
   * Check if location is stale (older than 2 minutes)
   */
  isLocationStale(timestamp: string): boolean {
    const locationTime = new Date(timestamp).getTime();
    const now = Date.now();
    const twoMinutes = 2 * 60 * 1000;
    
    return (now - locationTime) > twoMinutes;
  }

  /**
   * Calculate distance between two points in kilometers
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Estimate time of arrival in minutes based on distance
   */
  estimateETA(distanceKm: number, averageSpeedKmh: number = 30): number {
    return Math.round((distanceKm / averageSpeedKmh) * 60);
  }
}

export const deliveryPartnerLocationService = new DeliveryPartnerLocationService();
