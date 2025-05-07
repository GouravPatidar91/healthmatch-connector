
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

// Grant doctor access to a user (admin only)
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

// Revoke doctor access from a user (admin only)
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

export const useDoctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchDoctors = useCallback(async (city?: string) => {
    try {
      setLoading(true);
      
      // Use the get_verified_doctors function to get only verified doctors
      let { data: verifiedDoctors, error: funcError } = await supabase
        .rpc('get_verified_doctors');
      
      if (funcError) {
        console.error('Error fetching verified doctors using RPC:', funcError);
        
        // Fallback to direct query with verified filter if RPC fails
        const { data, error: queryError } = await supabase
          .from('doctors')
          .select('*')
          .eq('verified', true);
          
        if (queryError) {
          throw queryError;
        }
        
        verifiedDoctors = data;
      }
      
      // Filter by city if provided
      let filteredDoctors = verifiedDoctors || [];
      if (city && city !== 'all') {
        filteredDoctors = filteredDoctors.filter(doc => doc.region === city);
      }
      
      const formattedDoctors: Doctor[] = filteredDoctors.map(doctor => ({
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
        rating: 4.5,
        // Add degrees and experience to the formatted doctor
        degrees: doctor.degrees,
        experience: doctor.experience
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
      
      // Sample data for demonstration
      const sampleAppointments: Appointment[] = [
        {
          id: '1',
          doctorId: '123',
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
          doctorId: '123',
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
          doctorId: '123',
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
      
      // Get the doctor's ID based on the current user
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }
      
      // Fetch actual slots from the database
      const { data: fetchedSlots, error: slotsError } = await supabase
        .from('appointment_slots')
        .select('*')
        .eq('doctor_id', profile.id)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (slotsError) {
        console.error('Error fetching appointment slots:', slotsError);
        throw slotsError;
      }
      
      // Transform fetched slots to match our AppointmentSlot type
      const formattedSlots: AppointmentSlot[] = fetchedSlots.map(slot => ({
        id: slot.id,
        doctorId: slot.doctor_id,
        date: slot.date,
        startTime: slot.start_time.slice(0, 5), // Convert "14:00:00" to "14:00"
        endTime: slot.end_time.slice(0, 5), // Convert "14:30:00" to "14:30"
        duration: slot.duration,
        maxPatients: slot.max_patients,
        status: slot.status as 'available' | 'booked' | 'cancelled'
      }));
      
      setSlots(formattedSlots);
    } catch (err) {
      console.error('Error in fetchDoctorSlots:', err);
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
      // Format times to ensure they have seconds component for PostgreSQL time format
      const startTimeFormatted = slotData.startTime.includes(':') && slotData.startTime.split(':').length === 2
        ? `${slotData.startTime}:00`
        : slotData.startTime;
      
      const endTimeFormatted = slotData.endTime.includes(':') && slotData.endTime.split(':').length === 2
        ? `${slotData.endTime}:00`
        : slotData.endTime;
      
      // Insert the new slot into the database
      const { data: newSlot, error } = await supabase
        .from('appointment_slots')
        .insert({
          doctor_id: user.id,
          date: slotData.date,
          start_time: startTimeFormatted,
          end_time: endTimeFormatted,
          duration: slotData.duration,
          max_patients: slotData.maxPatients,
          status: slotData.status
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating appointment slot:', error);
        throw error;
      }
      
      // Convert the new slot to match our AppointmentSlot type
      const formattedNewSlot: AppointmentSlot = {
        id: newSlot.id,
        doctorId: newSlot.doctor_id,
        date: newSlot.date,
        startTime: newSlot.start_time.slice(0, 5),
        endTime: newSlot.end_time.slice(0, 5),
        duration: newSlot.duration,
        maxPatients: newSlot.max_patients,
        status: newSlot.status as 'available' | 'booked' | 'cancelled'
      };
      
      // Update local state
      setSlots(prev => [...prev, formattedNewSlot]);
      
      return formattedNewSlot;
    } catch (error) {
      console.error('Error in createSlot:', error);
      throw error;
    }
  };
  
  const deleteSlot = async (slotId: string) => {
    try {
      // Delete the slot from the database
      const { error } = await supabase
        .from('appointment_slots')
        .delete()
        .eq('id', slotId);
      
      if (error) {
        console.error('Error deleting appointment slot:', error);
        throw error;
      }
      
      // Update local state
      setSlots(prev => prev.filter(slot => slot.id !== slotId));
      
      return true;
    } catch (error) {
      console.error('Error in deleteSlot:', error);
      throw error;
    }
  };
  
  const updateSlotStatus = async (slotId: string, status: 'available' | 'booked' | 'cancelled') => {
    try {
      // Update the slot status in the database
      const { error } = await supabase
        .from('appointment_slots')
        .update({ status })
        .eq('id', slotId);
      
      if (error) {
        console.error('Error updating appointment slot status:', error);
        throw error;
      }
      
      // Update local state
      setSlots(prev => 
        prev.map(slot => 
          slot.id === slotId ? { ...slot, status } : slot
        )
      );
      
      return true;
    } catch (error) {
      console.error('Error in updateSlotStatus:', error);
      throw error;
    }
  };

  return {
    slots,
    loading,
    error,
    refetch: fetchDoctorSlots,
    createSlot,
    deleteSlot,
    updateSlotStatus
  };
};
