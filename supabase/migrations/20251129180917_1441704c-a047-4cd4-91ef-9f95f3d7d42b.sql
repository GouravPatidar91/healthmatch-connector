-- Fix RLS on medicine_orders so vendor and delivery partner policies are permissive (OR-ed)

-- 1) Drop existing restrictive policies on medicine_orders
DROP POLICY IF EXISTS "Delivery partners can assign themselves to orders" ON public.medicine_orders;
DROP POLICY IF EXISTS "Delivery partners can update assigned order status" ON public.medicine_orders;
DROP POLICY IF EXISTS "Delivery partners can view assigned orders" ON public.medicine_orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.medicine_orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.medicine_orders;
DROP POLICY IF EXISTS "Vendors can update their orders" ON public.medicine_orders;
DROP POLICY IF EXISTS "Vendors can view their orders" ON public.medicine_orders;

-- 2) Recreate them as PERMISSIVE (default) with the same logic

CREATE POLICY "Delivery partners can assign themselves to orders"
ON public.medicine_orders
FOR UPDATE
USING (
  delivery_partner_id IS NULL
  AND can_delivery_partner_accept_order(id, auth.uid())
)
WITH CHECK (
  is_delivery_partner_owner(delivery_partner_id, auth.uid())
);

CREATE POLICY "Delivery partners can update assigned order status"
ON public.medicine_orders
FOR UPDATE
USING (
  delivery_partner_id IS NOT NULL
  AND is_delivery_partner_owner(delivery_partner_id, auth.uid())
)
WITH CHECK (
  is_delivery_partner_owner(delivery_partner_id, auth.uid())
);

CREATE POLICY "Delivery partners can view assigned orders"
ON public.medicine_orders
FOR SELECT
USING (
  delivery_partner_id = (
    SELECT delivery_partners.id
    FROM delivery_partners
    WHERE delivery_partners.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own orders"
ON public.medicine_orders
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY "Users can view their own orders"
ON public.medicine_orders
FOR SELECT
USING (
  user_id = auth.uid()
);

CREATE POLICY "Vendors can update their orders"
ON public.medicine_orders
FOR UPDATE
USING (
  is_vendor_owner(vendor_id, auth.uid())
)
WITH CHECK (
  is_vendor_owner(vendor_id, auth.uid())
);

CREATE POLICY "Vendors can view their orders"
ON public.medicine_orders
FOR SELECT
USING (
  is_vendor_owner(vendor_id, auth.uid())
);
