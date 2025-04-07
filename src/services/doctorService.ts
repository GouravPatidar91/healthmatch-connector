
import { supabase } from "@/integrations/supabase/client";
import { Doctor } from "@/types";

export const useDoctors = () => {
  const [doctors, setDoctors] = React.useState<Doctor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchDoctors = React.useCallback(async () => {
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
        availability: doctor.availability || [
          { day: 'Monday', slots: ['09:00', '10:00', '11:00'] },
          { day: 'Tuesday', slots: ['13:00', '14:00', '15:00'] },
          { day: 'Wednesday', slots: ['09:00', '10:00', '11:00'] },
          { day: 'Thursday', slots: ['13:00', '14:00', '15:00'] },
          { day: 'Friday', slots: ['09:00', '10:00', '11:00'] }
        ],
        rating: doctor.rating || 4.5
      }));
      
      setDoctors(formattedDoctors);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  return { doctors, loading, error, refetch: fetchDoctors };
};
