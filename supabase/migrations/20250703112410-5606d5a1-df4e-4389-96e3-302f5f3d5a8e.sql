
-- Remove the overly permissive policies that allow public access
DROP POLICY IF EXISTS "Allow public read access to doctors" ON public.doctors;
DROP POLICY IF EXISTS "Allow users to view all doctors" ON public.doctors;

-- Create a new policy that ensures only verified doctors with is_doctor = true are visible
CREATE POLICY "Authenticated users can view verified doctors with admin access"
ON public.doctors
FOR SELECT
TO authenticated
USING (
  verified = true 
  AND available = true 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = doctors.id 
    AND profiles.is_doctor = true
  )
);

-- Update appointment_slots policies to ensure only slots from verified doctors are visible
DROP POLICY IF EXISTS "Users can view available slots" ON public.appointment_slots;

CREATE POLICY "Users can view available slots from verified doctors"
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
