-- Step 1: Create app_role enum
CREATE TYPE public.app_role AS ENUM ('patient', 'pharmacy', 'admin', 'delivery_partner');

-- Step 2: Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create security definer function (PREVENTS RECURSION)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Step 4: Create helper function to get all user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS SETOF app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
$$;

-- Step 5: Migrate existing admin and doctor data to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM public.profiles WHERE is_admin = true
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'pharmacy'::app_role FROM public.profiles WHERE is_doctor = true
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 6: RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Only admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Step 7: Update profiles RLS policies to be more secure
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Step 8: Update medicines RLS to use has_role function
DROP POLICY IF EXISTS "Only admins can manage medicines" ON public.medicines;

CREATE POLICY "Only admins can manage medicines"
ON public.medicines FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Step 9: Fix prescription storage bucket policies
DROP POLICY IF EXISTS "Users can upload their own prescriptions" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own prescriptions" ON storage.objects;
DROP POLICY IF EXISTS "Users can insert their own prescriptions" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own prescriptions" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own prescriptions" ON storage.objects;
DROP POLICY IF EXISTS "Vendors can view order prescriptions" ON storage.objects;

CREATE POLICY "Users can upload prescriptions"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'prescriptions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own prescriptions"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'prescriptions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own prescriptions"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'prescriptions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own prescriptions"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'prescriptions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Vendors can view order prescriptions"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'prescriptions'
  AND EXISTS (
    SELECT 1 FROM medicine_orders mo
    JOIN medicine_vendors mv ON mv.id = mo.vendor_id
    WHERE mv.user_id = auth.uid()
    AND mo.prescription_url LIKE '%' || name || '%'
  )
);