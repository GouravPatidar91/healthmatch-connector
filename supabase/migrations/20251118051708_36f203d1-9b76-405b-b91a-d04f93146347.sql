-- Add RLS policy for delivery partners to assign themselves to orders
CREATE POLICY "Delivery partners can assign themselves to orders"
ON medicine_orders
FOR UPDATE
USING (
  delivery_partner_id IS NULL
  AND EXISTS (
    SELECT 1 FROM delivery_requests dr
    INNER JOIN delivery_partners dp ON dp.id = dr.delivery_partner_id
    WHERE dr.order_id = medicine_orders.id
    AND dr.status = 'accepted'
    AND dp.user_id = auth.uid()
    AND dr.responded_at > NOW() - INTERVAL '5 minutes'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM delivery_partners dp
    WHERE dp.id = medicine_orders.delivery_partner_id
    AND dp.user_id = auth.uid()
  )
);