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

      // CRITICAL: Ensure we always have a valid doctor_id
      if (!finalDoctorId) {
        console.log('⚠️ Doctor ID not provided, fetching from doctor name...');
        const { data: doctorData, error: doctorError } = await supabase
          .from('doctors')
          .select('id, name, verified')
          .eq('name', booking.doctorName)
          .eq('verified', true)
          .maybeSingle();

        if (doctorError) {
          console.error('❌ Error finding doctor:', doctorError);
          throw new Error('Database error while searching for doctor');
        }

        if (!doctorData) {
          console.log('⚠️ No verified doctor found, creating placeholder...');
          
          // Create a placeholder doctor entry
          const { data: newDoctor, error: createError } = await supabase
            .from('doctors')
            .insert([{
              name: booking.doctorName,
              specialization: 'General Medicine',
              hospital: 'To be verified',
              address: 'To be verified',
              region: 'To be verified',
              degrees: 'To be verified',
              experience: 0,
              registration_number: 'PENDING_VERIFICATION',
              verified: false,
              available: false
            }])
            .select('id')
            .single();

          if (createError) {
            console.error('❌ Error creating doctor placeholder:', createError);
            throw new Error('Failed to create doctor record');
          }

          finalDoctorId = newDoctor.id;
          console.log('✅ Created placeholder doctor with ID:', finalDoctorId);
        } else {
          finalDoctorId = doctorData.id;
          console.log('✅ Found doctor by name:', {
            id: finalDoctorId,
            name: doctorData.name,
            verified: doctorData.verified
          });
        }
      } else {
        // Verify that the provided doctorId exists
        console.log('🔍 Verifying provided doctor ID:', finalDoctorId);
        const { data: doctorData, error: doctorError } = await supabase
          .from('doctors')
          .select('id, name, verified')
          .eq('id', finalDoctorId)
          .single();

        if (doctorError || !doctorData) {
          console.error('❌ Error verifying doctor:', doctorError);
          throw new Error('Doctor not found');
        }

        console.log('✅ Doctor verified:', {
          id: finalDoctorId,
          name: doctorData.name,
          verified: doctorData.verified
        });
      }

      // CRITICAL: Final validation that finalDoctorId is not null
      if (!finalDoctorId) {
        throw new Error('CRITICAL ERROR: Failed to determine doctor ID for appointment');
      }

      // Prepare appointment data with GUARANTEED doctor_id
      const appointmentData = {
        user_id: user.id,
        doctor_id: finalDoctorId, // CRITICAL: This must never be null
        doctor_name: booking.doctorName,
        date: booking.date,
        time: booking.time,
        reason: booking.reason || 'General consultation',
        notes: booking.notes || null,
        status: 'pending'
      };

      console.log('📝 Inserting appointment with GUARANTEED doctor_id:', appointmentData);

      // Validate the appointment data before inserting
      if (!appointmentData.doctor_id) {
        throw new Error('CRITICAL ERROR: doctor_id is still null before insertion');
      }

      // Insert the appointment with explicit doctor_id
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

      // Final verification that doctor_id was properly set
      if (!insertedAppointment.doctor_id) {
        console.error('🚨 CRITICAL: Appointment was created but doctor_id is null!');
        throw new Error('Appointment created but doctor assignment failed');
      }

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
      console.log('🔍 getPatientAppointments: Starting authentication check...');
      
      // Enhanced authentication validation
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ getPatientAppointments: Authentication error:', authError);
        throw new Error('Authentication failed: ' + authError.message);
      }

      if (!user) {
        console.error('❌ getPatientAppointments: No authenticated user found');
        throw new Error('User not authenticated');
      }

      if (!user.id) {
        console.error('❌ getPatientAppointments: User ID is missing from user object:', user);
        throw new Error('User ID is missing');
      }

      console.log('✅ getPatientAppointments: User authenticated successfully:', {
        userId: user.id,
        userEmail: user.email,
        userRole: user.role
      });

      // Get current session to verify it's still valid
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ getPatientAppointments: Session error:', sessionError);
        throw new Error('Session validation failed: ' + sessionError.message);
      }

      if (!session) {
        console.error('❌ getPatientAppointments: No valid session found');
        throw new Error('No valid session found');
      }

      console.log('✅ getPatientAppointments: Session validated successfully:', {
        sessionId: session.access_token.substring(0, 20) + '...',
        expiresAt: session.expires_at
      });

      // Query appointments with explicit user_id filtering
      console.log('🔍 getPatientAppointments: Querying appointments for user_id:', user.id);
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          doctors:doctor_id (
            clinic_latitude,
            clinic_longitude,
            clinic_address,
            hospital
          )
        `)
        .eq('user_id', user.id)
        .order('date')
        .order('time');

      if (error) {
        console.error('❌ getPatientAppointments: Database query error:', error);
        throw error;
      }

      console.log('📊 getPatientAppointments: Raw query results:', {
        queryUserId: user.id,
        totalResults: data?.length || 0,
        results: data?.map(apt => ({
          id: apt.id,
          user_id: apt.user_id,
          doctor_name: apt.doctor_name,
          date: apt.date,
          time: apt.time,
          status: apt.status,
          matchesCurrentUser: apt.user_id === user.id
        })) || []
      });

      // Validate that all returned appointments belong to the current user
      const invalidAppointments = data?.filter(apt => apt.user_id !== user.id) || [];
      
      if (invalidAppointments.length > 0) {
        console.error('🚨 CRITICAL SECURITY ISSUE: Found appointments not belonging to current user:', {
          currentUserId: user.id,
          invalidAppointments: invalidAppointments.map(apt => ({
            id: apt.id,
            user_id: apt.user_id,
            doctor_name: apt.doctor_name
          }))
        });
        
        // Filter out invalid appointments as a security measure
        const validAppointments = data?.filter(apt => apt.user_id === user.id) || [];
        
        console.log('✅ getPatientAppointments: Filtered to valid appointments only:', {
          originalCount: data?.length || 0,
          validCount: validAppointments.length
        });
        
        return validAppointments;
      }

      console.log('✅ getPatientAppointments: All appointments validated successfully for user:', user.id);
      
      return data || [];
    } catch (error) {
      console.error('❌ getPatientAppointments: Function failed with error:', error);
      throw error;
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
