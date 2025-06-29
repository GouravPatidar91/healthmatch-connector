
-- Add patient information fields to appointment_slots table if they don't exist
-- and ensure we have proper foreign key relationships

-- First, let's add the patient_name and reason fields to appointment_slots if they don't exist
ALTER TABLE public.appointment_slots 
ADD COLUMN IF NOT EXISTS patient_name text,
ADD COLUMN IF NOT EXISTS reason text;

-- Add user_id to appointment_slots to link to the patient who booked the slot
ALTER TABLE public.appointment_slots 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id);

-- Create an index for better performance when querying appointments by doctor
CREATE INDEX IF NOT EXISTS idx_appointment_slots_doctor_date 
ON public.appointment_slots(doctor_id, date);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date 
ON public.appointments(doctor_name, date);

-- Add RLS policies for appointment_slots to ensure proper data access
ALTER TABLE public.appointment_slots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Doctors can view their own appointment slots" ON public.appointment_slots;
DROP POLICY IF EXISTS "Patients can view their booked slots" ON public.appointment_slots;
DROP POLICY IF EXISTS "Doctors can update their own appointment slots" ON public.appointment_slots;
DROP POLICY IF EXISTS "Patients can book available appointment slots" ON public.appointment_slots;

-- Policy for doctors to view their own appointment slots
CREATE POLICY "Doctors can view their own appointment slots" 
ON public.appointment_slots 
FOR SELECT 
USING (
  doctor_id IN (
    SELECT id FROM public.profiles WHERE id = auth.uid() AND is_doctor = true
  )
);

-- Policy for patients to view slots they've booked
CREATE POLICY "Patients can view their booked slots" 
ON public.appointment_slots 
FOR SELECT 
USING (user_id = auth.uid());

-- Policy for doctors to update their own appointment slots
CREATE POLICY "Doctors can update their own appointment slots" 
ON public.appointment_slots 
FOR UPDATE 
USING (
  doctor_id IN (
    SELECT id FROM public.profiles WHERE id = auth.uid() AND is_doctor = true
  )
);

-- Policy for patients to book available slots
CREATE POLICY "Patients can book available appointment slots" 
ON public.appointment_slots 
FOR UPDATE 
USING (status = 'available' AND user_id IS NULL)
WITH CHECK (status = 'booked' AND user_id = auth.uid());

-- Add RLS policies for appointments table
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Doctors can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors can update their appointments" ON public.appointments;

-- Policy for doctors to view appointments where they are the doctor
CREATE POLICY "Doctors can view their own appointments" 
ON public.appointments 
FOR SELECT 
USING (
  doctor_name IN (
    SELECT name FROM public.doctors WHERE id = auth.uid()
  )
);

-- Policy for patients to view their own appointments
CREATE POLICY "Patients can view their own appointments" 
ON public.appointments 
FOR SELECT 
USING (user_id = auth.uid());

-- Policy for patients to create appointments
CREATE POLICY "Patients can create appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Policy for doctors to update appointments
CREATE POLICY "Doctors can update their appointments" 
ON public.appointments 
FOR UPDATE 
USING (
  doctor_name IN (
    SELECT name FROM public.doctors WHERE id = auth.uid()
  )
);
