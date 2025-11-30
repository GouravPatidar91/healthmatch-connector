-- Create withdrawal_requests table
CREATE TABLE public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  bank_details jsonb,
  requested_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid,
  admin_notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for withdrawal_requests
CREATE POLICY "Users can view their own withdrawal requests"
ON public.withdrawal_requests
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create withdrawal requests"
ON public.withdrawal_requests
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all withdrawal requests"
ON public.withdrawal_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update withdrawal requests"
ON public.withdrawal_requests
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Update wallet RLS to allow admins to view all wallets
CREATE POLICY "Admins can view all wallets"
ON public.wallets
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Update wallet_transactions RLS to allow admins to view all transactions
CREATE POLICY "Admins can view all transactions"
ON public.wallet_transactions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Function to process withdrawal
CREATE OR REPLACE FUNCTION public.process_withdrawal(
  _request_id uuid,
  _approved boolean,
  _admin_notes text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _wallet_id uuid;
  _amount numeric;
  _user_id uuid;
  _new_balance numeric;
BEGIN
  -- Get withdrawal request details
  SELECT wallet_id, amount, user_id 
  INTO _wallet_id, _amount, _user_id
  FROM withdrawal_requests
  WHERE id = _request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal request not found or already processed';
  END IF;
  
  -- Check if admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can process withdrawals';
  END IF;
  
  IF _approved THEN
    -- Deduct from wallet balance
    UPDATE wallets
    SET 
      balance = balance - _amount,
      total_withdrawn = total_withdrawn + _amount,
      updated_at = now()
    WHERE id = _wallet_id AND balance >= _amount
    RETURNING balance INTO _new_balance;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient balance';
    END IF;
    
    -- Create debit transaction
    INSERT INTO wallet_transactions (
      wallet_id,
      transaction_type,
      amount,
      description,
      balance_after,
      category
    ) VALUES (
      _wallet_id,
      'withdrawal',
      _amount,
      'Withdrawal processed',
      _new_balance,
      'withdrawal'
    );
    
    -- Update withdrawal request
    UPDATE withdrawal_requests
    SET 
      status = 'approved',
      processed_at = now(),
      processed_by = auth.uid(),
      admin_notes = _admin_notes
    WHERE id = _request_id;
  ELSE
    -- Reject withdrawal request
    UPDATE withdrawal_requests
    SET 
      status = 'rejected',
      processed_at = now(),
      processed_by = auth.uid(),
      admin_notes = _admin_notes
    WHERE id = _request_id;
  END IF;
END;
$$;