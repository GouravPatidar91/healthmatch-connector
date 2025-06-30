import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export interface UnifiedAppointment {
  id: string;
  date: string;
  time: string;
  patientName: string;
  reason: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'available' | 'booked';
  notes?: string;
  type: 'direct' | 'slot';
  userId?: string;
  doctorId?: string;
  doctorName?: string;
  startTime?: string;
  endTime?: string;
}

export const useUnifiedDoctorAppointments = () => {
  const [appointments, setAppointments] = useState<UnifiedAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchUnifiedAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Fetch doctor profile to get doctor name
      const { data: doctorProfile } = await supabase
        .from('doctors')
        .select('name')
        .eq('id', user.id)
        .single();

      if (!doctorProfile) throw new Error('Doctor profile not found');

      // Fetch direct appointments with patient profile data using the correct foreign key reference
      const { data: directAppointments, error: directError } = await supabase
        .from('appointments')
        .select(`
          *,
          profiles(first_name, last_name)
        `)
        .eq('doctor_name', doctorProfile.name);

      if (directError) throw directError;

      // Fetch slot-based appointments with patient profile data
      const { data: slotAppointments, error: slotError } = await supabase
        .from('appointment_slots')
        .select(`
          *,
          profiles(first_name, last_name)
        `)
        .eq('doctor_id', user.id)
        .neq('status', 'available');

      if (slotError) throw slotError;

      // Transform and unify the data
      const unifiedAppointments: UnifiedAppointment[] = [
        // Direct appointments - use profile names when available
        ...(directAppointments || []).map(appointment => ({
          id: appointment.id,
          date: appointment.date,
          time: appointment.time,
          patientName: appointment.profiles 
            ? `${appointment.profiles.first_name || ''} ${appointment.profiles.last_name || ''}`.trim() || 'Unknown Patient'
            : 'Unknown Patient',
          reason: appointment.reason || 'General consultation',
          status: appointment.status as any,
          notes: appointment.notes,
          type: 'direct' as const,
          userId: appointment.user_id,
          doctorName: appointment.doctor_name
        })),
        // Slot-based appointments - prioritize profile names over stored patient_name
        ...(slotAppointments || []).map(slot => ({
          id: slot.id,
          date: slot.date,
          time: slot.start_time,
          patientName: slot.profiles 
            ? `${slot.profiles.first_name || ''} ${slot.profiles.last_name || ''}`.trim() || slot.patient_name || 'Unknown Patient'
            : slot.patient_name || 'Unknown Patient',
          reason: slot.reason || 'General consultation',
          status: slot.status === 'booked' ? 'confirmed' : slot.status as any,
          type: 'slot' as const,
          userId: slot.user_id,
          doctorId: slot.doctor_id,
          startTime: slot.start_time,
          endTime: slot.end_time
        }))
      ];

      // Sort by date and time
      unifiedAppointments.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });

      setAppointments(unifiedAppointments);
    } catch (err) {
      console.error('Error fetching unified appointments:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch appointments'));
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, status: string, type: 'direct' | 'slot') => {
    try {
      if (type === 'direct') {
        const { error } = await supabase
          .from('appointments')
          .update({ status })
          .eq('id', appointmentId);
        
        if (error) throw error;
      } else {
        // For slot appointments, map status appropriately
        const slotStatus = status === 'confirmed' ? 'booked' : status;
        const { error } = await supabase
          .from('appointment_slots')
          .update({ status: slotStatus })
          .eq('id', appointmentId);
        
        if (error) throw error;
      }

      // Refresh appointments
      await fetchUnifiedAppointments();
      
      toast({
        title: "Success",
        description: "Appointment status updated successfully.",
      });
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast({
        title: "Error",
        description: "Failed to update appointment status.",
        variant: "destructive",
      });
    }
  };

  const markAppointmentAsCompleted = async (appointmentId: string, type: 'direct' | 'slot') => {
    await updateAppointmentStatus(appointmentId, 'completed', type);
  };

  const cancelAppointment = async (appointmentId: string, type: 'direct' | 'slot') => {
    await updateAppointmentStatus(appointmentId, 'cancelled', type);
  };

  const confirmAppointment = async (appointmentId: string, type: 'direct' | 'slot') => {
    await updateAppointmentStatus(appointmentId, 'confirmed', type);
  };

  useEffect(() => {
    fetchUnifiedAppointments();
  }, []);

  return {
    appointments,
    loading,
    error,
    markAppointmentAsCompleted,
    cancelAppointment,
    confirmAppointment,
    refetch: fetchUnifiedAppointments
  };
};
