import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Doctor, AppointmentSlot } from "@/types";

// Types for local use in the doctor service
export interface DoctorAppointment {
  id: string;
  patientName?: string;
  date: string;
  time: string;
  reason?: string;
  status: string;
}

// Custom hook for doctor slots
export const useDoctorSlots = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSlots = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointment_slots')
        .select('*')
        .eq('doctor_id', user.id)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (error) throw new Error(error.message);
      
      if (!data) {
        setSlots([]);
        return;
      }
      
      // Transform the data to match the AppointmentSlot interface
      const transformedSlots: AppointmentSlot[] = data.map(slot => ({
        id: slot.id,
        doctor_id: slot.doctor_id,
        date: slot.date,
        startTime: slot.start_time,
        endTime: slot.end_time,
        duration: slot.duration,
        maxPatients: slot.max_patients,
        status: slot.status as 'available' | 'booked' | 'cancelled',
      }));
      
      setSlots(transformedSlots);
    } catch (err) {
      console.error("Error fetching doctor slots:", err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const createSlot = async (slotData: Omit<AppointmentSlot, 'id'>) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      const { data, error } = await supabase
        .from('appointment_slots')
        .insert({
          doctor_id: slotData.doctor_id,
          date: slotData.date,
          start_time: slotData.startTime,
          end_time: slotData.endTime,
          duration: slotData.duration,
          max_patients: slotData.maxPatients,
          status: slotData.status
        })
        .select()
        .single();
      
      if (error) throw error;
      
      await fetchSlots();
      return data.id;
    } catch (err) {
      console.error("Error creating slot:", err);
      throw err;
    }
  };

  const deleteSlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('appointment_slots')
        .delete()
        .eq('id', slotId);
      
      if (error) throw error;
      
      await fetchSlots();
      return true;
    } catch (err) {
      console.error("Error deleting slot:", err);
      throw err;
    }
  };

  const updateSlotStatus = async (slotId: string, status: 'available' | 'booked' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('appointment_slots')
        .update({ status })
        .eq('id', slotId);
      
      if (error) throw error;
      
      await fetchSlots();
      return true;
    } catch (err) {
      console.error("Error updating slot status:", err);
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchSlots();
    }
  }, [user]);

  return { slots, loading, error, createSlot, deleteSlot, updateSlotStatus, refreshSlots: fetchSlots };
};

// Custom hook for doctor appointments - FIX: Simplified type handling to avoid deep instantiation
export const useDoctorAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAppointments = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch doctor appointments from the database
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', user.id);
      
      if (error) throw new Error(error.message);
      
      if (!data) {
        setAppointments([]);
        return;
      }
      
      // Transform the data to match the DoctorAppointment interface
      const transformedAppointments: DoctorAppointment[] = data.map(apt => ({
        id: apt.id,
        patientName: apt.user_id ? 'Patient' : 'Patient', // Replace with actual patient name if available
        date: apt.date,
        time: apt.time,
        reason: apt.reason,
        status: apt.status ?? 'pending',
      }));
      
      setAppointments(transformedAppointments);
    } catch (err) {
      console.error("Error fetching doctor appointments:", err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const markAppointmentAsCompleted = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId);
      
      if (error) throw error;
      
      await fetchAppointments();
      return true;
    } catch (err) {
      console.error("Error marking appointment as completed:", err);
      throw err;
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);
      
      if (error) throw error;
      
      await fetchAppointments();
      return true;
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  return { 
    appointments, 
    loading, 
    error, 
    markAppointmentAsCompleted, 
    cancelAppointment, 
    refreshAppointments: fetchAppointments 
  };
};

// Custom hook for managing doctors
export const useDoctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      // Only fetch verified and available doctors
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('verified', true)
        .eq('available', true);
        
      if (error) throw new Error(error.message);
      
      if (!data) {
        setDoctors([]);
        return;
      }
      
      // Add availability data for each doctor
      const doctorsWithAvailability: Doctor[] = data.map(doc => ({
        id: doc.id,
        name: doc.name,
        specialization: doc.specialization,
        hospital: doc.hospital,
        region: doc.region,
        address: doc.address,
        degrees: doc.degrees,
        experience: doc.experience,
        rating: 4.5, // Default rating
        verified: doc.verified ?? false,
        available: doc.available,
        availability: [
          { day: 'Monday', slots: ['09:00', '10:00', '11:00'] },
          { day: 'Wednesday', slots: ['14:00', '15:00', '16:00'] },
          { day: 'Friday', slots: ['10:00', '11:00', '12:00'] },
        ]
      }));
      
      setDoctors(doctorsWithAvailability);
    } catch (err) {
      console.error("Error fetching doctors:", err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const findNearbyDoctors = async () => {
    try {
      // Get user's geolocation
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });
      
      const { latitude, longitude } = position.coords;
      
      // Query the database for nearby doctors
      const { data, error } = await supabase
        .rpc('find_nearest_doctor', { lat: latitude, long: longitude });
      
      if (error) throw error;
      
      if (!data) {
        setDoctors([]);
        return true;
      }
      
      // Add availability data for each doctor - FIX: Added missing region property
      const doctorsWithAvailability: Doctor[] = data.map(doc => ({
        id: doc.id,
        name: doc.name,
        specialization: doc.specialization,
        hospital: doc.hospital,
        region: doc.address.split(',').pop()?.trim() || 'Unknown',
        address: doc.address,
        degrees: 'MD',
        experience: 5,
        rating: 4.5, // Default rating
        verified: true,
        available: true,
        availability: [
          { day: 'Monday', slots: ['09:00', '10:00', '11:00'] },
          { day: 'Wednesday', slots: ['14:00', '15:00', '16:00'] },
          { day: 'Friday', slots: ['10:00', '11:00', '12:00'] },
        ]
      }));
      
      setDoctors(doctorsWithAvailability);
      return true;
    } catch (err) {
      console.error("Error finding nearby doctors:", err);
      return false;
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  return { doctors, loading, error, findNearbyDoctors, refreshDoctors: fetchDoctors };
};

// Check if a user has doctor access
export const checkDoctorAccess = async (userId: string) => {
  try {
    // Get the doctor status from the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('is_doctor')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error("Error checking doctor access:", error);
      return false;
    }
    
    return !!data?.is_doctor;
  } catch (error) {
    console.error("Error checking doctor access:", error);
    return false;
  }
};

// Grant doctor access to a user
export const grantDoctorAccess = async (userId: string) => {
  try {
    // Update the profile to grant doctor access
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ is_doctor: true })
      .eq('id', userId);
    
    if (profileUpdateError) {
      console.error("Error granting doctor access (profile):", profileUpdateError);
      throw new Error("Failed to grant doctor access");
    }
    
    // Also update the doctor record if it exists
    const { data: doctorData, error: doctorCheckError } = await supabase
      .from('doctors')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
      
    if (!doctorCheckError && doctorData) {
      // Doctor record exists, update it
      const { error: doctorUpdateError } = await supabase
        .from('doctors')
        .update({ verified: true })
        .eq('id', userId);
      
      if (doctorUpdateError) {
        console.error("Error updating doctor verification:", doctorUpdateError);
        // We don't throw here since the profile update succeeded
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error granting doctor access:", error);
    throw error;
  }
};

// Revoke doctor access from a user
export const revokeDoctorAccess = async (userId: string) => {
  try {
    // Update the profile to revoke doctor access
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ is_doctor: false })
      .eq('id', userId);
    
    if (profileUpdateError) {
      console.error("Error revoking doctor access (profile):", profileUpdateError);
      throw new Error("Failed to revoke doctor access");
    }
    
    // Also update the doctor record if it exists
    const { data: doctorData, error: doctorCheckError } = await supabase
      .from('doctors')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
      
    if (!doctorCheckError && doctorData) {
      // Doctor record exists, update it
      const { error: doctorUpdateError } = await supabase
        .from('doctors')
        .update({ verified: false })
        .eq('id', userId);
      
      if (doctorUpdateError) {
        console.error("Error updating doctor verification:", doctorUpdateError);
        // We don't throw here since the profile update succeeded
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error revoking doctor access:", error);
    throw error;
  }
};

// Get all available, verified doctors for appointments
export const getAvailableDoctors = async () => {
  try {
    // First, get all verified and available doctors from the doctors table
    const { data: doctorsData, error: doctorsError } = await supabase
      .from('doctors')
      .select('*')
      .eq('verified', true)
      .eq('available', true);
    
    if (doctorsError) {
      console.error("Error fetching doctors:", doctorsError);
      return [];
    }
    
    return doctorsData || [];
  } catch (error) {
    console.error("Error fetching available doctors:", error);
    return [];
  }
};

// Create or update appointment slots for a doctor
export const createAppointmentSlots = async (
  doctorId: string, 
  date: string, 
  startTime: string, 
  endTime: string, 
  duration: number, 
  maxPatients: number = 1
) => {
  try {
    // Check if the slot already exists
    const { data: existingSlot, error: checkError } = await supabase
      .from('appointment_slots')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('date', date)
      .eq('start_time', startTime)
      .eq('end_time', endTime)
      .maybeSingle();
    
    if (checkError) {
      console.error("Error checking existing slot:", checkError);
      throw new Error("Failed to create appointment slot");
    }
    
    if (existingSlot) {
      // Update the existing slot
      const { error: updateError } = await supabase
        .from('appointment_slots')
        .update({
          duration,
          max_patients: maxPatients,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSlot.id);
      
      if (updateError) {
        console.error("Error updating slot:", updateError);
        throw new Error("Failed to update appointment slot");
      }
      
      return existingSlot.id;
    } else {
      // Create a new slot
      const { data: newSlot, error: insertError } = await supabase
        .from('appointment_slots')
        .insert({
          doctor_id: doctorId,
          date,
          start_time: startTime,
          end_time: endTime,
          duration,
          max_patients: maxPatients,
          status: 'available'
        })
        .select()
        .single();
      
      if (insertError) {
        console.error("Error creating slot:", insertError);
        throw new Error("Failed to create appointment slot");
      }
      
      return newSlot.id;
    }
  } catch (error) {
    console.error("Error creating/updating appointment slot:", error);
    throw error;
  }
};

// Get appointment slots for a doctor
export const getDoctorAppointmentSlots = async (doctorId: string) => {
  try {
    const { data, error } = await supabase
      .from('appointment_slots')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });
    
    if (error) {
      console.error("Error fetching appointment slots:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching doctor appointment slots:", error);
    return [];
  }
};

// Delete an appointment slot
export const deleteAppointmentSlot = async (slotId: string) => {
  try {
    const { error } = await supabase
      .from('appointment_slots')
      .delete()
      .eq('id', slotId);
    
    if (error) {
      console.error("Error deleting appointment slot:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting appointment slot:", error);
    return false;
  }
};

export const getDoctorDetails = async (doctorId: string) => {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('id', doctorId)
      .single();
    
    if (error) {
      console.error("Error fetching doctor details:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching doctor details:", error);
    return null;
  }
};
