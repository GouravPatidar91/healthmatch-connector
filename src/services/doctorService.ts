
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Doctor, AppointmentSlot } from "@/types";
import { getUserCity, getNearbyCities, getWorldCities } from "@/utils/geolocation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface Appointment {
  id: string;
  patientName?: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  reason?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

export const useDoctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchDoctors = useCallback(async (city?: string) => {
    try {
      setLoading(true);
      
      let query = supabase.from('doctors').select('*');
      
      // Filter by city if provided
      if (city && city !== 'all') {
        query = query.eq('region', city);
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      // Transform the data to match our Doctor type
      const formattedDoctors: Doctor[] = data.map(doctor => ({
        id: doctor.id,
        name: doctor.name,
        specialization: doctor.specialization,
        hospital: doctor.hospital,
        region: doctor.region, // We'll keep using this field but interpret it as city
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
      
      // Get user's city from geolocation
      const userCity = await getUserCity();
      
      if (userCity) {
        await fetchDoctors(userCity);
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
    // For this implementation, we'll use the cities
    const cities = getNearbyCities(latitude, longitude);
    
    if (!cities.length) return [];
    
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .in('region', cities);
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error finding doctors near location:', error);
    return [];
  }
};

export const useDoctorAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const fetchDoctorAppointments = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Look up the doctor ID using the user's auth ID
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (doctorError) {
        throw doctorError;
      }
      
      if (!doctorData) {
        throw new Error('Doctor not found');
      }
      
      // Fetch appointments for this doctor
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', doctorData.id)
        .order('date', { ascending: true })
        .order('time', { ascending: true });
        
      if (appointmentsError) {
        throw appointmentsError;
      }
      
      // Transform the data to match our Appointment interface
      const formattedAppointments: Appointment[] = (appointmentsData || []).map(appointment => ({
        id: appointment.id,
        doctorId: appointment.doctor_id || "",
        doctorName: appointment.doctor_name || "",
        patientName: "Patient Name", // This would come from a join with the users table in a real app
        date: appointment.date,
        time: appointment.time,
        reason: appointment.reason || "",
        status: appointment.status as 'pending' | 'confirmed' | 'completed' | 'cancelled',
        notes: appointment.notes
      }));
      
      setAppointments(formattedAppointments);
    } catch (err) {
      console.error('Error fetching doctor appointments:', err);
      setError(err as Error);
      toast({
        title: "Error",
        description: "Failed to fetch appointments. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchDoctorAppointments();
    }
  }, [fetchDoctorAppointments, user]);
  
  const markAppointmentAsCompleted = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId);
      
      if (error) throw error;
      
      // Update local state
      setAppointments(prev => 
        prev.map(appointment => 
          appointment.id === appointmentId 
            ? { ...appointment, status: 'completed' as const }
            : appointment
        )
      );
      
      return true;
    } catch (error) {
      console.error('Error marking appointment as completed:', error);
      throw error;
    }
  };
  
  const cancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);
      
      if (error) throw error;
      
      // Update local state
      setAppointments(prev => 
        prev.map(appointment => 
          appointment.id === appointmentId 
            ? { ...appointment, status: 'cancelled' as const }
            : appointment
        )
      );
      
      return true;
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  };

  return {
    appointments,
    loading,
    error,
    refetch: fetchDoctorAppointments,
    markAppointmentAsCompleted,
    cancelAppointment
  };
};

export const useDoctorSlots = () => {
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const fetchDoctorSlots = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Look up the doctor ID using the user's auth ID
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (doctorError) {
        throw doctorError;
      }
      
      if (!doctorData) {
        throw new Error('Doctor not found');
      }
      
      // For now, return mock data since the table doesn't exist yet
      // This will be replaced with actual database calls once the table is created
      const mockSlots: AppointmentSlot[] = [
        {
          id: "1",
          doctorId: doctorData.id,
          date: "2025-04-15",
          startTime: "09:00",
          endTime: "09:30",
          duration: 30,
          maxPatients: 1,
          status: 'available'
        },
        {
          id: "2",
          doctorId: doctorData.id,
          date: "2025-04-15",
          startTime: "10:00",
          endTime: "10:30",
          duration: 30,
          maxPatients: 1,
          status: 'booked'
        },
        {
          id: "3",
          doctorId: doctorData.id,
          date: "2025-04-16",
          startTime: "14:00",
          endTime: "14:30",
          duration: 30,
          maxPatients: 1,
          status: 'available'
        }
      ];
      
      setSlots(mockSlots);
    } catch (err) {
      console.error('Error fetching doctor slots:', err);
      setError(err as Error);
      toast({
        title: "Error",
        description: "Failed to fetch appointment slots. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchDoctorSlots();
    }
  }, [fetchDoctorSlots, user]);
  
  const createSlot = async (slotData: Omit<AppointmentSlot, 'id' | 'doctorId'>) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      // Look up the doctor ID using the user's auth ID
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (doctorError) throw doctorError;
      if (!doctorData) throw new Error('Doctor not found');
      
      // For now, just generate a mock ID and add to local state
      // This will be replaced with actual database calls once the table is created
      const newId = Math.random().toString(36).substring(2, 15);
      
      const newSlot: AppointmentSlot = {
        id: newId,
        doctorId: doctorData.id,
        ...slotData
      };
      
      setSlots(prev => [...prev, newSlot]);
      
      return newSlot;
    } catch (error) {
      console.error('Error creating appointment slot:', error);
      throw error;
    }
  };
  
  const deleteSlot = async (slotId: string) => {
    try {
      // For now, just remove from local state
      // This will be replaced with actual database calls once the table is created
      setSlots(prev => prev.filter(slot => slot.id !== slotId));
      
      return true;
    } catch (error) {
      console.error('Error deleting appointment slot:', error);
      throw error;
    }
  };

  return {
    slots,
    loading,
    error,
    refetch: fetchDoctorSlots,
    createSlot,
    deleteSlot
  };
};
