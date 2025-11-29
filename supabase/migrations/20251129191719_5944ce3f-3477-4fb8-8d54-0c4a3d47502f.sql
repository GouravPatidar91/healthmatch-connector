-- Allow delivery partners with pending requests to view the order
CREATE POLICY "Delivery partners can view orders with pending requests"
ON medicine_orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM delivery_requests dr
    JOIN delivery_partners dp ON dp.id = dr.delivery_partner_id
    WHERE dr.order_id = medicine_orders.id
      AND dr.status = 'pending'
      AND dp.user_id = auth.uid()
  )
);

-- Clean up expired pending requests
UPDATE delivery_requests
SET 
  status = 'expired',
  responded_at = NOW(),
  rejection_reason = 'Request expired'
WHERE status = 'pending'
  AND expires_at < NOW();