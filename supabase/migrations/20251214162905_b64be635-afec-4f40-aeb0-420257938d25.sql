-- Add custom medicine name column to medicine_order_items for prescription orders
-- This allows vendors to add medicines without polluting the global catalog

ALTER TABLE public.medicine_order_items 
ADD COLUMN IF NOT EXISTS custom_medicine_name text;

-- Add a comment explaining the purpose
COMMENT ON COLUMN public.medicine_order_items.custom_medicine_name IS 'Name of medicine added by vendor for prescription orders. Used when medicine is not in global catalog.';