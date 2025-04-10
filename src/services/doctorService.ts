
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

// Check if a user has doctor access
export const checkDoctorAccess = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_doctor')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    
    return !!data?.is_doctor;
  } catch (error) {
    console.error('Error checking doctor access:', error);
    return false;
  }
};

// Grant doctor access to a user (admin only)
export const grantDoctorAccess = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ is_doctor: true })
      .eq('id', userId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error granting doctor access:', error);
    return false;
  }
};

// Revoke doctor access from a user (admin only)
export const revokeDoctorAccess = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ is_doctor: false })
      .eq('id', userId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error revoking doctor access:', error);
    return false;
  }
};

export const useDoctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchDoctors = useCallback(async (city?: string) => {
    try {
      setLoading(true);
      
      let query = supabase.from('doctors').select('*');
      
      if (city && city !== 'all') {
        query = query.eq('region', city);
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      const formattedDoctors: Doctor[] = data.map(doctor => ({
        id: doctor.id,
        name: doctor.name,
        specialization: doctor.specialization,
        hospital: doctor.hospital,
        region: doctor.region,
        address: doctor.address,
        availability: [
          { day: 'Monday', slots: ['09:00', '10:00', '11:00'] },
          { day: 'Tuesday', slots: ['13:00', '14:00', '15:00'] },
          { day: 'Wednesday', slots: ['09:00', '10:00', '11:00'] },
          { day: 'Thursday', slots: ['13:00', '14:00', '15:00'] },
          { day: 'Friday', slots: ['09:00', '10:00', '11:00'] }
        ],
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

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const findNearbyDoctors = async () => {
    try {
      setLoading(true);
      
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

export const findDoctorsNearLocation = async (latitude: number, longitude: number) => {
  try {
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
      
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', doctorData.id)
        .order('date', { ascending: true })
        .order('time', { ascending: true });
        
      if (appointmentsError) {
        throw appointmentsError;
      }
      
      const sampleAppointments: Appointment[] = [
        {
          id: '1',
          doctorId: doctorData.id,
          doctorName: 'Dr. Smith',
          patientName: 'John Doe',
          date: '2024-04-15',
          time: '09:00',
          reason: 'Consultation',
          status: 'pending',
          notes: ''
        },
        {
          id: '2',
          doctorId: doctorData.id,
          doctorName: 'Dr. Smith',
          patientName: 'Jane Smith',
          date: '2024-04-15',
          time: '10:00',
          reason: 'Follow-up',
          status: 'confirmed',
          notes: 'Patient has a history of hypertension'
        },
        {
          id: '3',
          doctorId: doctorData.id,
          doctorName: 'Dr. Smith',
          patientName: 'Bob Johnson',
          date: '2024-04-16',
          time: '14:00',
          reason: 'Annual check-up',
          status: 'confirmed',
          notes: ''
        }
      ];
      
      setAppointments(sampleAppointments);
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

  useEffect(() => {
    if (user) {
      fetchDoctorAppointments();
    }
  }, [fetchDoctorAppointments, user]);
  
  const markAppointmentAsCompleted = async (appointmentId: string) => {
    try {
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
      
      // Sample data for demonstration
      const sampleSlots: AppointmentSlot[] = [
        {
          id: '1',
          doctorId: '123',
          date: '2024-04-15',
          startTime: '09:00',
          endTime: '09:30',
          duration: 30,
          maxPatients: 1,
          status: 'available'
        },
        {
          id: '2',
          doctorId: '123',
          date: '2024-04-15',
          startTime: '10:00',
          endTime: '10:30',
          duration: 30,
          maxPatients: 1,
          status: 'booked'
        },
        {
          id: '3',
          doctorId: '123',
          date: '2024-04-16',
          startTime: '14:00',
          endTime: '15:00',
          duration: 60,
          maxPatients: 2,
          status: 'available'
        }
      ];
      
      setSlots(sampleSlots);
      
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

  useEffect(() => {
    if (user) {
      fetchDoctorSlots();
    }
  }, [fetchDoctorSlots, user]);
  
  const createSlot = async (slotData: Omit<AppointmentSlot, 'id' | 'doctorId'>) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const newId = Math.random().toString(36).substring(2, 15);
      
      const newSlot: AppointmentSlot = {
        id: newId,
        doctorId: '123',
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
