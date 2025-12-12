-- Create cart_order_broadcasts table
CREATE TABLE public.cart_order_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  patient_latitude DOUBLE PRECISION NOT NULL,
  patient_longitude DOUBLE PRECISION NOT NULL,
  order_data JSONB NOT NULL,
  delivery_address TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  status TEXT DEFAULT 'searching',
  accepted_by_vendor_id UUID REFERENCES public.medicine_vendors(id),
  accepted_at TIMESTAMPTZ,
  order_id UUID REFERENCES public.medicine_orders(id),
  broadcast_round INTEGER DEFAULT 1,
  timeout_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '3 minutes',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.cart_order_broadcasts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Patients can view their cart broadcasts"
  ON public.cart_order_broadcasts
  FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Patients can create cart broadcasts"
  ON public.cart_order_broadcasts
  FOR INSERT
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "System can update cart broadcasts"
  ON public.cart_order_broadcasts
  FOR UPDATE
  USING (true);

-- Enable realtime for the table
ALTER TABLE public.cart_order_broadcasts REPLICA IDENTITY FULL;