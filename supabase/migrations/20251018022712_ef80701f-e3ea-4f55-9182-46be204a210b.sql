-- Create prescription broadcasts tracking table
CREATE TABLE IF NOT EXISTS prescription_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES prescription_uploads(id) ON DELETE CASCADE,
  order_id UUID REFERENCES medicine_orders(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL,
  patient_latitude DOUBLE PRECISION NOT NULL,
  patient_longitude DOUBLE PRECISION NOT NULL,
  broadcast_round INTEGER DEFAULT 1,
  status TEXT DEFAULT 'searching',
  accepted_by_vendor_id UUID REFERENCES medicine_vendors(id),
  accepted_at TIMESTAMPTZ,
  timeout_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '3 minutes',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prescription_broadcasts_status ON prescription_broadcasts(status);
CREATE INDEX idx_prescription_broadcasts_timeout ON prescription_broadcasts(timeout_at);
CREATE INDEX idx_prescription_broadcasts_patient ON prescription_broadcasts(patient_id);

-- Create pharmacy notification queue table
CREATE TABLE IF NOT EXISTS pharmacy_notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID REFERENCES prescription_broadcasts(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES medicine_vendors(id) ON DELETE CASCADE,
  notification_status TEXT DEFAULT 'sent',
  notified_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  response_type TEXT,
  rejection_reason TEXT,
  UNIQUE(broadcast_id, vendor_id)
);

CREATE INDEX idx_notification_queue_broadcast ON pharmacy_notification_queue(broadcast_id);
CREATE INDEX idx_notification_queue_vendor ON pharmacy_notification_queue(vendor_id, notification_status);

-- Enable RLS
ALTER TABLE prescription_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_notification_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prescription_broadcasts
CREATE POLICY "Patients can view their broadcasts"
ON prescription_broadcasts FOR SELECT
USING (patient_id = auth.uid());

CREATE POLICY "Patients can create broadcasts"
ON prescription_broadcasts FOR INSERT
WITH CHECK (patient_id = auth.uid());

-- RLS Policies for pharmacy_notification_queue
CREATE POLICY "Pharmacies can view their notifications"
ON pharmacy_notification_queue FOR SELECT
USING (
  vendor_id IN (
    SELECT id FROM medicine_vendors WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Pharmacies can update their responses"
ON pharmacy_notification_queue FOR UPDATE
USING (
  vendor_id IN (
    SELECT id FROM medicine_vendors WHERE user_id = auth.uid()
  )
);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE prescription_broadcasts;
ALTER PUBLICATION supabase_realtime ADD TABLE pharmacy_notification_queue;