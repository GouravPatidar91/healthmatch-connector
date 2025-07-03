
-- Clean up and fix RLS policies for appointments table
-- First, drop all existing conflicting policies
DROP POLICY IF EXISTS "Users can delete their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can insert their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors can update their appointments" ON public.appointments;

-- Create clean, non-overlapping policies for appointments table
-- Patients can view their own appointments
CREATE POLICY "Patients can view their own appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Patients can create their own appointments
CREATE POLICY "Patients can create appointments"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Patients can update their own appointments
CREATE POLICY "Patients can update their own appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Patients can delete their own appointments
CREATE POLICY "Patients can delete their own appointments"
ON public.appointments
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Doctors can view appointments assigned to them by doctor_name
CREATE POLICY "Doctors can view their assigned appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  doctor_name IN (
    SELECT d.name
    FROM public.doctors d
    JOIN public.profiles p ON p.id = d.id
    WHERE d.id = auth.uid() 
    AND p.is_doctor = true
    AND d.verified = true
  )
);

-- Doctors can update appointments assigned to them
CREATE POLICY "Doctors can update their assigned appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
  doctor_name IN (
    SELECT d.name
    FROM public.doctors d
    JOIN public.profiles p ON p.id = d.id
    WHERE d.id = auth.uid() 
    AND p.is_doctor = true
    AND d.verified = true
  )
);

-- Clean up and fix RLS policies for appointment_slots table
-- Drop all existing conflicting policies
DROP POLICY IF EXISTS "appointment_slots_delete_policy" ON public.appointment_slots;
DROP POLICY IF EXISTS "appointment_slots_insert_policy" ON public.appointment_slots;
DROP POLICY IF EXISTS "appointment_slots_select_policy" ON public.appointment_slots;
DROP POLICY IF EXISTS "appointment_slots_update_policy" ON public.appointment_slots;
DROP POLICY IF EXISTS "Doctors can manage their own slots" ON public.appointment_slots;
DROP POLICY IF EXISTS "Doctors can view their own appointment slots" ON public.appointment_slots;
DROP POLICY IF EXISTS "Patients can view their booked slots" ON public.appointment_slots;
DROP POLICY IF EXISTS "Doctors can update their own appointment slots" ON public.appointment_slots;
DROP POLICY IF EXISTS "Patients can book available appointment slots" ON public.appointment_slots;
DROP POLICY IF EXISTS "Users can view available slots from verified doctors" ON public.appointment_slots;

-- Create clean policies for appointment_slots table
-- Doctors can manage (CRUD) their own slots
CREATE POLICY "Doctors can manage their own appointment slots"
ON public.appointment_slots
FOR ALL
TO authenticated
USING (
  doctor_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_doctor = true
  )
)
WITH CHECK (
  doctor_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_doctor = true
  )
);

-- Patients can view their own booked slots
CREATE POLICY "Patients can view their booked slots"
ON public.appointment_slots
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Public can view available slots from verified doctors
CREATE POLICY "Public can view available appointment slots"
ON public.appointment_slots
FOR SELECT
TO authenticated
USING (
  status = 'available'
  AND EXISTS (
    SELECT 1 FROM public.doctors d
    JOIN public.profiles p ON p.id = d.id
    WHERE d.id = appointment_slots.doctor_id
    AND d.verified = true
    AND d.available = true
    AND p.is_doctor = true
  )
);

-- Patients can book available slots (update status to booked)
CREATE POLICY "Patients can book available slots"
ON public.appointment_slots
FOR UPDATE
TO authenticated
USING (
  status = 'available'
  AND user_id IS NULL
)
WITH CHECK (
  status = 'booked'
  AND user_id = auth.uid()
);
