-- Add delivery location fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS delivery_latitude double precision,
ADD COLUMN IF NOT EXISTS delivery_longitude double precision,
ADD COLUMN IF NOT EXISTS delivery_address text;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_delivery_location 
ON profiles(delivery_latitude, delivery_longitude) 
WHERE delivery_latitude IS NOT NULL AND delivery_longitude IS NOT NULL;

-- Add comment
COMMENT ON COLUMN profiles.delivery_latitude IS 'User preferred delivery location latitude';
COMMENT ON COLUMN profiles.delivery_longitude IS 'User preferred delivery location longitude';
COMMENT ON COLUMN profiles.delivery_address IS 'User preferred delivery address';