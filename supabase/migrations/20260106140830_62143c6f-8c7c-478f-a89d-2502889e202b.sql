-- Create medical_records table for storing user medical documents
CREATE TABLE public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  record_type TEXT NOT NULL, -- 'prescription', 'lab_report', 'diagnosis', 'imaging', 'vaccination', 'other'
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  extracted_conditions TEXT[] DEFAULT '{}',
  extracted_medications TEXT[] DEFAULT '{}',
  extracted_summary TEXT,
  notes TEXT,
  record_date DATE,
  doctor_name TEXT,
  hospital_name TEXT,
  is_analyzed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own records
CREATE POLICY "Users can view own medical records"
ON public.medical_records FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medical records"
ON public.medical_records FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medical records"
ON public.medical_records FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own medical records"
ON public.medical_records FOR DELETE
USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_medical_records_updated_at
BEFORE UPDATE ON public.medical_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create private storage bucket for medical records
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-records', 'medical-records', false);

-- Storage RLS policies
CREATE POLICY "Users can upload own medical records"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'medical-records' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own medical records files"
ON storage.objects FOR SELECT
USING (bucket_id = 'medical-records' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own medical records files"
ON storage.objects FOR DELETE
USING (bucket_id = 'medical-records' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own medical records files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'medical-records' AND (storage.foldername(name))[1] = auth.uid()::text);