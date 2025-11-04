-- Create order status history table for audit trail and timeline
CREATE TABLE public.medicine_order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES medicine_orders(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_by_role TEXT,
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (
    status IN ('placed', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled', 'rejected')
  )
);

-- Create indexes for better query performance
CREATE INDEX idx_order_status_history_order ON medicine_order_status_history(order_id);
CREATE INDEX idx_order_status_history_created ON medicine_order_status_history(created_at);

-- Enable RLS
ALTER TABLE public.medicine_order_status_history ENABLE ROW LEVEL SECURITY;

-- Users can view status history for their orders
CREATE POLICY "Users can view their order status history"
ON public.medicine_order_status_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM medicine_orders
    WHERE id = order_id AND user_id = auth.uid()
  )
);

-- Vendors can view status history for their orders
CREATE POLICY "Vendors can view their order status history"
ON public.medicine_order_status_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM medicine_orders mo
    JOIN medicine_vendors mv ON mv.id = mo.vendor_id
    WHERE mo.id = order_id AND mv.user_id = auth.uid()
  )
);

-- Vendors and delivery partners can create status updates
CREATE POLICY "Vendors and delivery partners can create status updates"
ON public.medicine_order_status_history FOR INSERT
WITH CHECK (
  updated_by = auth.uid() AND (
    EXISTS (
      SELECT 1 FROM medicine_orders mo
      JOIN medicine_vendors mv ON mv.id = mo.vendor_id
      WHERE mo.id = order_id AND mv.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM medicine_orders mo
      JOIN delivery_partners dp ON dp.id = mo.delivery_partner_id
      WHERE mo.id = order_id AND dp.user_id = auth.uid()
    )
  )
);

-- Create trigger function to auto-log status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.order_status IS DISTINCT FROM NEW.order_status THEN
    INSERT INTO public.medicine_order_status_history (
      order_id,
      status,
      notes,
      updated_by,
      updated_by_role
    ) VALUES (
      NEW.id,
      NEW.order_status,
      NEW.vendor_notes,
      auth.uid(),
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM medicine_vendors 
          WHERE id = NEW.vendor_id AND user_id = auth.uid()
        ) THEN 'vendor'
        WHEN EXISTS (
          SELECT 1 FROM delivery_partners 
          WHERE id = NEW.delivery_partner_id AND user_id = auth.uid()
        ) THEN 'delivery_partner'
        WHEN NEW.user_id = auth.uid() THEN 'patient'
        ELSE 'system'
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to track order status changes
CREATE TRIGGER track_order_status_changes
AFTER UPDATE ON public.medicine_orders
FOR EACH ROW
EXECUTE FUNCTION log_order_status_change();

-- Enable realtime for real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE medicine_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE medicine_order_status_history;

-- Use REPLICA IDENTITY FULL to get complete row data
ALTER TABLE medicine_orders REPLICA IDENTITY FULL;
ALTER TABLE medicine_order_status_history REPLICA IDENTITY FULL;