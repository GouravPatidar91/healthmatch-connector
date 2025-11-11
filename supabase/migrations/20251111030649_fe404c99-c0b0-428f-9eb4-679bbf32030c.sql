-- Update the function to include search_path for security
CREATE OR REPLACE FUNCTION public.is_delivery_request_expired(expires_at timestamptz)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN expires_at <= NOW();
END;
$$;