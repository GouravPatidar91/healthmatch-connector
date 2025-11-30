-- Add INSERT policies for medicine_order_items table

-- Allow users to insert order items for their own orders
CREATE POLICY "Users can insert their order items"
ON public.medicine_order_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM medicine_orders
    WHERE medicine_orders.id = medicine_order_items.order_id
    AND medicine_orders.user_id = auth.uid()
  )
);

-- Allow vendors to insert order items for their orders
CREATE POLICY "Vendors can insert order items"
ON public.medicine_order_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM medicine_orders mo
    JOIN medicine_vendors mv ON mv.id = mo.vendor_id
    WHERE mo.id = medicine_order_items.order_id
    AND mv.user_id = auth.uid()
  )
);

-- Allow vendors to update order items (for price adjustments)
CREATE POLICY "Vendors can update their order items"
ON public.medicine_order_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM medicine_orders mo
    JOIN medicine_vendors mv ON mv.id = mo.vendor_id
    WHERE mo.id = medicine_order_items.order_id
    AND mv.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM medicine_orders mo
    JOIN medicine_vendors mv ON mv.id = mo.vendor_id
    WHERE mo.id = medicine_order_items.order_id
    AND mv.user_id = auth.uid()
  )
);