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

      console.log('Current user ID:', user.id);

      // Enhanced check to ensure user has proper doctor access
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('is_doctor')
        .eq('id', user.id)
        .single();

      if (!userProfile?.is_doctor) {
        throw new Error('User does not have doctor access');
      }

      // Fetch doctor profile to get doctor name and verify status
      const { data: doctorProfile } = await supabase
        .from('doctors')
        .select('name, verified')
        .eq('id', user.id)
        .single();

      if (!doctorProfile) throw new Error('Doctor profile not found');
      
      // Additional check to ensure doctor is verified
      if (!doctorProfile.verified) {
        throw new Error('Doctor profile is not verified');
      }

      console.log('Doctor profile:', doctorProfile);

      // Fetch direct appointments - now using doctor_id for precise matching
      const { data: directAppointments, error: directError } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', user.id);

      if (directError) {
        console.error('Direct appointments error:', directError);
        throw directError;
      }

      console.log('Direct appointments fetched:', directAppointments?.length || 0);
      console.log('Direct appointments data:', directAppointments);

      // Fetch slot-based appointments - only slots created by this doctor
      const { data: slotAppointments, error: slotError } = await supabase
        .from('appointment_slots')
        .select('*')
        .eq('doctor_id', user.id)
        .neq('status', 'available');

      if (slotError) {
        console.error('Slot appointments error:', slotError);
        throw slotError;
      }

      console.log('Slot appointments fetched:', slotAppointments?.length || 0);
      console.log('Slot appointments data:', slotAppointments);

      // Transform and unify the data
      const unifiedAppointments: UnifiedAppointment[] = [];

      // Process direct appointments - now filtered by doctor_id at database level
      if (directAppointments) {
        for (const appointment of directAppointments) {
          console.log('Processing direct appointment:', appointment);
          
          let patientName = 'Unknown Patient';
          
          // Get patient name using the database function if user_id exists
          if (appointment.user_id) {
            try {
              const { data: nameResult, error: nameError } = await supabase
                .rpc('get_patient_display_name', { user_uuid: appointment.user_id });
              
              if (!nameError && nameResult) {
                patientName = nameResult;
              }
              console.log('Patient name from function:', patientName);
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
      }

      // Process slot-based appointments - these should already be filtered by RLS
      if (slotAppointments) {
        for (const slot of slotAppointments) {
          console.log('Processing slot appointment:', slot);
          
          let patientName = 'Unknown Patient';
          
          // Get patient name using the database function if user_id exists
          if (slot.user_id) {
            try {
              const { data: nameResult, error: nameError } = await supabase
                .rpc('get_patient_display_name', { user_uuid: slot.user_id });
              
              if (!nameError && nameResult) {
                patientName = nameResult;
              } else if (slot.patient_name) {
                // Fallback to stored patient_name if function fails
                patientName = slot.patient_name;
              }
              console.log('Patient name from function for slot:', patientName);
            } catch (err) {
              console.error('Error getting patient name for slot:', err);
              // Fallback to stored patient_name
              if (slot.patient_name) {
                patientName = slot.patient_name;
              }
            }
          } else if (slot.patient_name) {
            // Use stored patient_name if no user_id
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
      }

      // Sort by date and time
      unifiedAppointments.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });

      console.log('Final unified appointments for doctor:', doctorProfile.name, unifiedAppointments);
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
