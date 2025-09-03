-- Medicine Vendors Table
CREATE TABLE public.medicine_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pharmacy_name TEXT NOT NULL,
  license_number TEXT UNIQUE NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  region TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_verified BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  license_document_url TEXT,
  operating_hours JSONB, -- {mon: "9:00-21:00", tue: "9:00-21:00", ...}
  delivery_radius_km INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Medicines Table (replace mock data)
CREATE TABLE public.medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  generic_name TEXT,
  manufacturer TEXT NOT NULL,
  category TEXT NOT NULL,
  composition TEXT,
  dosage TEXT NOT NULL,
  form TEXT NOT NULL, -- tablet, capsule, syrup, injection, etc.
  pack_size TEXT NOT NULL,
  mrp DECIMAL(10,2) NOT NULL,
  description TEXT,
  side_effects TEXT,
  contraindications TEXT,
  storage_instructions TEXT,
  prescription_required BOOLEAN DEFAULT false,
  drug_schedule TEXT, -- H, H1, X, etc.
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vendor Medicine Inventory
CREATE TABLE public.vendor_medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.medicine_vendors(id) ON DELETE CASCADE NOT NULL,
  medicine_id UUID REFERENCES public.medicines(id) ON DELETE CASCADE NOT NULL,
  selling_price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  expiry_date DATE,
  batch_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(vendor_id, medicine_id)
);

-- Medicine Orders
CREATE TABLE public.medicine_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vendor_id UUID REFERENCES public.medicine_vendors(id) ON DELETE CASCADE NOT NULL,
  order_number TEXT UNIQUE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  final_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT DEFAULT 'pending', -- pending, paid, failed, refunded
  order_status TEXT DEFAULT 'placed', -- placed, confirmed, packed, picked_up, out_for_delivery, delivered, cancelled, rejected
  delivery_address TEXT NOT NULL,
  delivery_latitude DOUBLE PRECISION,
  delivery_longitude DOUBLE PRECISION,
  customer_phone TEXT NOT NULL,
  prescription_required BOOLEAN DEFAULT false,
  prescription_url TEXT,
  prescription_status TEXT DEFAULT 'pending', -- pending, approved, rejected
  vendor_notes TEXT,
  rejection_reason TEXT,
  delivery_partner_id UUID,
  estimated_delivery_time TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order Items
CREATE TABLE public.medicine_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.medicine_orders(id) ON DELETE CASCADE NOT NULL,
  medicine_id UUID REFERENCES public.medicines(id) ON DELETE CASCADE NOT NULL,
  vendor_medicine_id UUID REFERENCES public.vendor_medicines(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prescription Uploads
CREATE TABLE public.prescription_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.medicine_orders(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  upload_status TEXT DEFAULT 'uploaded', -- uploaded, processing, verified, rejected
  verification_notes TEXT,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vendor Notifications
CREATE TABLE public.vendor_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.medicine_vendors(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.medicine_orders(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- new_order, prescription_uploaded, payment_received, etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- Delivery Partners
CREATE TABLE public.delivery_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  vehicle_type TEXT NOT NULL, -- bike, scooter, cycle, car
  vehicle_number TEXT NOT NULL,
  license_number TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  current_latitude DOUBLE PRECISION,
  current_longitude DOUBLE PRECISION,
  max_delivery_radius_km INTEGER DEFAULT 10,
  rating DECIMAL(3,2) DEFAULT 0,
  total_deliveries INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order Tracking
CREATE TABLE public.order_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.medicine_orders(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  location_latitude DOUBLE PRECISION,
  location_longitude DOUBLE PRECISION,
  notes TEXT,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.medicine_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Medicine Vendors
CREATE POLICY "Vendors can manage their own profile" ON public.medicine_vendors
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Public can view verified vendors" ON public.medicine_vendors
  FOR SELECT USING (is_verified = true AND is_available = true);

-- RLS Policies for Medicines
CREATE POLICY "Anyone can view medicines" ON public.medicines
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage medicines" ON public.medicines
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  ));

-- RLS Policies for Vendor Medicines
CREATE POLICY "Vendors can manage their inventory" ON public.vendor_medicines
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.medicine_vendors 
    WHERE id = vendor_id AND user_id = auth.uid()
  ));

CREATE POLICY "Public can view available inventory" ON public.vendor_medicines
  FOR SELECT USING (is_available = true AND stock_quantity > 0);

-- RLS Policies for Medicine Orders
CREATE POLICY "Users can view their own orders" ON public.medicine_orders
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own orders" ON public.medicine_orders
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Vendors can view and update their orders" ON public.medicine_orders
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.medicine_vendors 
    WHERE id = vendor_id AND user_id = auth.uid()
  ));

CREATE POLICY "Delivery partners can view assigned orders" ON public.medicine_orders
  FOR SELECT USING (delivery_partner_id = (
    SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()
  ));

-- RLS Policies for Order Items
CREATE POLICY "Users can view their order items" ON public.medicine_order_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.medicine_orders 
    WHERE id = order_id AND user_id = auth.uid()
  ));

CREATE POLICY "Vendors can view their order items" ON public.medicine_order_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.medicine_orders mo
    JOIN public.medicine_vendors mv ON mv.id = mo.vendor_id
    WHERE mo.id = order_id AND mv.user_id = auth.uid()
  ));

-- RLS Policies for Prescription Uploads
CREATE POLICY "Users can manage their prescriptions" ON public.prescription_uploads
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Vendors can view order prescriptions" ON public.prescription_uploads
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.medicine_orders mo
    JOIN public.medicine_vendors mv ON mv.id = mo.vendor_id
    WHERE mo.id = order_id AND mv.user_id = auth.uid()
  ));

-- RLS Policies for Vendor Notifications
CREATE POLICY "Vendors can view their notifications" ON public.vendor_notifications
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.medicine_vendors 
    WHERE id = vendor_id AND user_id = auth.uid()
  ));

-- RLS Policies for Delivery Partners
CREATE POLICY "Delivery partners can manage their profile" ON public.delivery_partners
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Vendors can view available delivery partners" ON public.delivery_partners
  FOR SELECT USING (is_verified = true AND is_available = true);

-- RLS Policies for Order Tracking
CREATE POLICY "Users can view their order tracking" ON public.order_tracking
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.medicine_orders 
    WHERE id = order_id AND user_id = auth.uid()
  ));

CREATE POLICY "Vendors and delivery partners can update tracking" ON public.order_tracking
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.medicine_orders mo
    LEFT JOIN public.medicine_vendors mv ON mv.id = mo.vendor_id
    LEFT JOIN public.delivery_partners dp ON dp.id = mo.delivery_partner_id
    WHERE mo.id = order_id 
    AND (mv.user_id = auth.uid() OR dp.user_id = auth.uid())
  ));

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_medicine_vendors_updated_at
    BEFORE UPDATE ON public.medicine_vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medicines_updated_at
    BEFORE UPDATE ON public.medicines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_medicines_updated_at
    BEFORE UPDATE ON public.vendor_medicines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medicine_orders_updated_at
    BEFORE UPDATE ON public.medicine_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_partners_updated_at
    BEFORE UPDATE ON public.delivery_partners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    order_num TEXT;
BEGIN
    order_num := 'MED' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(nextval('order_number_seq')::TEXT, 4, '0');
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Function to find nearby vendors
CREATE OR REPLACE FUNCTION find_nearby_medicine_vendors(
  user_lat DOUBLE PRECISION, 
  user_lng DOUBLE PRECISION, 
  radius_km INTEGER DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  pharmacy_name TEXT,
  address TEXT,
  phone TEXT,
  distance_km DOUBLE PRECISION,
  is_available BOOLEAN,
  delivery_radius_km INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mv.id,
    mv.pharmacy_name,
    mv.address,
    mv.phone,
    (6371 * acos(cos(radians(user_lat)) * cos(radians(mv.latitude)) * 
                 cos(radians(mv.longitude) - radians(user_lng)) + 
                 sin(radians(user_lat)) * sin(radians(mv.latitude)))) AS distance_km,
    mv.is_available,
    mv.delivery_radius_km
  FROM public.medicine_vendors mv
  WHERE mv.is_verified = true
    AND mv.is_available = true
    AND mv.latitude IS NOT NULL
    AND mv.longitude IS NOT NULL
    AND (6371 * acos(cos(radians(user_lat)) * cos(radians(mv.latitude)) * 
                     cos(radians(mv.longitude) - radians(user_lng)) + 
                     sin(radians(user_lat)) * sin(radians(mv.latitude)))) <= radius_km
  ORDER BY distance_km ASC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;