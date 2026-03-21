
Fix the issue by enforcing a strict “payment-first, server-created” flow for online appointments so no `pending` appointment can exist before successful payment.

1. Remove the current fallback that inserts an appointment on payment failure
- In `src/components/appointments/BookAppointmentDialog.tsx`, delete the online-payment `catch` logic that currently inserts:
  - `status: 'payment_failed'`
  - `payment_status: 'failed'`
- Update the toast to clearly say:
  - payment was not completed
  - no appointment was booked
- Keep the dialog open after failure/cancel so the user can retry or switch payment mode.

2. Make the client stop preparing online appointments as “pending”
- In `BookAppointmentDialog.tsx`, split the payloads:
  - `baseAppointmentData` for common doctor/date/time data
  - `onlineAppointmentPayload` only used after successful payment
- Do not keep `status: 'pending'` / `payment_status: 'pending'` in the pre-payment path.
- Only insert for:
  - pay-at-clinic immediately
  - online only after payment verification succeeds

3. Move final online appointment creation into a dedicated edge function
- Add a new edge function such as `create-paid-appointment`
- This function should:
  - validate the authenticated user from JWT
  - accept verified payment details plus appointment data
  - insert the appointment with:
    - `payment_mode = 'online'`
    - `payment_status = 'paid'`
    - `status = 'pending'`
    - Razorpay IDs
  - optionally send health-check linkage afterward, or return the created appointment so the client can do it
- Reason: this prevents any accidental client-side unpaid insert path.

4. Tighten database rules for online appointment inserts
- Add a migration for `public.appointments` with a validation trigger/function that rejects invalid online inserts.
- The trigger should block inserts where:
  - `payment_mode = 'online'` and `payment_status <> 'paid'`
  - `payment_mode = 'online'` and `razorpay_order_id` is null
  - `payment_mode = 'online'` and `razorpay_payment_id` is null
  - `payment_mode = 'online'` and `status <> 'pending'`
- This creates a hard database rule so unpaid online appointments cannot be inserted even if frontend logic regresses later.

5. Tighten the appointments INSERT RLS policy
- Replace the broad current insert rule (`user_id = auth.uid()`) with a stricter condition:
  - users may insert pay-at-clinic appointments only when `payment_mode = 'pay_at_clinic'`
  - paid online appointments should be created by the secure server path instead of normal client inserts
- If needed, keep client inserts for pay-at-clinic and let the new edge function use the service role for online paid creation.

6. Keep the appointment list behavior clean
- In `src/components/appointments/PatientAppointments.tsx` and `src/services/userDataService.ts`:
  - remove special handling for `payment_failed` if the new strict rule is adopted
  - ensure the list only shows real appointments
- Result:
  - failed/cancelled online payment = no appointment row
  - successful online payment = first visible row is the real `pending` appointment

Technical details
- Root cause found: `BookAppointmentDialog.tsx` still intentionally creates a record in the payment failure catch block. That is why a row still appears.
- Current database data also suggests online rows are not being reliably separated yet, so the safest fix is defense in depth:
  1. remove failure insert in UI
  2. create online appointments only after verified payment
  3. enforce it in database trigger + stricter insert policy

Files likely involved
- `src/components/appointments/BookAppointmentDialog.tsx`
- `src/components/appointments/PatientAppointments.tsx`
- `src/services/userDataService.ts`
- `supabase/functions/verify-razorpay-payment/index.ts`
- new edge function: `supabase/functions/create-paid-appointment/index.ts`
- new migration in `supabase/migrations/`

Expected result
- If user opens Razorpay and cancels/fails: no appointment is created, and toast says no appointment was booked.
- If payment succeeds: appointment is created once, with online-paid metadata, and appears as `pending`.
