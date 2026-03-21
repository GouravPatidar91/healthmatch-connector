
-- Validation trigger: block online appointments that aren't properly paid
CREATE OR REPLACE FUNCTION public.validate_online_appointment()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only validate online payment appointments
  IF NEW.payment_mode = 'online' THEN
    IF NEW.payment_status IS DISTINCT FROM 'paid' THEN
      RAISE EXCEPTION 'Online appointments must have payment_status = paid. Got: %', NEW.payment_status;
    END IF;
    IF NEW.razorpay_order_id IS NULL THEN
      RAISE EXCEPTION 'Online appointments must have a razorpay_order_id';
    END IF;
    IF NEW.razorpay_payment_id IS NULL THEN
      RAISE EXCEPTION 'Online appointments must have a razorpay_payment_id';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_online_appointment
  BEFORE INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_online_appointment();

-- Tighten RLS: patients can only insert pay_at_clinic appointments directly
-- Online paid appointments are created by the edge function using service role
DROP POLICY IF EXISTS "Patients can create appointments" ON public.appointments;

CREATE POLICY "Patients can create pay_at_clinic appointments"
  ON public.appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (payment_mode IS NULL OR payment_mode = 'pay_at_clinic')
  );
