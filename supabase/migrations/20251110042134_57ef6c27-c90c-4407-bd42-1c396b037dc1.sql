-- Drop and recreate the vendor policy with explicit WITH CHECK
DROP POLICY IF EXISTS "Vendors can view and update their orders" ON public.medicine_orders;

-- Create separate policies for better clarity and debugging
CREATE POLICY "Vendors can view their orders"
ON public.medicine_orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.medicine_vendors
    WHERE medicine_vendors.id = medicine_orders.vendor_id
      AND medicine_vendors.user_id = auth.uid()
  )
);

CREATE POLICY "Vendors can update their orders"
ON public.medicine_orders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.medicine_vendors
    WHERE medicine_vendors.id = medicine_orders.vendor_id
      AND medicine_vendors.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.medicine_vendors
    WHERE medicine_vendors.id = medicine_orders.vendor_id
      AND medicine_vendors.user_id = auth.uid()
  )
);