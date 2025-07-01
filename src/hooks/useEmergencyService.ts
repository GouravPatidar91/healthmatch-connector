
import { useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { EmergencyCallData, createEmergencyCall, findNearbyDoctors, assignDoctorToEmergencyCall } from '@/services/emergencyService';
import { geocodeAddress, getCurrentPosition } from '@/utils/geolocation';
import { supabase } from "@/integrations/supabase/client";

export function useEmergencyService() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const submitEmergencyCall = async (callData: EmergencyCallData, doctorId?: string) => {
    if (!user) {
      setError('You must be logged in to create an emergency call');
      return null;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Create emergency call
      const callResult = await createEmergencyCall(callData);
      
      // If doctor ID is provided, assign the doctor
      if (doctorId && callResult?.id) {
        await assignDoctorToEmergencyCall(callResult.id, doctorId);
        toast({
          title: "Doctor assigned",
          description: "The doctor has been notified and will contact you shortly."
        });
      }
      
      return callResult;
      
    } catch (err) {
      console.error("Error in emergency service:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const findDoctors = async (address: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get coordinates from address
      const { latitude, longitude } = await geocodeAddress(address);
      
      // Find nearby doctors
      const doctors = await findNearbyDoctors(latitude, longitude);
      return doctors;
      
    } catch (err) {
      console.error("Error finding doctors:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Error finding doctors",
        description: errorMessage,
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Enhanced function to get user location and find nearby doctors
   * First tries GPS, then falls back to profile address
   */
  const findDoctorsNearCurrentLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let latitude: number | null = null;
      let longitude: number | null = null;
      let locationSource = '';

      // First, try GPS location
      try {
        console.log('Emergency service: Attempting GPS location...');
        const position = await getCurrentPosition();
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
        locationSource = 'GPS';
        
        toast({
          title: "GPS location found",
          description: "Using current location for emergency services...",
        });
      } catch (gpsError) {
        console.log('Emergency service: GPS failed, trying profile address...');
        
        // Fallback to profile address
        if (!user) {
          throw new Error('User not authenticated and GPS unavailable');
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('address, city, region')
          .eq('id', user.id)
          .single();

        if (profileError || (!profile?.address && !profile?.city && !profile?.region)) {
          throw new Error('No location information available. Please enable GPS or update your profile address.');
        }

        // Construct address from profile
        const addressParts = [
          profile.address,
          profile.city || profile.region
        ].filter(Boolean);
        
        const fullAddress = addressParts.join(', ');
        
        const coordinates = await geocodeAddress(fullAddress);
        latitude = coordinates.latitude;
        longitude = coordinates.longitude;
        locationSource = 'Profile Address';

        toast({
          title: "Using profile address",
          description: `Emergency location: ${fullAddress}`,
        });
      }

      if (latitude && longitude) {
        // Find nearby doctors
        const doctors = await findNearbyDoctors(latitude, longitude);
        
        toast({
          title: "Emergency doctors found",
          description: `Found ${doctors.length} doctors using ${locationSource}`,
        });
        
        return doctors;
      }

      throw new Error('Could not determine location');
      
    } catch (err) {
      console.error("Error finding doctors near current location:", err);
      const errorMessage = err instanceof Error ? err.message : 'Could not access location or find doctors';
      setError(errorMessage);
      toast({
        title: "Location error",
        description: errorMessage,
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    error,
    submitEmergencyCall,
    findDoctors,
    findDoctorsNearCurrentLocation,
  };
}
