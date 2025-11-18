-- Create security definer function to check if user is vendor for an order
CREATE OR REPLACE FUNCTION public.is_vendor_for_order(_order_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM medicine_orders mo
    INNER JOIN medicine_vendors mv ON mv.id = mo.vendor_id
    WHERE mo.id = _order_id
    AND mv.user_id = _user_id
  )
$$;

-- Drop existing vendor policies that cause recursion
DROP POLICY IF EXISTS "Vendors can view their orders" ON medicine_orders;
DROP POLICY IF EXISTS "Vendors can update their orders" ON medicine_orders;

-- Recreate policies using security definer function
CREATE POLICY "Vendors can view their orders"
ON medicine_orders
FOR SELECT
USING (public.is_vendor_for_order(id, auth.uid()));

CREATE POLICY "Vendors can update their orders"
ON medicine_orders
FOR UPDATE
USING (public.is_vendor_for_order(id, auth.uid()))
WITH CHECK (public.is_vendor_for_order(id, auth.uid()));