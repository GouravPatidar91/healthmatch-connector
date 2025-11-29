-- Create SECURITY DEFINER function to check for pending delivery requests
CREATE OR REPLACE FUNCTION public.has_pending_delivery_request(_order_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM delivery_requests dr
    JOIN delivery_partners dp ON dp.id = dr.delivery_partner_id
    WHERE dr.order_id = _order_id
      AND dr.status = 'pending'
      AND dp.user_id = _user_id
  )
$$;

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Delivery partners can view orders with pending requests" ON medicine_orders;

-- Create new policy using SECURITY DEFINER function to break recursion
CREATE POLICY "Delivery partners can view orders with pending requests"
ON medicine_orders
FOR SELECT
USING (
  public.has_pending_delivery_request(id, auth.uid())
);