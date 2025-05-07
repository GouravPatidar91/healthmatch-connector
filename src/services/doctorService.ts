
import { supabase } from "@/integrations/supabase/client";

// Check if a user has doctor access
export const checkDoctorAccess = async (userId: string) => {
  try {
    // Get the doctor status from the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('is_doctor')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error("Error checking doctor access:", error);
      return false;
    }
    
    return !!data?.is_doctor;
  } catch (error) {
    console.error("Error checking doctor access:", error);
    return false;
  }
};

// Grant doctor access to a user
export const grantDoctorAccess = async (userId: string) => {
  try {
    // Update the profile to grant doctor access
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ is_doctor: true })
      .eq('id', userId);
    
    if (profileUpdateError) {
      console.error("Error granting doctor access (profile):", profileUpdateError);
      throw new Error("Failed to grant doctor access");
    }
    
    // Also update the doctor record if it exists
    const { data: doctorData, error: doctorCheckError } = await supabase
      .from('doctors')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
      
    if (!doctorCheckError && doctorData) {
      // Doctor record exists, update it
      const { error: doctorUpdateError } = await supabase
        .from('doctors')
        .update({ verified: true })
        .eq('id', userId);
      
      if (doctorUpdateError) {
        console.error("Error updating doctor verification:", doctorUpdateError);
        // We don't throw here since the profile update succeeded
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error granting doctor access:", error);
    throw error;
  }
};

// Revoke doctor access from a user
export const revokeDoctorAccess = async (userId: string) => {
  try {
    // Update the profile to revoke doctor access
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ is_doctor: false })
      .eq('id', userId);
    
    if (profileUpdateError) {
      console.error("Error revoking doctor access (profile):", profileUpdateError);
      throw new Error("Failed to revoke doctor access");
    }
    
    // Also update the doctor record if it exists
    const { data: doctorData, error: doctorCheckError } = await supabase
      .from('doctors')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
      
    if (!doctorCheckError && doctorData) {
      // Doctor record exists, update it
      const { error: doctorUpdateError } = await supabase
        .from('doctors')
        .update({ verified: false })
        .eq('id', userId);
      
      if (doctorUpdateError) {
        console.error("Error updating doctor verification:", doctorUpdateError);
        // We don't throw here since the profile update succeeded
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error revoking doctor access:", error);
    throw error;
  }
};

// Get all available, verified doctors for appointments
export const getAvailableDoctors = async () => {
  try {
    // Get profiles where is_doctor is true
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_doctor', true);
    
    if (profilesError) {
      console.error("Error fetching doctor profiles:", profilesError);
      return [];
    }
    
    if (!profilesData || profilesData.length === 0) {
      return [];
    }
    
    // Get doctor details for these profiles
    const doctorIds = profilesData.map(profile => profile.id);
    const { data: doctorsData, error: doctorsError } = await supabase
      .from('doctors')
      .select('*')
      .in('id', doctorIds)
      .eq('available', true)
      .eq('verified', true);
    
    if (doctorsError) {
      console.error("Error fetching doctors:", doctorsError);
      return [];
    }
    
    return doctorsData || [];
  } catch (error) {
    console.error("Error fetching available doctors:", error);
    return [];
  }
};

// Create or update appointment slots for a doctor
export const createAppointmentSlots = async (
  doctorId: string, 
  date: string, 
  startTime: string, 
  endTime: string, 
  duration: number, 
  maxPatients: number = 1
) => {
  try {
    // Check if the slot already exists
    const { data: existingSlot, error: checkError } = await supabase
      .from('appointment_slots')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('date', date)
      .eq('start_time', startTime)
      .eq('end_time', endTime)
      .maybeSingle();
    
    if (checkError) {
      console.error("Error checking existing slot:", checkError);
      throw new Error("Failed to create appointment slot");
    }
    
    if (existingSlot) {
      // Update the existing slot
      const { error: updateError } = await supabase
        .from('appointment_slots')
        .update({
          duration,
          max_patients: maxPatients,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSlot.id);
      
      if (updateError) {
        console.error("Error updating slot:", updateError);
        throw new Error("Failed to update appointment slot");
      }
      
      return existingSlot.id;
    } else {
      // Create a new slot
      const { data: newSlot, error: insertError } = await supabase
        .from('appointment_slots')
        .insert({
          doctor_id: doctorId,
          date,
          start_time: startTime,
          end_time: endTime,
          duration,
          max_patients: maxPatients,
          status: 'available'
        })
        .select()
        .single();
      
      if (insertError) {
        console.error("Error creating slot:", insertError);
        throw new Error("Failed to create appointment slot");
      }
      
      return newSlot.id;
    }
  } catch (error) {
    console.error("Error creating/updating appointment slot:", error);
    throw error;
  }
};

// Get appointment slots for a doctor
export const getDoctorAppointmentSlots = async (doctorId: string) => {
  try {
    const { data, error } = await supabase
      .from('appointment_slots')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });
    
    if (error) {
      console.error("Error fetching appointment slots:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching doctor appointment slots:", error);
    return [];
  }
};

// Delete an appointment slot
export const deleteAppointmentSlot = async (slotId: string) => {
  try {
    const { error } = await supabase
      .from('appointment_slots')
      .delete()
      .eq('id', slotId);
    
    if (error) {
      console.error("Error deleting appointment slot:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting appointment slot:", error);
    return false;
  }
};

export const getDoctorDetails = async (doctorId: string) => {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('id', doctorId)
      .single();
    
    if (error) {
      console.error("Error fetching doctor details:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching doctor details:", error);
    return null;
  }
};
