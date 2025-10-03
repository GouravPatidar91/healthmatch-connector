-- Drop existing storage policies for prescriptions bucket
DROP POLICY IF EXISTS "Users can upload their own prescriptions" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own prescriptions" ON storage.objects;
DROP POLICY IF EXISTS "Vendors can view order prescriptions" ON storage.objects;

-- Create storage policies for prescription uploads

-- Allow authenticated users to upload their own prescriptions
CREATE POLICY "Users can upload their own prescriptions"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'prescriptions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own uploaded prescriptions
CREATE POLICY "Users can view their own prescriptions"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'prescriptions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow vendors to view prescriptions for their orders
CREATE POLICY "Vendors can view order prescriptions"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'prescriptions'
  AND EXISTS (
    SELECT 1
    FROM prescription_uploads pu
    JOIN medicine_orders mo ON mo.id = pu.order_id
    JOIN medicine_vendors mv ON mv.id = mo.vendor_id
    WHERE mv.user_id = auth.uid()
    AND pu.file_url LIKE '%' || (storage.foldername(name))[1] || '%'
  )
);