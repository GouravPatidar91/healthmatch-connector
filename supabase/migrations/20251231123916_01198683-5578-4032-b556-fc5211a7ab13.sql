-- Add rating columns to medicine_vendors table
ALTER TABLE medicine_vendors 
ADD COLUMN IF NOT EXISTS average_rating numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_ratings integer DEFAULT 0;

-- Create function to update delivery partner average rating
CREATE OR REPLACE FUNCTION update_delivery_partner_rating()
RETURNS TRIGGER AS $$
DECLARE
  partner_id uuid;
  avg_rating numeric;
  rating_count integer;
BEGIN
  -- Get the delivery partner id from the order
  SELECT mo.delivery_partner_id INTO partner_id
  FROM medicine_orders mo
  WHERE mo.id = NEW.order_id;
  
  IF partner_id IS NOT NULL AND NEW.delivery_rating IS NOT NULL THEN
    -- Calculate new average rating
    SELECT 
      COALESCE(AVG(or2.delivery_rating), 0),
      COUNT(or2.delivery_rating)
    INTO avg_rating, rating_count
    FROM order_ratings or2
    JOIN medicine_orders mo2 ON mo2.id = or2.order_id
    WHERE mo2.delivery_partner_id = partner_id
    AND or2.delivery_rating IS NOT NULL;
    
    -- Update delivery partner rating
    UPDATE delivery_partners
    SET rating = ROUND(avg_rating::numeric, 1)
    WHERE id = partner_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for delivery partner rating
DROP TRIGGER IF EXISTS update_delivery_partner_rating_trigger ON order_ratings;
CREATE TRIGGER update_delivery_partner_rating_trigger
AFTER INSERT OR UPDATE ON order_ratings
FOR EACH ROW
EXECUTE FUNCTION update_delivery_partner_rating();

-- Create function to update vendor average rating
CREATE OR REPLACE FUNCTION update_vendor_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_vendor_id uuid;
  avg_rating numeric;
  rating_count integer;
BEGIN
  -- Get the vendor id from the order
  SELECT mo.vendor_id INTO v_vendor_id
  FROM medicine_orders mo
  WHERE mo.id = NEW.order_id;
  
  IF v_vendor_id IS NOT NULL AND NEW.pharmacy_rating IS NOT NULL THEN
    -- Calculate new average rating
    SELECT 
      COALESCE(AVG(or2.pharmacy_rating), 0),
      COUNT(or2.pharmacy_rating)
    INTO avg_rating, rating_count
    FROM order_ratings or2
    JOIN medicine_orders mo2 ON mo2.id = or2.order_id
    WHERE mo2.vendor_id = v_vendor_id
    AND or2.pharmacy_rating IS NOT NULL;
    
    -- Update vendor rating
    UPDATE medicine_vendors
    SET 
      average_rating = ROUND(avg_rating::numeric, 1),
      total_ratings = rating_count
    WHERE id = v_vendor_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for vendor rating
DROP TRIGGER IF EXISTS update_vendor_rating_trigger ON order_ratings;
CREATE TRIGGER update_vendor_rating_trigger
AFTER INSERT OR UPDATE ON order_ratings
FOR EACH ROW
EXECUTE FUNCTION update_vendor_rating();