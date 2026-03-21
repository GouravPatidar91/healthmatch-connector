

# Plan: Payment-First Approach for Online Appointments

## Current Problem
The current flow creates the appointment first, then processes payment. If payment fails/is cancelled, we attempt to delete the appointment — but the delete can silently fail, leaving orphaned appointments.

## New Approach
**Only create the appointment in the database after successful payment.** This eliminates the need for any delete/cleanup logic.

## Implementation Steps

### 1. Restructure `handleSubmit` in `BookAppointmentDialog.tsx`

For **online payment** flow:
1. Collect all appointment data but **do not insert** into the database yet
2. Create a Razorpay order using a temporary reference (no appointment ID yet)
3. Open Razorpay checkout
4. **Only after successful payment**: insert the appointment into the database with `payment_status: 'paid'` and store the `razorpay_payment_id` and `razorpay_order_id`
5. If payment fails/cancelled: do nothing — no appointment was ever created

For **pay at clinic** flow: no change — insert immediately as before.

### 2. Update `create-razorpay-order` Edge Function

Currently requires `appointment_id`. Change it to accept appointment metadata (doctor_id, user_id, amount) and make `appointment_id` optional. Use a temporary receipt identifier instead (e.g., `pre_appt_<timestamp>`). Skip the appointment update step when no appointment_id is provided.

### 3. Update `processOnlinePayment` in `BookAppointmentDialog.tsx`

- Accept appointment data object instead of appointment ID
- After Razorpay success callback with verified payment:
  - Insert the appointment into the database
  - Store `razorpay_order_id` and `razorpay_payment_id` on the new appointment record
- Return the created appointment so health check data can be sent afterward

### 4. Update `verify-razorpay-payment` Edge Function

Make the `appointment_id` parameter optional. When provided, update the appointment as before. When not provided, just verify the signature and return success — the client will handle the appointment creation.

## Technical Details

**File changes:**
- `src/components/appointments/BookAppointmentDialog.tsx` — Restructure `handleSubmit` and `processOnlinePayment` to payment-first flow
- `supabase/functions/create-razorpay-order/index.ts` — Make `appointment_id` optional, use fallback receipt
- `supabase/functions/verify-razorpay-payment/index.ts` — Make `appointment_id` optional in the verification flow

**Key benefit:** Zero orphaned appointments. No delete calls needed. The database only ever contains valid, paid appointments.

