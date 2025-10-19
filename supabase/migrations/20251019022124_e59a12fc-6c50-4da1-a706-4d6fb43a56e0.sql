-- Create Medicine Alternatives Table
CREATE TABLE public.medicine_alternatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_medicine_id UUID REFERENCES medicines(id) ON DELETE CASCADE,
  alternative_medicine_id UUID REFERENCES medicines(id) ON DELETE CASCADE,
  composition TEXT NOT NULL,
  price_difference_percentage DECIMAL(5,2),
  verified_by_pharmacist BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verification_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(primary_medicine_id, alternative_medicine_id)
);

CREATE INDEX idx_alternatives_composition ON medicine_alternatives(composition);
CREATE INDEX idx_alternatives_primary ON medicine_alternatives(primary_medicine_id);

-- Enable RLS
ALTER TABLE public.medicine_alternatives ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view medicine alternatives"
ON public.medicine_alternatives FOR SELECT
USING (true);

CREATE POLICY "Only pharmacies can add alternatives"
ON public.medicine_alternatives FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'pharmacy'::app_role)
);

-- Add OCR Metadata to Prescription Uploads
ALTER TABLE public.prescription_uploads 
ADD COLUMN ocr_status TEXT DEFAULT 'pending',
ADD COLUMN ocr_extracted_data JSONB,
ADD COLUMN ocr_confidence_score DECIMAL(3,2),
ADD COLUMN ocr_processed_at TIMESTAMPTZ,
ADD COLUMN ocr_error_message TEXT,
ADD COLUMN medicines_detected INTEGER DEFAULT 0;

CREATE INDEX idx_prescription_uploads_ocr_status ON prescription_uploads(ocr_status);

-- Create OCR Extraction Log Table
CREATE TABLE public.prescription_ocr_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES prescription_uploads(id) ON DELETE CASCADE,
  raw_text TEXT,
  extracted_medicines JSONB,
  confidence_scores JSONB,
  processing_time_ms INTEGER,
  api_provider TEXT DEFAULT 'gemini',
  error_details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ocr_logs_prescription ON prescription_ocr_logs(prescription_id);