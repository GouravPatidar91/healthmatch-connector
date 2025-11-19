-- Add policy for delivery partners to update assigned order status
CREATE POLICY "Delivery partners can update assigned order status"
ON medicine_orders
FOR UPDATE
USING (
  delivery_partner_id IS NOT NULL 
  AND is_delivery_partner_owner(delivery_partner_id, auth.uid())
)
WITH CHECK (
  is_delivery_partner_owner(delivery_partner_id, auth.uid())
);