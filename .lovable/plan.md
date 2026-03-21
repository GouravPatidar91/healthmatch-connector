

## Plan: Fix Doctor Payment System Issues

There are 4 distinct bugs to fix:

### Issue 1: Online payment silently fails, falls back to "pay at clinic"
**Root cause**: The `create-razorpay-order` edge function uses `receipt: \`appt_${appointment_id}\`` which is a UUID (36 chars) prefixed with `appt_` = 41 chars. Razorpay limits receipt to 40 chars. The error logs confirm: `"receipt: the length must be no more than 40."`. The payment creation fails, the catch block silently switches to `pay_at_clinic`.

**Fix**: In `create-razorpay-order/index.ts`, truncate receipt to `appt_${appointment_id.substring(0, 35)}` (40 chars max).

### Issue 2: QR code opens Razorpay checkout page instead of direct UPI intent
**Root cause**: The `generate-payment-qr` edge function creates a Razorpay Payment Link which opens a full Razorpay page. To get UPI-app-like behavior (like Rapido), we need to generate a **UPI deep link/intent URL** instead, using the `upi_link: true` option in the Razorpay Payment Link API.

**Fix**: In `generate-payment-qr/index.ts`, add `"upi_link": true` to the payment link creation body. This makes Razorpay return a `short_url` that directly opens UPI apps on mobile (like Google Pay, PhonePe, etc.) instead of a Razorpay checkout page.

### Issue 3: After QR payment, DB not updated & doctor wallet not credited
**Root cause**: The `razorpay-webhook` function handles `payment_link.paid` events correctly in code, but the webhook URL needs to be configured in the Razorpay Dashboard to point to the edge function. Without that, no events arrive. Additionally, we should add **client-side polling** as a fallback — after QR is generated, poll the appointment's `payment_status` to detect when the webhook has processed.

**Fix**:
1. In `generate-payment-qr/index.ts`, add a `callback_url` pointing to the webhook function URL so Razorpay can redirect after payment.
2. In `DoctorPaymentCollectionDialog.tsx`, add polling: after QR is shown, poll `appointments.payment_status` every 5 seconds. When it changes to `'paid'`, show the success state.

### Issue 4: No "Payment Completed" popup after QR payment on doctor dashboard
**Root cause**: No polling mechanism exists. The dialog just shows the QR forever.

**Fix**: Add polling in `DoctorPaymentCollectionDialog.tsx` that checks `payment_status` on the appointment every 5 seconds. When `paid`, show the green checkmark success UI and credit confirmation.

---

### Files to modify

| File | Change |
|------|--------|
| `supabase/functions/create-razorpay-order/index.ts` | Truncate receipt to 40 chars |
| `supabase/functions/generate-payment-qr/index.ts` | Add `upi_link: true`, set proper `callback_url` |
| `src/components/doctor/DoctorPaymentCollectionDialog.tsx` | Add payment status polling + success state |

3 files, 4 bug fixes.

