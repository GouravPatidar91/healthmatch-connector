
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

export interface AppointmentSlot {
  id: string;
  doctor_id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration: number;
  max_patients: number;
  status: 'available' | 'booked' | 'cancelled';
}

// Custom hook for doctor slots
export const useDoctorSlots = () => {
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const { data, error } = await supabase
          .from('appointment_slots')
          .select('*')
          .order('date', { ascending: true })
          .order('start_time', { ascending: true });

        if (error) {
          console.error('Error fetching slots:', error);
          setSlots([]);
        } else {
          // Map the database column names to our interface
          const mappedSlots = (data || []).map(slot => ({
            id: slot.id,
            doctor_id: slot.doctor_id,
            date: slot.date,
            start_time: slot.start_time,
            end_time: slot.end_time,
            duration: slot.duration,
            max_patients: slot.max_patients,
            status: slot.status as 'available' | 'booked' | 'cancelled'
          }));
          setSlots(mappedSlots);
        }
      } catch (err) {
        console.error('Error fetching slots:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch slots'));
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, []);

  const createSlot = async (slotData: Omit<AppointmentSlot, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('appointment_slots')
        .insert([{
          doctor_id: slotData.doctor_id,
          date: slotData.date,
          start_time: slotData.start_time,
          end_time: slotData.end_time,
          duration: slotData.duration,
          max_patients: slotData.max_patients,
          status: slotData.status,
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        const newSlot: AppointmentSlot = {
          id: data.id,
          doctor_id: data.doctor_id,
          date: data.date,
          start_time: data.start_time,
          end_time: data.end_time,
          duration: data.duration,
          max_patients: data.max_patients,
          status: data.status as 'available' | 'booked' | 'cancelled'
        };
        setSlots(prev => [...prev, newSlot]);
      }
    } catch (error) {
      console.error('Error creating slot:', error);
      throw error;
    }
  };

  const deleteSlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('appointment_slots')
        .delete()
        .eq('id', slotId);

      if (error) {
        throw error;
      }

      setSlots(prev => prev.filter(slot => slot.id !== slotId));
    } catch (error) {
      console.error('Error deleting slot:', error);
      throw error;
    }
  };

  const updateSlotStatus = async (slotId: string, status: 'available' | 'booked' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('appointment_slots')
        .update({ status })
        .eq('id', slotId);

      if (error) {
        throw error;
      }

      setSlots(prev => 
        prev.map(slot => 
          slot.id === slotId ? { ...slot, status } : slot
        )
      );
    } catch (error) {
      console.error('Error updating slot status:', error);
      throw error;
    }
  };

  return { 
    slots, 
    loading, 
    error, 
    createSlot, 
    deleteSlot, 
    updateSlotStatus 
  };
};
