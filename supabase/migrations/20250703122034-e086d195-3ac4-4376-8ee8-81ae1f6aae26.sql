
-- Add doctor_id column to appointments table for proper doctor identification
ALTER TABLE public.appointments 
ADD COLUMN doctor_id uuid REFERENCES public.doctors(id);

-- Update the RLS policy for doctors to use doctor_id instead of doctor_name
DROP POLICY IF EXISTS "Doctors can view their assigned appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors can update their assigned appointments" ON public.appointments;

-- Create new policies using doctor_id for precise matching
CREATE POLICY "Doctors can view their assigned appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  doctor_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_doctor = true
  )
);

CREATE POLICY "Doctors can update their assigned appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
  doctor_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_doctor = true
  )
);

-- Optionally, if you want to populate existing appointments with doctor_id based on doctor_name
-- This will help migrate existing data (run this only if you have existing appointments)
UPDATE public.appointments 
SET doctor_id = (
  SELECT d.id 
  FROM public.doctors d 
  WHERE d.name = appointments.doctor_name 
  LIMIT 1
)
WHERE doctor_id IS NULL AND doctor_name IS NOT NULL;
