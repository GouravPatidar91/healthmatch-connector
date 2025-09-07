-- Add prescription forwarding tracking fields
ALTER TABLE prescription_uploads ADD COLUMN forwarded_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE prescription_uploads ADD COLUMN response_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE prescription_uploads ADD COLUMN forwarding_status TEXT DEFAULT 'pending';

-- Create vendor response tracking table
CREATE TABLE vendor_prescription_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES prescription_uploads(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES medicine_vendors(id) ON DELETE CASCADE,
  response_status TEXT DEFAULT 'pending' CHECK (response_status IN ('pending', 'accepted', 'declined', 'timeout')),
  response_time TIMESTAMP WITH TIME ZONE,
  decline_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for vendor prescription responses
ALTER TABLE vendor_prescription_responses ENABLE ROW LEVEL SECURITY;

-- Users can view responses to their prescriptions
CREATE POLICY "Users can view their prescription responses" 
ON vendor_prescription_responses 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM prescription_uploads 
  WHERE prescription_uploads.id = vendor_prescription_responses.prescription_id 
  AND prescription_uploads.user_id = auth.uid()
));

-- Vendors can manage responses to prescriptions
CREATE POLICY "Vendors can manage their prescription responses" 
ON vendor_prescription_responses 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM medicine_vendors 
  WHERE medicine_vendors.id = vendor_prescription_responses.vendor_id 
  AND medicine_vendors.user_id = auth.uid()
));

-- Add trigger for updated_at
CREATE TRIGGER update_vendor_prescription_responses_updated_at
BEFORE UPDATE ON vendor_prescription_responses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();