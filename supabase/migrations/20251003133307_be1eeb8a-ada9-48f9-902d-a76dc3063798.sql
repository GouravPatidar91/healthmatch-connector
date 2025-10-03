-- Fix RLS policy for prescription_uploads to allow INSERT operations
DROP POLICY IF EXISTS "Users can manage their prescriptions" ON public.prescription_uploads;
DROP POLICY IF EXISTS "Vendors can view order prescriptions" ON public.prescription_uploads;

-- Create separate policies for better control
CREATE POLICY "Users can insert their own prescriptions"
ON public.prescription_uploads
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own prescriptions"
ON public.prescription_uploads
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own prescriptions"
ON public.prescription_uploads
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own prescriptions"
ON public.prescription_uploads
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Ensure vendors can view prescriptions for their orders
CREATE POLICY "Vendors can view order prescriptions"
ON public.prescription_uploads
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM medicine_orders mo
    JOIN medicine_vendors mv ON mv.id = mo.vendor_id
    WHERE mo.id = prescription_uploads.order_id
    AND mv.user_id = auth.uid()
  )
);