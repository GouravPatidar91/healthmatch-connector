import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export interface AppointmentBooking {
  doctorName: string;
  doctorId?: string;
  date: string;
  time: string;
  reason?: string;
  notes?: string;
}

export interface DoctorSlot {
  id: string;
  doctor_id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration: number;
  max_patients: number;
  status: string;
  doctor?: {
    name: string;
    specialization: string;
    hospital: string;
  };
}

export const useAppointmentBooking = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const bookDirectAppointment = async (booking: AppointmentBooking) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('Booking direct appointment for:', booking.doctorName);

      // First, get the doctor's ID from their name to ensure proper linking
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('id, name')
        .eq('name', booking.doctorName)
        .single();

      if (doctorError) {
        console.error('Error finding doctor:', doctorError);
        throw new Error('Doctor not found');
      }

      if (!doctorData) {
        throw new Error('Doctor not found in database');
      }

      console.log('Found doctor:', doctorData);

      // Insert the appointment with the correct doctor_id
      const { error: insertError } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          doctor_id: doctorData.id, // This is crucial - ensures it shows on doctor's dashboard
          doctor_name: booking.doctorName,
          date: booking.date,
          time: booking.time,
          reason: booking.reason || 'General consultation',
          notes: booking.notes,
          status: 'pending'
        });

      if (insertError) {
        console.error('Error inserting appointment:', insertError);
        throw insertError;
      }

      console.log('Direct appointment successfully booked with doctor_id:', doctorData.id);

      toast({
        title: "Appointment Booked",
        description: `Your appointment with ${booking.doctorName} has been successfully booked.`,
      });
    } catch (error) {
      console.error('Error booking direct appointment:', error);
      toast({
        title: "Booking Failed",
        description: "Failed to book appointment. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const bookSlotAppointment = async (slotId: string, patientName: string, reason?: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('appointment_slots')
        .update({
          user_id: user.id,
          patient_name: patientName,
          reason: reason || 'General consultation',
          status: 'booked'
        })
        .eq('id', slotId)
        .eq('status', 'available');

      if (error) throw error;

      toast({
        title: "Slot Booked",
        description: "Your appointment slot has been successfully booked.",
      });
    } catch (error) {
      console.error('Error booking slot:', error);
      toast({
        title: "Booking Failed",
        description: "Failed to book slot. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getAvailableSlots = async (): Promise<DoctorSlot[]> => {
    try {
      const { data, error } = await supabase
        .from('appointment_slots')
        .select(`
          *,
          doctors:doctor_id (
            name,
            specialization,
            hospital
          )
        `)
        .eq('status', 'available')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date')
        .order('start_time');

      if (error) throw error;

      return data?.map(slot => ({
        ...slot,
        doctor: slot.doctors as any
      })) || [];
    } catch (error) {
      console.error('Error fetching available slots:', error);
      return [];
    }
  };

  const getPatientAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('date')
        .order('time');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      return [];
    }
  };

  return {
    bookDirectAppointment,
    bookSlotAppointment,
    getAvailableSlots,
    getPatientAppointments,
    loading
  };
};

// Add the missing useAvailableSlots hook
export const useAvailableSlots = (doctorId: string) => {
  const [slots, setSlots] = useState<DoctorSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const { data, error } = await supabase
          .from('appointment_slots')
          .select(`
            *,
            doctors:doctor_id (
              name,
              specialization,
              hospital
            )
          `)
          .eq('doctor_id', doctorId)
          .eq('status', 'available')
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date')
          .order('start_time');

        if (error) throw error;

        const mappedSlots = data?.map(slot => ({
          ...slot,
          doctor: slot.doctors as any
        })) || [];

        setSlots(mappedSlots);
      } catch (error) {
        console.error('Error fetching available slots:', error);
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    if (doctorId) {
      fetchSlots();
    }
  }, [doctorId]);

  return { slots, loading };
};
