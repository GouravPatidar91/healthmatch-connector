

# Fix: Online Payment Failure Still Creating Pending Appointments

## Problem
When a user selects "Pay Online" and cancels/fails the payment, a pending appointment is still being created in the database.

## Root Cause Analysis
The current `BookAppointmentDialog.tsx` code appears to implement a payment-first flow, but there may be a deployment timing issue or the Razorpay `ondismiss` callback may not be properly rejecting. Additionally, the user wants failed payment attempts to show as a visible "failed" record rather than disappearing entirely.

## Plan

### 1. Harden the payment-first flow in `BookAppointmentDialog.tsx`
- Ensure the online payment path **never** inserts an appointment before payment succeeds
- On payment failure/cancellation: insert an appointment with `status: 'payment_failed'` and `payment_status: 'failed'` so the user can see the failed attempt in their appointment list
- This satisfies the user's preference for "Show failed status"

### 2. Update `userDataService.ts` appointment status validation
- Add `'payment_failed'` to the valid appointment status types so it renders correctly in the UI

### 3. Update `PatientAppointments.tsx` to display failed payment status
- Show a distinct visual indicator (red badge) for `payment_failed` appointments
- Optionally add a "Retry Payment" button on failed appointments

### Technical Details

**File: `src/components/appointments/BookAppointmentDialog.tsx`**
- In the `catch` block for `processOnlinePayment` (around line 226): instead of just showing a toast and returning, insert the appointment with `status: 'payment_failed'` and `payment_status: 'failed'`
- This ensures users see the failed attempt but it's clearly not a valid booking

**File: `src/services/userDataService.ts`**
- Update `validateAppointmentStatus` to include `'payment_failed'` as a valid status

**File: `src/components/appointments/PatientAppointments.tsx`**
- Add UI handling for `payment_failed` status with appropriate styling

