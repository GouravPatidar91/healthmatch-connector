-- Create delivery_requests table
CREATE TABLE public.delivery_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.medicine_orders(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.medicine_vendors(id) ON DELETE CASCADE,
  delivery_partner_id UUID NOT NULL REFERENCES public.delivery_partners(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  responded_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_delivery_requests_partner_status 
  ON public.delivery_requests(delivery_partner_id, status);
CREATE INDEX idx_delivery_requests_order 
  ON public.delivery_requests(order_id);
CREATE INDEX idx_delivery_requests_expires 
  ON public.delivery_requests(expires_at) WHERE status = 'pending';

-- Enable Row Level Security
ALTER TABLE public.delivery_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Delivery partners can view their own requests"
  ON public.delivery_requests
  FOR SELECT
  USING (
    delivery_partner_id IN (
      SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Delivery partners can update their own requests"
  ON public.delivery_requests
  FOR UPDATE
  USING (
    delivery_partner_id IN (
      SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can view requests for their orders"
  ON public.delivery_requests
  FOR SELECT
  USING (
    vendor_id IN (
      SELECT id FROM public.medicine_vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can view requests for their orders"
  ON public.delivery_requests
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.medicine_orders WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can create delivery requests"
  ON public.delivery_requests
  FOR INSERT
  WITH CHECK (true);

-- Enable realtime for delivery_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_requests;