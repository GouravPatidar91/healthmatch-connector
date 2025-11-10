-- Fix function search path for the newly created function
CREATE OR REPLACE FUNCTION update_delivery_partner_location_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (OLD.current_latitude IS DISTINCT FROM NEW.current_latitude OR 
      OLD.current_longitude IS DISTINCT FROM NEW.current_longitude) THEN
    NEW.location_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;