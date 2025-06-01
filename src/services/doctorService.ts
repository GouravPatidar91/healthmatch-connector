
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

export interface AppointmentSlot {
  id: string;
  doctor_id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  maxPatients: number;
  status: 'available' | 'booked' | 'cancelled';
}

export interface DoctorAppointment {
  id: string;
  patientName?: string;
  time: string;
  reason?: string;
  status: 'pending' | 'completed' | 'cancelled';
  date: string;
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

  const findNearbyDoctors = async () => {
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation not supported');
      }

      return new Promise<boolean>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              const nearbyDoctors = await findNearestDoctors(latitude, longitude);
              // Ensure nearbyDoctors have all required properties
              const formattedDoctors = nearbyDoctors.map((doctor: any) => ({
                ...doctor,
                region: doctor.region || 'Unknown', // Add default region if missing
              }));
              setDoctors(formattedDoctors);
              resolve(true);
            } catch (error) {
              console.error('Error finding nearby doctors:', error);
              resolve(false);
            }
          },
          () => resolve(false)
        );
      });
    } catch (error) {
      console.error('Error accessing location:', error);
      return false;
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

// Custom hook for doctor appointments
export const useDoctorAppointments = () => {
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        // Mock appointments data for now
        const mockAppointments: DoctorAppointment[] = [
          {
            id: '1',
            patientName: 'John Doe',
            time: '09:00',
            reason: 'Consultation',
            status: 'pending',
            date: new Date().toISOString().split('T')[0]
          }
        ];
        
        setAppointments(mockAppointments);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch appointments'));
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const markAppointmentAsCompleted = async (appointmentId: string) => {
    setAppointments(prev => 
      prev.map(apt => 
        apt.id === appointmentId ? { ...apt, status: 'completed' as const } : apt
      )
    );
  };

  const cancelAppointment = async (appointmentId: string) => {
    setAppointments(prev => 
      prev.map(apt => 
        apt.id === appointmentId ? { ...apt, status: 'cancelled' as const } : apt
      )
    );
  };

  return { 
    appointments, 
    loading, 
    error, 
    markAppointmentAsCompleted, 
    cancelAppointment 
  };
};

// Custom hook for doctor slots
export const useDoctorSlots = () => {
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        // Mock slots data for now
        const mockSlots: AppointmentSlot[] = [];
        setSlots(mockSlots);
      } catch (err) {
        console.error('Error fetching slots:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch slots'));
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, []);

  const createSlot = async (slotData: Omit<AppointmentSlot, 'id'>) => {
    const newSlot: AppointmentSlot = {
      ...slotData,
      id: Math.random().toString(36).substr(2, 9)
    };
    setSlots(prev => [...prev, newSlot]);
  };

  const deleteSlot = async (slotId: string) => {
    setSlots(prev => prev.filter(slot => slot.id !== slotId));
  };

  const updateSlotStatus = async (slotId: string, status: 'available' | 'booked' | 'cancelled') => {
    setSlots(prev => 
      prev.map(slot => 
        slot.id === slotId ? { ...slot, status } : slot
      )
    );
  };

  return { 
    slots, 
    loading, 
    error, 
    createSlot, 
    deleteSlot, 
    updateSlotStatus 
  };
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
