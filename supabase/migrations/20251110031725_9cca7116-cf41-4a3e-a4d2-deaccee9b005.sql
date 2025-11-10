-- Add location update timestamp to delivery_partners
ALTER TABLE public.delivery_partners 
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add index for faster location queries
CREATE INDEX IF NOT EXISTS idx_delivery_partners_location 
ON public.delivery_partners (current_latitude, current_longitude)
WHERE is_available = true;

-- Enable realtime for delivery_partners table
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_partners;

-- Update location_updated_at trigger
CREATE OR REPLACE FUNCTION update_delivery_partner_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.current_latitude IS DISTINCT FROM NEW.current_latitude OR 
      OLD.current_longitude IS DISTINCT FROM NEW.current_longitude) THEN
    NEW.location_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_delivery_partner_location
BEFORE UPDATE ON public.delivery_partners
FOR EACH ROW
EXECUTE FUNCTION update_delivery_partner_location_timestamp();