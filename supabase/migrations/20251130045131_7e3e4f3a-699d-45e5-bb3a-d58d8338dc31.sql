-- Create wallets table
CREATE TABLE public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  owner_type text NOT NULL CHECK (owner_type IN ('delivery_partner', 'vendor')),
  owner_id uuid NOT NULL,
  balance numeric DEFAULT 0 NOT NULL,
  total_earned numeric DEFAULT 0 NOT NULL,
  total_withdrawn numeric DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(owner_type, owner_id)
);

-- Create wallet_transactions table
CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  order_id uuid REFERENCES medicine_orders(id),
  transaction_type text NOT NULL CHECK (transaction_type IN ('credit', 'debit', 'withdrawal', 'refund')),
  amount numeric NOT NULL,
  description text,
  balance_after numeric NOT NULL,
  category text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wallets
CREATE POLICY "Users can view their own wallet"
  ON public.wallets
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own wallet"
  ON public.wallets
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for wallet_transactions
CREATE POLICY "Users can view their wallet transactions"
  ON public.wallet_transactions
  FOR SELECT
  USING (
    wallet_id IN (
      SELECT id FROM wallets WHERE user_id = auth.uid()
    )
  );

-- Create security definer function to get or create wallet
CREATE OR REPLACE FUNCTION public.get_or_create_wallet(
  _user_id uuid,
  _owner_type text,
  _owner_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _wallet_id uuid;
BEGIN
  -- Try to get existing wallet
  SELECT id INTO _wallet_id
  FROM wallets
  WHERE owner_type = _owner_type AND owner_id = _owner_id;
  
  -- Create if doesn't exist
  IF _wallet_id IS NULL THEN
    INSERT INTO wallets (user_id, owner_type, owner_id, balance, total_earned, total_withdrawn)
    VALUES (_user_id, _owner_type, _owner_id, 0, 0, 0)
    RETURNING id INTO _wallet_id;
  END IF;
  
  RETURN _wallet_id;
END;
$$;

-- Create function to credit wallet
CREATE OR REPLACE FUNCTION public.credit_wallet(
  _wallet_id uuid,
  _order_id uuid,
  _amount numeric,
  _description text,
  _category text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_balance numeric;
BEGIN
  -- Update wallet balance and total earned
  UPDATE wallets
  SET 
    balance = balance + _amount,
    total_earned = total_earned + _amount,
    updated_at = now()
  WHERE id = _wallet_id
  RETURNING balance INTO _new_balance;
  
  -- Create transaction record
  INSERT INTO wallet_transactions (
    wallet_id,
    order_id,
    transaction_type,
    amount,
    description,
    balance_after,
    category
  ) VALUES (
    _wallet_id,
    _order_id,
    'credit',
    _amount,
    _description,
    _new_balance,
    _category
  );
END;
$$;

-- Create auto-credit trigger function
CREATE OR REPLACE FUNCTION public.credit_wallets_on_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _delivery_partner_wallet_id uuid;
  _vendor_wallet_id uuid;
  _delivery_partner_user_id uuid;
  _vendor_user_id uuid;
  _delivery_amount numeric;
BEGIN
  -- Only process when status changes to 'delivered'
  IF NEW.order_status = 'delivered' AND (OLD.order_status IS NULL OR OLD.order_status != 'delivered') THEN
    
    -- Credit Delivery Partner
    IF NEW.delivery_partner_id IS NOT NULL THEN
      -- Get delivery partner user_id
      SELECT user_id INTO _delivery_partner_user_id
      FROM delivery_partners
      WHERE id = NEW.delivery_partner_id;
      
      IF _delivery_partner_user_id IS NOT NULL THEN
        -- Get or create wallet
        _delivery_partner_wallet_id := get_or_create_wallet(
          _delivery_partner_user_id,
          'delivery_partner',
          NEW.delivery_partner_id
        );
        
        -- Calculate total delivery amount (delivery_fee + tip)
        _delivery_amount := COALESCE(NEW.delivery_fee, 0) + COALESCE(NEW.tip_amount, 0);
        
        -- Credit delivery fee
        IF NEW.delivery_fee > 0 THEN
          PERFORM credit_wallet(
            _delivery_partner_wallet_id,
            NEW.id,
            NEW.delivery_fee,
            'Delivery fee for order #' || NEW.order_number,
            'delivery_fee'
          );
        END IF;
        
        -- Credit tip
        IF COALESCE(NEW.tip_amount, 0) > 0 THEN
          PERFORM credit_wallet(
            _delivery_partner_wallet_id,
            NEW.id,
            NEW.tip_amount,
            'Tip for order #' || NEW.order_number,
            'tip'
          );
        END IF;
      END IF;
    END IF;
    
    -- Credit Vendor
    IF NEW.vendor_id IS NOT NULL THEN
      -- Get vendor user_id
      SELECT user_id INTO _vendor_user_id
      FROM medicine_vendors
      WHERE id = NEW.vendor_id;
      
      IF _vendor_user_id IS NOT NULL THEN
        -- Get or create wallet
        _vendor_wallet_id := get_or_create_wallet(
          _vendor_user_id,
          'vendor',
          NEW.vendor_id
        );
        
        -- Credit medicine sale amount (total_amount)
        PERFORM credit_wallet(
          _vendor_wallet_id,
          NEW.id,
          NEW.total_amount,
          'Medicine sale for order #' || NEW.order_number,
          'medicine_sale'
        );
      END IF;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER trigger_credit_wallets_on_delivery
  AFTER UPDATE ON public.medicine_orders
  FOR EACH ROW
  EXECUTE FUNCTION credit_wallets_on_delivery();

-- Create index for faster queries
CREATE INDEX idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);
CREATE INDEX idx_wallets_owner ON wallets(owner_type, owner_id);