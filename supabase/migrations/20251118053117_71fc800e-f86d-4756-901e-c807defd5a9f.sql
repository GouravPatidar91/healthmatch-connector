-- Drop the problematic policy
DROP POLICY IF EXISTS "Delivery partners can assign themselves to orders" ON medicine_orders;

-- Create security definer function to check if delivery partner can accept order
CREATE OR REPLACE FUNCTION public.can_delivery_partner_accept_order(
  _order_id uuid,
  _user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM delivery_requests dr
    INNER JOIN delivery_partners dp ON dp.id = dr.delivery_partner_id
    WHERE dr.order_id = _order_id
    AND dr.status = 'accepted'
    AND dp.user_id = _user_id
    AND dr.responded_at > NOW() - INTERVAL '5 minutes'
  )
$$;

-- Create security definer function to check if user owns delivery partner
CREATE OR REPLACE FUNCTION public.is_delivery_partner_owner(
  _partner_id uuid,
  _user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM delivery_partners
    WHERE id = _partner_id
    AND user_id = _user_id
  )
$$;

-- Recreate policy using security definer functions
CREATE POLICY "Delivery partners can assign themselves to orders"
ON medicine_orders
FOR UPDATE
USING (
  delivery_partner_id IS NULL
  AND public.can_delivery_partner_accept_order(id, auth.uid())
)
WITH CHECK (
  public.is_delivery_partner_owner(delivery_partner_id, auth.uid())
);