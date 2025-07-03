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

      console.log('🔍 Starting direct appointment booking process...');
      console.log('📋 Booking details:', {
        doctorName: booking.doctorName,
        doctorId: booking.doctorId,
        date: booking.date,
        time: booking.time
      });

      let finalDoctorId = booking.doctorId;

      // If doctorId is not provided, fetch it using doctor name
      if (!finalDoctorId) {
        console.log('🔍 Doctor ID not provided, fetching from doctor name...');
        const { data: doctorData, error: doctorError } = await supabase
          .from('doctors')
          .select('id, name, verified')
          .eq('name', booking.doctorName)
          .eq('verified', true)
          .single();

        if (doctorError) {
          console.error('❌ Error finding doctor:', doctorError);
          throw new Error(`Doctor "${booking.doctorName}" not found or not verified`);
        }

        if (!doctorData) {
          throw new Error(`Doctor "${booking.doctorName}" not found in database`);
        }

        finalDoctorId = doctorData.id;
        console.log('✅ Found doctor:', {
          id: finalDoctorId,
          name: doctorData.name,
          verified: doctorData.verified
        });
      } else {
        // Verify that the provided doctorId exists and is verified
        console.log('🔍 Verifying provided doctor ID...');
        const { data: doctorData, error: doctorError } = await supabase
          .from('doctors')
          .select('id, name, verified')
          .eq('id', finalDoctorId)
          .eq('verified', true)
          .single();

        if (doctorError || !doctorData) {
          console.error('❌ Error verifying doctor:', doctorError);
          throw new Error('Doctor not found or not verified');
        }

        console.log('✅ Doctor verified:', {
          id: finalDoctorId,
          name: doctorData.name,
          verified: doctorData.verified
        });
      }

      // Prepare appointment data with explicit doctor_id
      const appointmentData = {
        user_id: user.id,
        doctor_id: finalDoctorId, // This is the key - ensure doctor_id is set
        doctor_name: booking.doctorName,
        date: booking.date,
        time: booking.time,
        reason: booking.reason || 'General consultation',
        notes: booking.notes,
        status: 'pending'
      };

      console.log('📝 Inserting appointment with data:', appointmentData);

      // Insert the appointment
      const { data: insertedAppointment, error: insertError } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select('*')
        .single();

      if (insertError) {
        console.error('❌ Error inserting appointment:', insertError);
        throw insertError;
      }

      console.log('✅ Appointment successfully created:', {
        id: insertedAppointment.id,
        doctor_id: insertedAppointment.doctor_id,
        doctor_name: insertedAppointment.doctor_name,
        patient_id: insertedAppointment.user_id,
        date: insertedAppointment.date,
        time: insertedAppointment.time,
        status: insertedAppointment.status
      });

      // Verify the appointment was created with correct doctor_id
      if (insertedAppointment.doctor_id !== finalDoctorId) {
        console.error('⚠️ Warning: Appointment doctor_id mismatch!', {
          expected: finalDoctorId,
          actual: insertedAppointment.doctor_id
        });
      }

      toast({
        title: "Appointment Booked Successfully",
        description: `Your appointment with ${booking.doctorName} has been scheduled for ${booking.date} at ${booking.time}.`,
      });

      return insertedAppointment;
    } catch (error) {
      console.error('❌ Failed to book direct appointment:', error);
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Failed to book appointment. Please try again.",
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
