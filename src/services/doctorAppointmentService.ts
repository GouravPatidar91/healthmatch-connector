
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export interface DoctorAppointment {
  id: string;
  patientName?: string;
  time: string;
  reason?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'confirmed';
  date: string;
  notes?: string;
}

// Custom hook for doctor appointments - updated to fetch from appointments table
export const useDoctorAppointments = () => {
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Get the doctor's information first
        const { data: doctorData, error: doctorError } = await supabase
          .from('doctors')
          .select('name')
          .eq('id', user.id)
          .single();

        if (doctorError) {
          console.error('Error fetching doctor data:', doctorError);
          return;
        }

        // Fetch appointments from the appointments table where doctor matches
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            profiles(first_name, last_name)
          `)
          .eq('doctor_name', doctorData.name)
          .order('date', { ascending: true })
          .order('time', { ascending: true });

        if (error) {
          throw error;
        }

        // Transform the data to match our interface
        const transformedAppointments: DoctorAppointment[] = (data || []).map(apt => ({
          id: apt.id,
          patientName: apt.profiles ? `${apt.profiles.first_name || ''} ${apt.profiles.last_name || ''}`.trim() || 'Patient' : 'Patient',
          time: apt.time,
          reason: apt.reason || 'General consultation',
          status: apt.status as 'pending' | 'completed' | 'cancelled' | 'confirmed',
          date: apt.date,
          notes: apt.notes || undefined
        }));
        
        setAppointments(transformedAppointments);
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
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId);

      if (error) {
        throw error;
      }

      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId ? { ...apt, status: 'completed' as const } : apt
        )
      );

      toast({
        title: "Appointment completed",
        description: "The appointment has been marked as completed.",
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to update appointment status.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) {
        throw error;
      }

      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId ? { ...apt, status: 'cancelled' as const } : apt
        )
      );

      toast({
        title: "Appointment cancelled",
        description: "The appointment has been cancelled.",
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to cancel appointment.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const confirmAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'confirmed' })
        .eq('id', appointmentId);

      if (error) {
        throw error;
      }

      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId ? { ...apt, status: 'confirmed' as const } : apt
        )
      );

      toast({
        title: "Appointment confirmed",
        description: "The appointment has been confirmed.",
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to confirm appointment.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return { 
    appointments, 
    loading, 
    error, 
    markAppointmentAsCompleted, 
    cancelAppointment,
    confirmAppointment
  };
};
