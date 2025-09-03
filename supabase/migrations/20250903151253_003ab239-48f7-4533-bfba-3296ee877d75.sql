-- Fix function search path security issues
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    order_num TEXT;
BEGIN
    order_num := 'MED' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(nextval('order_number_seq')::TEXT, 4, '0');
    RETURN order_num;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_doctor_notifications_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_patient_display_name(user_uuid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.sync_doctor_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- If user is granted doctor access, mark their doctor record as verified
  IF NEW.is_doctor = true THEN
    UPDATE public.doctors 
    SET verified = true 
    WHERE id IN (
      SELECT d.id 
      FROM public.doctors d
      JOIN public.profiles p ON p.id = NEW.id
      WHERE d.registration_number IS NOT NULL
    );
  -- If doctor access is revoked, mark their doctor record as not verified
  ELSIF NEW.is_doctor = false THEN
    UPDATE public.doctors 
    SET verified = false 
    WHERE id IN (
      SELECT d.id 
      FROM public.doctors d
      JOIN public.profiles p ON p.id = NEW.id
      WHERE d.registration_number IS NOT NULL
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_verified_doctors()
RETURNS SETOF doctors
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT * FROM public.doctors WHERE verified = true;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.find_nearest_doctor(lat double precision, long double precision, specialization_filter text DEFAULT NULL::text)
RETURNS TABLE(id uuid, name text, specialization text, hospital text, address text, distance double precision)
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    d.id, 
    d.name, 
    d.specialization, 
    d.hospital, 
    d.address,
    -- Calculate distance in km using the Haversine formula
    6371 * 2 * asin(sqrt(
      sin((radians(d.latitude) - radians(lat)) / 2)^2 +
      cos(radians(lat)) * cos(radians(d.latitude)) *
      sin((radians(d.longitude) - radians(long)) / 2)^2
    )) as distance
  FROM public.doctors d
  WHERE d.available = true
    AND (specialization_filter IS NULL OR d.specialization = specialization_filter)
  ORDER BY distance ASC
  LIMIT 5;
END;
$function$;