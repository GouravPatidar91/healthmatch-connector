
-- First, let's update any existing appointments that have null doctor_id but have a doctor_name
-- This will try to match them with the correct doctor based on the doctor_name
UPDATE public.appointments 
SET doctor_id = (
  SELECT d.id 
  FROM public.doctors d 
  WHERE d.name = appointments.doctor_name 
  AND d.verified = true
  LIMIT 1
)
WHERE doctor_id IS NULL 
AND doctor_name IS NOT NULL;

-- Add a NOT NULL constraint to doctor_id column to prevent future null values
-- But first, let's make sure we don't have any remaining null values that couldn't be matched
DELETE FROM public.appointments 
WHERE doctor_id IS NULL;

-- Now add the NOT NULL constraint
ALTER TABLE public.appointments 
ALTER COLUMN doctor_id SET NOT NULL;

-- Update the foreign key constraint to ensure referential integrity
ALTER TABLE public.appointments 
DROP CONSTRAINT IF EXISTS appointments_doctor_id_fkey;

ALTER TABLE public.appointments 
ADD CONSTRAINT appointments_doctor_id_fkey 
FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE CASCADE;

-- Create an index on doctor_id for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
