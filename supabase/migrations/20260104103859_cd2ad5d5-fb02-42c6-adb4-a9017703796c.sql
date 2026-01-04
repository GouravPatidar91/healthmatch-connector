-- Add delivery_broadcasts table to track hybrid broadcast state for delivery partners
CREATE TABLE IF NOT EXISTS public.delivery_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES medicine_orders(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES medicine_vendors(id),
  status TEXT NOT NULL DEFAULT 'searching',
  current_phase TEXT NOT NULL DEFAULT 'controlled_parallel',
  phase_timeout_at TIMESTAMPTZ NOT NULL,
  timeout_at TIMESTAMPTZ NOT NULL,
  notified_partner_ids UUID[] DEFAULT '{}',
  all_partner_ids UUID[] DEFAULT '{}',
  remaining_partners JSONB DEFAULT '[]',
  accepted_by_partner_id UUID REFERENCES delivery_partners(id),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for efficient lookups
CREATE INDEX idx_delivery_broadcasts_order_id ON delivery_broadcasts(order_id);
CREATE INDEX idx_delivery_broadcasts_status ON delivery_broadcasts(status);

-- Enable RLS
ALTER TABLE delivery_broadcasts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Vendors can view their delivery broadcasts"
ON delivery_broadcasts FOR SELECT
USING (vendor_id IN (SELECT id FROM medicine_vendors WHERE user_id = auth.uid()));

CREATE POLICY "System can manage delivery broadcasts"
ON delivery_broadcasts FOR ALL
USING (true);

-- Enable realtime
ALTER TABLE delivery_broadcasts REPLICA IDENTITY FULL;

-- Add to realtime publication if not already there
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'delivery_broadcasts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE delivery_broadcasts;
  END IF;
END $$;