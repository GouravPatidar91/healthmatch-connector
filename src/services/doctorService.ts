
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { geocodeAddress, getCurrentPosition } from "@/utils/geolocation";

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  region: string;
  address: string;
  email?: string;
  availability?: {
    day: string;
    slots: string[];
  }[];
  rating?: number;
  degrees?: string;
  experience?: number;
  verified?: boolean;
  available?: boolean;
}

export interface AppointmentSlot {
  id: string;
  doctor_id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration: number;
  max_patients: number;
  status: 'available' | 'booked' | 'cancelled';
}

export interface DoctorAppointment {
  id: string;
  patientName?: string;
  time: string;
  reason?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'confirmed';
  date: string;
  notes?: string;
}

// Custom hook to fetch all doctors - RLS policy ensures only verified, available ones are returned
export const useDoctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        console.log('Fetching verified doctors...');
        
        // Simple query - RLS policy handles the filtering
        const { data, error } = await supabase
          .from('doctors')
          .select('*');

        if (error) {
          console.error('Error fetching doctors:', error);
          throw error;
        }

        console.log('Fetched doctors data:', data);
        
        // Transform the data to match our interface
        const transformedDoctors = (data || []).map(doctor => ({
          ...doctor,
          verified: true, // All returned doctors are verified due to RLS
          available: true // All returned doctors are available due to RLS
        }));
        
        console.log('Final transformed doctors:', transformedDoctors);
        setDoctors(transformedDoctors);
      } catch (err) {
        console.error('Error fetching doctors:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch doctors'));
        toast({
          title: "Error",
          description: "Failed to fetch doctors list",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [toast]);

  const findNearbyDoctors = async () => {
    try {
      setLoading(true);
      
      // Try to get GPS location first
      let latitude: number | null = null;
      let longitude: number | null = null;
      let locationSource = '';

      try {
        console.log('Attempting to get GPS location...');
        const position = await getCurrentPosition();
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
        locationSource = 'GPS';
        
        toast({
          title: "GPS location found",
          description: "Using your current location to find nearby doctors...",
        });
      } catch (gpsError) {
        console.log('GPS location failed, trying profile address...', gpsError);
        
        // Fallback to user's profile address
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            throw new Error('User not authenticated');
          }

          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('address, city, region')
            .eq('id', user.id)
            .single();

          if (profileError) {
            throw new Error('Failed to fetch user profile');
          }

          if (!profile?.address && !profile?.city && !profile?.region) {
            throw new Error('No address information found in profile');
          }

          // Construct address from profile data
          const addressParts = [
            profile.address,
            profile.city || profile.region
          ].filter(Boolean);
          
          const fullAddress = addressParts.join(', ');
          
          console.log('Using profile address for geocoding:', fullAddress);
          
          const coordinates = await geocodeAddress(fullAddress);
          latitude = coordinates.latitude;
          longitude = coordinates.longitude;
          locationSource = 'Profile Address';

          toast({
            title: "Using profile address",
            description: `Finding doctors near: ${fullAddress}`,
          });
        } catch (profileError) {
          console.error('Profile address fallback failed:', profileError);
          
          toast({
            title: "Location not available",
            description: "Please enable GPS or update your address in your profile to find nearby doctors.",
            variant: "destructive"
          });
          
          return false;
        }
      }

      if (latitude && longitude) {
        // Find nearby doctors using coordinates
        const nearbyDoctors = await findNearestDoctors(latitude, longitude);
        
        // Transform the data to match our Doctor interface
        const transformedDoctors: Doctor[] = nearbyDoctors.map(doctor => ({
          id: doctor.id,
          name: doctor.name,
          specialization: doctor.specialization,
          hospital: doctor.hospital,
          address: doctor.address,
          region: '', // Set a default value since it's required
          verified: true,
          available: true
        }));
        
        setDoctors(transformedDoctors);
        
        toast({
          title: "Nearby doctors found",
          description: `Found ${transformedDoctors.length} doctors using ${locationSource}`,
        });
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error finding nearby doctors:', error);
      toast({
        title: "Error",
        description: "Failed to find nearby doctors. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { doctors, loading, error, findNearbyDoctors };
};

// Custom hook to fetch doctors by specialization
export const useDoctorsBySpecialization = (specialization?: string) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        let query = supabase.from('doctors').select('*');

        if (specialization) {
          query = query.eq('specialization', specialization);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        // Transform the data to match our interface
        const transformedDoctors = (data || []).map(doctor => ({
          ...doctor,
          verified: true,
          available: true
        }));

        setDoctors(transformedDoctors);
      } catch (err) {
        console.error('Error fetching doctors by specialization:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch doctors'));
        toast({
          title: "Error",
          description: "Failed to fetch doctors list",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [specialization, toast]);

  return { doctors, loading, error };
};

// Function to find nearest doctors 
export const findNearestDoctors = async (
  latitude: number,
  longitude: number,
  specialization?: string
) => {
  try {
    // Use the database function which will respect RLS policies
    const { data: nearbyDoctors, error } = await supabase
      .rpc('find_nearest_doctor', {
        lat: latitude,
        long: longitude,
        specialization_filter: specialization || null
      });

    if (error) {
      throw error;
    }

    console.log('Nearest doctors from database function:', nearbyDoctors);
    return nearbyDoctors || [];
  } catch (err) {
    console.error('Error finding nearest doctors:', err);
    throw err;
  }
};

// Function to check if user has doctor access
export const checkDoctorAccess = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_doctor')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking doctor access:', error);
      return false;
    }

    return !!data?.is_doctor;
  } catch (error) {
    console.error('Error checking doctor access:', error);
    return false;
  }
};

// Function to grant doctor access
export const grantDoctorAccess = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ is_doctor: true })
      .eq('id', userId);

    if (error) {
      console.error('Error granting doctor access:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error granting doctor access:', error);
    return false;
  }
};

// Function to revoke doctor access
export const revokeDoctorAccess = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ is_doctor: false })
      .eq('id', userId);

    if (error) {
      console.error('Error revoking doctor access:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error revoking doctor access:', error);
    return false;
  }
};
