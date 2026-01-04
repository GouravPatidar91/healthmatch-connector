-- Add new columns to cart_order_broadcasts for hybrid broadcast model
ALTER TABLE public.cart_order_broadcasts 
ADD COLUMN IF NOT EXISTS current_phase text DEFAULT 'controlled_parallel',
ADD COLUMN IF NOT EXISTS phase_timeout_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS notified_vendor_ids uuid[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS current_vendor_index integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_vendors jsonb DEFAULT '[]';

-- Create improved function to find and rank nearby vendors
CREATE OR REPLACE FUNCTION public.find_ranked_nearby_vendors(
  user_lat double precision, 
  user_lng double precision, 
  radius_km integer DEFAULT 15
)
RETURNS TABLE(
  id uuid, 
  pharmacy_name text, 
  address text, 
  phone text, 
  distance_km double precision, 
  average_rating numeric,
  total_ratings integer,
  reliability_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mv.id,
    mv.pharmacy_name,
    mv.address,
    mv.phone,
    (6371 * acos(cos(radians(user_lat)) * cos(radians(mv.latitude)) * 
                 cos(radians(mv.longitude) - radians(user_lng)) + 
                 sin(radians(user_lat)) * sin(radians(mv.latitude)))) AS distance_km,
    COALESCE(mv.average_rating, 0::numeric) AS average_rating,
    COALESCE(mv.total_ratings, 0) AS total_ratings,
    -- Reliability score: combines rating, distance, and order history
    -- Higher is better: (rating/5 * 0.4) + (1/distance * 0.4) + (min(total_ratings, 100)/100 * 0.2)
    (
      (COALESCE(mv.average_rating, 3) / 5.0 * 0.4) +
      (1.0 / GREATEST((6371 * acos(cos(radians(user_lat)) * cos(radians(mv.latitude)) * 
                 cos(radians(mv.longitude) - radians(user_lng)) + 
                 sin(radians(user_lat)) * sin(radians(mv.latitude)))), 0.1) * 0.4) +
      (LEAST(COALESCE(mv.total_ratings, 0), 100)::numeric / 100.0 * 0.2)
    )::numeric AS reliability_score
  FROM public.medicine_vendors mv
  WHERE mv.is_verified = true
    AND mv.is_available = true
    AND mv.latitude IS NOT NULL
    AND mv.longitude IS NOT NULL
    AND (6371 * acos(cos(radians(user_lat)) * cos(radians(mv.latitude)) * 
                     cos(radians(mv.longitude) - radians(user_lng)) + 
                     sin(radians(user_lat)) * sin(radians(mv.latitude)))) <= radius_km
  ORDER BY reliability_score DESC, distance_km ASC
  LIMIT 20;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.find_ranked_nearby_vendors IS 'Finds and ranks nearby vendors by reliability score (rating, distance, order history) for hybrid broadcast model';