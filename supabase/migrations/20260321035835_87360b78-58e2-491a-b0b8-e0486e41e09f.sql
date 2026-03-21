-- Add consultation_fee to doctors table
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS consultation_fee numeric DEFAULT 0;

-- Add payment fields to appointments table
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS payment_mode text DEFAULT 'pay_at_clinic';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS payment_amount numeric DEFAULT 0;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS razorpay_order_id text;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS razorpay_payment_id text;

-- Add consultation_fee to appointment_slots
ALTER TABLE public.appointment_slots ADD COLUMN IF NOT EXISTS consultation_fee numeric DEFAULT 0;