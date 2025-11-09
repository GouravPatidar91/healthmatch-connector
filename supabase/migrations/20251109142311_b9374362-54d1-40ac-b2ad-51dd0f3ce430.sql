-- Add new columns to medicine_orders table for enhanced order management
ALTER TABLE public.medicine_orders
ADD COLUMN IF NOT EXISTS tip_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS handling_charges numeric DEFAULT 30,
ADD COLUMN IF NOT EXISTS coupon_code text,
ADD COLUMN IF NOT EXISTS coupon_discount numeric DEFAULT 0;

-- Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL,
  min_order_amount numeric DEFAULT 0,
  max_discount_amount numeric,
  valid_from timestamp with time zone DEFAULT now(),
  valid_until timestamp with time zone NOT NULL,
  usage_limit integer,
  usage_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Create order_ratings table
CREATE TABLE IF NOT EXISTS public.order_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.medicine_orders(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review text,
  delivery_rating integer CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
  pharmacy_rating integer CHECK (pharmacy_rating >= 1 AND pharmacy_rating <= 5),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(order_id, user_id)
);

-- Enable RLS on new tables
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coupons
CREATE POLICY "Anyone can view active coupons"
ON public.coupons
FOR SELECT
TO authenticated
USING (is_active = true AND valid_until > now());

CREATE POLICY "Only admins can manage coupons"
ON public.coupons
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for order_ratings
CREATE POLICY "Users can view ratings for their orders"
ON public.order_ratings
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM medicine_orders mo
    JOIN medicine_vendors mv ON mv.id = mo.vendor_id
    WHERE mo.id = order_ratings.order_id AND mv.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create ratings for their delivered orders"
ON public.order_ratings
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM medicine_orders
    WHERE id = order_ratings.order_id 
    AND user_id = auth.uid() 
    AND order_status = 'delivered'
  )
);

CREATE POLICY "Users can update their own ratings"
ON public.order_ratings
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());