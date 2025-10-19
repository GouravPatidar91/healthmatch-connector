-- Enable RLS on prescription_ocr_logs
ALTER TABLE public.prescription_ocr_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prescription_ocr_logs
CREATE POLICY "Users can view their prescription OCR logs"
ON public.prescription_ocr_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM prescription_uploads
    WHERE prescription_uploads.id = prescription_ocr_logs.prescription_id
    AND prescription_uploads.user_id = auth.uid()
  )
);

CREATE POLICY "System can create OCR logs"
ON public.prescription_ocr_logs FOR INSERT
WITH CHECK (true);