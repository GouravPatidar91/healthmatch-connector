
-- Remove all conflicting policies on doctors table
DROP POLICY IF EXISTS "Users can view verified doctors" ON public.doctors;
DROP POLICY IF EXISTS "Authenticated users can view verified doctors with admin access" ON public.doctors;

-- Create a single, clear policy for viewing verified doctors
CREATE POLICY "All authenticated users can view verified doctors"
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
