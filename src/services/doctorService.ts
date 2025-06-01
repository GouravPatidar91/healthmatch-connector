
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  region: string;
  address: string;
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

// Custom hook to fetch all doctors
export const useDoctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { data, error } = await supabase
          .from('doctors')
          .select('*')
          .eq('verified', true)
          .eq('available', true);

        if (error) {
          throw error;
        }

        setDoctors(data || []);
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

  return { doctors, loading, error };
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
        let query = supabase
          .from('doctors')
          .select('*')
          .eq('verified', true)
          .eq('available', true);

        if (specialization) {
          query = query.eq('specialization', specialization);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        setDoctors(data || []);
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

// Function to find nearest doctors using Supabase function
export const findNearestDoctors = async (
  latitude: number,
  longitude: number,
  specialization?: string
) => {
  try {
    const { data, error } = await supabase.rpc('find_nearest_doctor', {
      lat: latitude,
      long: longitude,
      specialization_filter: specialization || null
    });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error('Error finding nearest doctors:', err);
    throw err;
  }
};
