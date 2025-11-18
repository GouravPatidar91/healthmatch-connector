-- Drop the problematic function and policies
DROP POLICY IF EXISTS "Vendors can view their orders" ON medicine_orders;
DROP POLICY IF EXISTS "Vendors can update their orders" ON medicine_orders;
DROP FUNCTION IF EXISTS public.is_vendor_for_order(uuid, uuid);

-- Create simpler security definer function that only checks medicine_vendors table
CREATE OR REPLACE FUNCTION public.is_vendor_owner(_vendor_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM medicine_vendors
    WHERE id = _vendor_id
    AND user_id = _user_id
  )
$$;

-- Recreate policies using the simpler function with vendor_id from the row
CREATE POLICY "Vendors can view their orders"
ON medicine_orders
FOR SELECT
USING (public.is_vendor_owner(vendor_id, auth.uid()));

CREATE POLICY "Vendors can update their orders"
ON medicine_orders
FOR UPDATE
USING (public.is_vendor_owner(vendor_id, auth.uid()))
WITH CHECK (public.is_vendor_owner(vendor_id, auth.uid()));