
# Strict Payment-First Flow for Online Appointments — IMPLEMENTED

## What was done

### 1. Removed failure insert from `BookAppointmentDialog.tsx`
- The `catch` block no longer inserts any appointment record on payment failure
- Toast now says: "Payment was cancelled or failed. No appointment has been booked."
- Dialog stays open so user can retry or switch to Pay at Clinic

### 2. Created `create-paid-appointment` edge function
- Validates JWT, verifies Razorpay signature server-side
- Only after verification: inserts appointment with `payment_status: 'paid'`, `payment_mode: 'online'`
- Credits doctor wallet
- Uses service role to bypass RLS (online appointments can't be inserted by client)

### 3. Database trigger `trg_validate_online_appointment`
- Blocks any INSERT where `payment_mode = 'online'` but:
  - `payment_status != 'paid'`
  - `razorpay_order_id IS NULL`
  - `razorpay_payment_id IS NULL`

### 4. Tightened RLS policy
- Patients can only INSERT appointments with `payment_mode = 'pay_at_clinic'`
- Online appointments are created server-side via edge function (service role)

### 5. Cleaned up `payment_failed` status
- Removed from `userDataService.ts` type definitions
- Removed from `PatientAppointments.tsx` badge styling

## Result
- Failed/cancelled payment = NO database row created
- Successful payment = appointment created server-side with verified payment data
- Database-level enforcement prevents any regression
