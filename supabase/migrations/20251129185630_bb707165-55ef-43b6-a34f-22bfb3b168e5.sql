-- Update the RLS function to allow a 30-second grace period for accepting delivery requests
-- This prevents race conditions where requests expire on the server but appear pending on client
CREATE OR REPLACE FUNCTION public.can_delivery_partner_accept_order(_order_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.delivery_requests dr
    JOIN public.delivery_partners dp ON dp.id = dr.delivery_partner_id
    WHERE dr.order_id = _order_id
      AND dr.status = 'pending'
      AND dr.expires_at > (NOW() - INTERVAL '30 seconds')  -- Allow 30 second grace period after expiry
      AND dp.user_id = _user_id
  );
$$;