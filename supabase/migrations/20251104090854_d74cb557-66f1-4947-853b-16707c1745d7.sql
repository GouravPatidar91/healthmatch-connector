-- Fix function search path mutable warning
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.order_status IS DISTINCT FROM NEW.order_status THEN
    INSERT INTO public.medicine_order_status_history (
      order_id,
      status,
      notes,
      updated_by,
      updated_by_role
    ) VALUES (
      NEW.id,
      NEW.order_status,
      NEW.vendor_notes,
      auth.uid(),
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM medicine_vendors 
          WHERE id = NEW.vendor_id AND user_id = auth.uid()
        ) THEN 'vendor'
        WHEN EXISTS (
          SELECT 1 FROM delivery_partners 
          WHERE id = NEW.delivery_partner_id AND user_id = auth.uid()
        ) THEN 'delivery_partner'
        WHEN NEW.user_id = auth.uid() THEN 'patient'
        ELSE 'system'
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;