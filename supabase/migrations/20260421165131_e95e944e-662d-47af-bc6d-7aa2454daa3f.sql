-- Create a public storage bucket for the Curezy Android APK
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-downloads',
  'app-downloads',
  true,
  524288000, -- 500 MB
  ARRAY['application/vnd.android.package-archive', 'application/octet-stream']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 524288000,
  allowed_mime_types = ARRAY['application/vnd.android.package-archive', 'application/octet-stream'];

-- Public read policy so anyone can download the APK
CREATE POLICY "Anyone can download app files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'app-downloads');

-- Only admins can upload/replace the APK
CREATE POLICY "Admins can upload app files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'app-downloads'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update app files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'app-downloads'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete app files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'app-downloads'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);