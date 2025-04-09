
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Doctor } from "@/types";
import { getUserRegion, getNearbyRegions } from "@/utils/geolocation";
import { useToast } from "@/hooks/use-toast";

export const useDoctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchDoctors = useCallback(async (region?: string) => {
    try {
      setLoading(true);
      
      let query = supabase.from('doctors').select('*');
      
      // Filter by region if provided
      if (region && region !== 'all') {
        query = query.eq('region', region);
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      // Transform the data to match our Doctor type
      const formattedDoctors: Doctor[] = data.map(doctor => ({
        id: doctor.id,
        name: doctor.name,
        specialization: doctor.specialization,
        hospital: doctor.hospital,
        region: doctor.region,
        address: doctor.address,
        // Add default availability since it's not in the database
        availability: [
          { day: 'Monday', slots: ['09:00', '10:00', '11:00'] },
          { day: 'Tuesday', slots: ['13:00', '14:00', '15:00'] },
          { day: 'Wednesday', slots: ['09:00', '10:00', '11:00'] },
          { day: 'Thursday', slots: ['13:00', '14:00', '15:00'] },
          { day: 'Friday', slots: ['09:00', '10:00', '11:00'] }
        ],
        // Add default rating since it's not in the database
        rating: 4.5
      }));
      
      setDoctors(formattedDoctors);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError(err as Error);
      toast({
        title: "Error",
        description: "Failed to fetch doctors. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Initial fetch
  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  /**
   * Find nearby doctors based on user's geolocation
   */
  const findNearbyDoctors = async () => {
    try {
      setLoading(true);
      
      // Get user's region from geolocation
      const userRegion = await getUserRegion();
      
      if (userRegion) {
        await fetchDoctors(userRegion);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error finding nearby doctors:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { 
    doctors, 
    loading, 
    error, 
    refetch: fetchDoctors,
    findNearbyDoctors 
  };
};

/**
 * Find doctors near a specific location
 */
export const findDoctorsNearLocation = async (latitude: number, longitude: number) => {
  try {
    // In a real implementation, we'd use the PostGIS extension and ST_Distance to find nearby doctors
    // For this implementation, we'll use the regions
    const regions = getNearbyRegions(latitude, longitude);
    
    if (!regions.length) return [];
    
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .in('region', regions);
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error finding doctors near location:', error);
    return [];
  }
};
