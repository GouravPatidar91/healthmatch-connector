
-- Create a function to get patient display name with fallbacks
CREATE OR REPLACE FUNCTION public.get_patient_display_name(user_uuid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    -- First try: full name from profiles
    CASE 
      WHEN p.first_name IS NOT NULL AND p.last_name IS NOT NULL 
      THEN TRIM(p.first_name || ' ' || p.last_name)
      WHEN p.first_name IS NOT NULL 
      THEN p.first_name
      WHEN p.last_name IS NOT NULL 
      THEN p.last_name
      ELSE NULL
    END,
    -- Second try: extract username from email
    CASE 
      WHEN au.email IS NOT NULL 
      THEN SPLIT_PART(au.email, '@', 1)
      ELSE NULL
    END,
    -- Final fallback
    'Unknown Patient'
  )
  FROM public.profiles p
  LEFT JOIN auth.users au ON au.id = user_uuid
  WHERE p.id = user_uuid;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_patient_display_name(uuid) TO authenticated;
