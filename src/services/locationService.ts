import { supabase } from '@/integrations/supabase/client';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

/**
 * Unified Location Service
 * Centralized location management for all user types (customers, vendors, delivery partners)
 */
class LocationService {
  /**
   * Get current GPS location from browser
   */
  async getCurrentUserLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          reject(new Error(errorMessage));
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
   * Save delivery location to user profile
   */
  async saveDeliveryLocation(
    userId: string,
    latitude: number,
    longitude: number,
    address: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          delivery_latitude: latitude,
          delivery_longitude: longitude,
          delivery_address: address
        })
        .eq('id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error saving delivery location:', error);
      return { 
        success: false, 
        error: (error as Error).message 
      };
    }
  }

  /**
   * Get saved delivery location from user profile
   */
  async getDeliveryLocation(userId: string): Promise<LocationData | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('delivery_latitude, delivery_longitude, delivery_address')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data?.delivery_latitude && data?.delivery_longitude) {
        return {
          latitude: data.delivery_latitude,
          longitude: data.delivery_longitude,
          address: data.delivery_address || undefined
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting delivery location:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * Returns distance in kilometers
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * 
      Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimals
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get vendor location by vendor ID
   */
  async getVendorLocation(vendorId: string): Promise<LocationData | null> {
    try {
      const { data, error } = await supabase
        .from('medicine_vendors')
        .select('latitude, longitude, address')
        .eq('id', vendorId)
        .single();

      if (error) throw error;

      if (data?.latitude && data?.longitude) {
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting vendor location:', error);
      return null;
    }
  }

  /**
   * Update delivery partner live location
   */
  async updateDeliveryPartnerLocation(
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

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating delivery partner location:', error);
      return { 
        success: false, 
        error: (error as Error).message 
      };
    }
  }
}

export const locationService = new LocationService();
