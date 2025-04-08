
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Doctor } from "@/types";

export const useDoctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('doctors')
        .select('*');
      
      if (error) throw error;
      
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  return { doctors, loading, error, refetch: fetchDoctors };
};
