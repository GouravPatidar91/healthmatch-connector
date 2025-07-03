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

      console.log('=== FETCHING APPOINTMENTS FOR DOCTOR ===');
      console.log('Doctor user ID:', user.id);

      // Verify the user has doctor access
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('is_doctor')
        .eq('id', user.id)
        .single();

      if (profileError || !userProfile?.is_doctor) {
        console.error('User is not a doctor or profile error:', profileError);
        throw new Error('User does not have doctor access');
      }

      console.log('User confirmed as doctor');

      // Get doctor profile to ensure they're verified
      const { data: doctorProfile, error: doctorError } = await supabase
        .from('doctors')
        .select('name, verified')
        .eq('id', user.id)
        .single();

      if (doctorError || !doctorProfile) {
        console.error('Doctor profile error:', doctorError);
        throw new Error('Doctor profile not found');
      }
      
      if (!doctorProfile.verified) {
        throw new Error('Doctor profile is not verified');
      }

      console.log('Doctor profile verified:', doctorProfile.name);

      // Fetch ALL appointments for this doctor by doctor_id (this is the main fix)
      const { data: directAppointments, error: directError } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', user.id)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (directError) {
        console.error('Error fetching direct appointments:', directError);
        throw directError;
      }

      console.log('✅ Direct appointments found:', directAppointments?.length || 0);
      console.log('Direct appointments data:', directAppointments);

      // Fetch slot-based appointments
      const { data: slotAppointments, error: slotError } = await supabase
        .from('appointment_slots')
        .select('*')
        .eq('doctor_id', user.id)
        .neq('status', 'available')
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (slotError) {
        console.error('Error fetching slot appointments:', slotError);
        throw slotError;
      }

      console.log('✅ Slot appointments found:', slotAppointments?.length || 0);

      // Transform and unify the data
      const unifiedAppointments: UnifiedAppointment[] = [];

      // Process direct appointments
      if (directAppointments && directAppointments.length > 0) {
        for (const appointment of directAppointments) {
          console.log('Processing direct appointment:', appointment.id, 'for patient:', appointment.user_id);
          
          let patientName = 'Unknown Patient';
          
          if (appointment.user_id) {
            try {
              const { data: nameResult, error: nameError } = await supabase
                .rpc('get_patient_display_name', { user_uuid: appointment.user_id });
              
              if (!nameError && nameResult) {
                patientName = nameResult;
              }
            } catch (err) {
              console.error('Error getting patient name:', err);
            }
          }
          
          unifiedAppointments.push({
            id: appointment.id,
            date: appointment.date,
            time: appointment.time,
            patientName,
            reason: appointment.reason || 'General consultation',
            status: appointment.status as any,
            notes: appointment.notes,
            type: 'direct' as const,
            userId: appointment.user_id,
            doctorId: appointment.doctor_id,
            doctorName: appointment.doctor_name
          });
        }
        console.log('✅ Processed', directAppointments.length, 'direct appointments');
      }

      // Process slot-based appointments
      if (slotAppointments && slotAppointments.length > 0) {
        for (const slot of slotAppointments) {
          console.log('Processing slot appointment:', slot.id);
          
          let patientName = 'Unknown Patient';
          
          if (slot.user_id) {
            try {
              const { data: nameResult, error: nameError } = await supabase
                .rpc('get_patient_display_name', { user_uuid: slot.user_id });
              
              if (!nameError && nameResult) {
                patientName = nameResult;
              } else if (slot.patient_name) {
                patientName = slot.patient_name;
              }
            } catch (err) {
              console.error('Error getting patient name for slot:', err);
              if (slot.patient_name) {
                patientName = slot.patient_name;
              }
            }
          } else if (slot.patient_name) {
            patientName = slot.patient_name;
          }
          
          unifiedAppointments.push({
            id: slot.id,
            date: slot.date,
            time: slot.start_time,
            patientName,
            reason: slot.reason || 'General consultation',
            status: slot.status === 'booked' ? 'confirmed' : slot.status as any,
            type: 'slot' as const,
            userId: slot.user_id,
            doctorId: slot.doctor_id,
            startTime: slot.start_time,
            endTime: slot.end_time
          });
        }
        console.log('✅ Processed', slotAppointments.length, 'slot appointments');
      }

      // Sort by date and time
      unifiedAppointments.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });

      console.log('=== FINAL RESULTS ===');
      console.log('Total unified appointments for doctor:', doctorProfile.name);
      console.log('Total count:', unifiedAppointments.length);
      console.log('Appointments:', unifiedAppointments);

      setAppointments(unifiedAppointments);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching unified appointments:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch appointments'));
      setAppointments([]);
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
        const slotStatus = status === 'confirmed' ? 'booked' : status;
        const { error } = await supabase
          .from('appointment_slots')
          .update({ status: slotStatus })
          .eq('id', appointmentId);
        
        if (error) throw error;
      }

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
