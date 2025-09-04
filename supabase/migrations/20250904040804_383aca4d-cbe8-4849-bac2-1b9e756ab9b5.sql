-- Create storage bucket for prescription uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('prescriptions', 'prescriptions', false);

-- Create storage policies for prescription uploads
CREATE POLICY "Users can upload their own prescriptions" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'prescriptions' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own prescriptions" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'prescriptions' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Vendors can view prescriptions for their orders" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'prescriptions'
    AND EXISTS (
      SELECT 1 FROM prescription_uploads pu
      JOIN medicine_orders mo ON mo.id = pu.order_id
      JOIN medicine_vendors mv ON mv.id = mo.vendor_id
      WHERE pu.file_url LIKE '%' || name || '%'
      AND mv.user_id = auth.uid()
    )
  );