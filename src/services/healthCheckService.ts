import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { HealthCheck } from "./userDataService";

export interface DoctorNotification {
  id?: string;
  doctor_id: string;
  patient_id: string;
  appointment_id: string;
  health_check_id: string;
  symptoms_data: any;
  created_at?: string;
  status?: 'sent' | 'read' | 'acknowledged';
}

// Function to send health check data to doctor
export const sendHealthCheckToDoctor = async (
  healthCheckData: HealthCheck,
  appointmentId: string,
  doctorId: string
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Prepare simplified symptom data for doctor
    const symptomsDataForDoctor = {
      symptoms: healthCheckData.symptoms,
      severity: healthCheckData.severity,
      duration: healthCheckData.duration,
      previous_conditions: healthCheckData.previous_conditions,
      medications: healthCheckData.medications,
      notes: healthCheckData.notes,
      analysis_results: healthCheckData.analysis_results,
      urgency_level: healthCheckData.urgency_level,
      overall_assessment: healthCheckData.overall_assessment,
      comprehensive_analysis: healthCheckData.comprehensive_analysis,
      check_date: healthCheckData.created_at || new Date().toISOString()
    };

    // Store notification for doctor using direct insert
    const { error } = await supabase
      .from('doctor_notifications')
      .insert([{
        doctor_id: doctorId,
        patient_id: user.id,
        appointment_id: appointmentId,
        health_check_id: healthCheckData.id || '',
        symptoms_data: symptomsDataForDoctor,
        status: 'sent'
      }]);

    if (error) {
      throw error;
    }

    console.log('Health check data sent to doctor successfully');
    return true;
  } catch (error) {
    console.error('Error sending health check to doctor:', error);
    return false;
  }
};

// Function to check for upcoming appointments after health check
export const checkUpcomingAppointments = async (): Promise<any[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get appointments in the next 7 days
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', new Date().toISOString().split('T')[0])
      .lte('date', nextWeek.toISOString().split('T')[0])
      .in('status', ['pending', 'confirmed'])
      .order('date', { ascending: true });

    if (error) {
      throw error;
    }

    return appointments || [];
  } catch (error) {
    console.error('Error checking upcoming appointments:', error);
    return [];
  }
};

// Custom hook for health check to doctor integration
export const useHealthCheckDoctorIntegration = () => {
  const { toast } = useToast();

  const sendToDoctor = async (healthCheckData: HealthCheck) => {
    try {
      // Check for upcoming appointments
      const upcomingAppointments = await checkUpcomingAppointments();
      
      if (upcomingAppointments.length === 0) {
        console.log('No upcoming appointments found');
        return false;
      }

      // Send to the nearest appointment's doctor
      const nearestAppointment = upcomingAppointments[0];
      
      // Extract doctor ID from doctor_name or use a lookup
      // For now, we'll need to get doctor info from the appointment
      const success = await sendHealthCheckToDoctor(
        healthCheckData,
        nearestAppointment.id,
        'doctor-id-placeholder' // This would need to be resolved from the appointment
      );

      if (success) {
        toast({
          title: "Health Check Shared",
          description: `Your health check has been shared with your doctor for the upcoming appointment on ${nearestAppointment.date}`,
        });
      }

      return success;
    } catch (error) {
      console.error('Error in health check doctor integration:', error);
      toast({
        title: "Error",
        description: "Failed to share health check with doctor",
        variant: "destructive"
      });
      return false;
    }
  };

  return { sendToDoctor };
};
