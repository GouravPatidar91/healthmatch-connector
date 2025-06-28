
-- Add patient_name and reason columns to appointment_slots table
ALTER TABLE public.appointment_slots 
ADD COLUMN patient_name TEXT,
ADD COLUMN reason TEXT;

-- Update existing booked slots to have default values
UPDATE public.appointment_slots 
SET patient_name = 'Booked Patient',
    reason = 'General consultation'
WHERE status = 'booked' AND patient_name IS NULL;
