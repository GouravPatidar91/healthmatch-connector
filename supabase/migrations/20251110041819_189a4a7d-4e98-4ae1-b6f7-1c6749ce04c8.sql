-- Add foreign key constraint between medicine_orders and delivery_partners
ALTER TABLE public.medicine_orders
ADD CONSTRAINT medicine_orders_delivery_partner_id_fkey
FOREIGN KEY (delivery_partner_id)
REFERENCES public.delivery_partners(id)
ON DELETE SET NULL;