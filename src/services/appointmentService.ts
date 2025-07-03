
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export const useAppointmentBooking = () => {
  const { toast } = useToast();

  const bookAppointment = async (appointmentData: {
    doctorName: string;
    doctorSpecialty?: string;
    date: string;
    time: string;
    reason?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          doctor_name: appointmentData.doctorName,
          doctor_specialty: appointmentData.doctorSpecialty,
          date: appointmentData.date,
          time: appointmentData.time,
          reason: appointmentData.reason,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Appointment booked successfully!",
      });

      return data;
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: "Error",
        description: "Failed to book appointment. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const bookDirectAppointment = async (appointmentData: {
    doctor_id: string;
    doctor_name: string;
    doctor_specialty?: string;
    date: string;
    preferred_time: string;
    reason?: string;
    notes?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          doctor_name: appointmentData.doctor_name,
          doctor_specialty: appointmentData.doctor_specialty,
          date: appointmentData.date,
          time: appointmentData.preferred_time,
          reason: appointmentData.reason,
          notes: appointmentData.notes,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Appointment request sent successfully!",
      });

      return data;
    } catch (error) {
      console.error('Error booking direct appointment:', error);
      toast({
        title: "Error",
        description: "Failed to book appointment. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const bookSlotAppointment = async (slotId: string, patientName: string, reason: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get user profile to use their name automatically
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      const fullName = profile 
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || patientName
        : patientName;

      const { data, error } = await supabase
        .from('appointment_slots')
        .update({
          status: 'booked',
          user_id: user.id,
          patient_name: fullName,
          reason: reason
        })
        .eq('id', slotId)
        .eq('status', 'available')
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Appointment slot booked successfully!",
      });

      return data;
    } catch (error) {
      console.error('Error booking slot:', error);
      toast({
        title: "Error",
        description: "Failed to book appointment slot. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getPatientAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Fetch direct appointments
      const { data: directAppointments, error: directError } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (directError) throw directError;

      // Fetch slot-based appointments
      const { data: slotAppointments, error: slotError } = await supabase
        .from('appointment_slots')
        .select(`
          *,
          doctors!appointment_slots_doctor_id_fkey(name, specialization)
        `)
        .eq('user_id', user.id)
        .neq('status', 'available')
        .order('date', { ascending: true });

      if (slotError) throw slotError;

      // Combine and normalize the appointments
      const allAppointments = [
        // Direct appointments - already have the right structure
        ...(directAppointments || []).map(apt => ({
          ...apt,
          type: 'direct' as const
        })),
        // Slot appointments - need to transform to match PatientAppointment interface
        ...(slotAppointments || []).map(slot => ({
          id: slot.id,
          user_id: slot.user_id,
          doctor_name: slot.doctors?.name || 'Unknown Doctor',
          doctor_specialty: slot.doctors?.specialization,
          date: slot.date,
          time: slot.start_time,
          reason: slot.reason,
          status: slot.status === 'booked' ? 'confirmed' : slot.status,
          notes: null,
          created_at: slot.created_at,
          updated_at: slot.updated_at || slot.created_at,
          type: 'slot' as const
        }))
      ];

      return allAppointments;
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      throw error;
    }
  };

  return {
    bookAppointment,
    bookDirectAppointment,
    bookSlotAppointment,
    getPatientAppointments
  };
};

export const useAvailableSlots = (doctorId: string) => {
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const { data, error } = await supabase
          .from('appointment_slots')
          .select('*')
          .eq('doctor_id', doctorId)
          .eq('status', 'available')
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true })
          .order('start_time', { ascending: true });

        if (error) throw error;
        setSlots(data || []);
      } catch (error) {
        console.error('Error fetching slots:', error);
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
