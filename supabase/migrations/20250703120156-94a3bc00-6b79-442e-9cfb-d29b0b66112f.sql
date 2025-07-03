
-- Remove the overly restrictive policy
DROP POLICY IF EXISTS "All authenticated users can view verified doctors" ON public.doctors;

-- Create a new policy that allows all authenticated users to view verified doctors
CREATE POLICY "Authenticated users can view all verified doctors"
ON public.doctors
FOR SELECT
TO authenticated
USING (
  verified = true 
  AND available = true
);
