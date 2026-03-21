

## Plan: Doctor Payment System with Razorpay Integration

This is a large feature spanning database changes, edge functions, and multiple UI components. Here's a phased breakdown.

---

### Phase 1: Database Changes (Migration)

**1. Add `consultation_fee` column to `doctors` table:**
- `consultation_fee numeric default 0` — doctor sets their booking fee

**2. Add payment fields to `appointments` table:**
- `payment_mode text default 'online'` — values: `'online'` or `'pay_at_clinic'`
- `payment_status text default 'pending'` — values: `'pending'`, `'paid'`, `'collected_cash'`
- `payment_amount numeric default 0`
- `razorpay_order_id text` — for online payments
- `razorpay_payment_id text` — for completed payments

**3. Extend `wallets` table `owner_type`:**
- The existing `owner_type` is stored as `text`, so we can use `'doctor'` without enum changes

**4. Add `appointment_slots` fee column:**
- `consultation_fee numeric default 0` — fee for that specific slot (inherits from doctor default)

---

### Phase 2: Razorpay Secret Setup

- Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` as Supabase secrets
- The Razorpay **publishable key** (`key_id`) will also be stored as `VITE_RAZORPAY_KEY_ID` in `.env` for frontend use

---

### Phase 3: Edge Functions

**1. `create-razorpay-order/index.ts`** — Creates a Razorpay order when user books with online payment:
- Receives appointment details + amount
- Creates Razorpay order via API
- Returns `order_id` to frontend

**2. `verify-razorpay-payment/index.ts`** — Verifies payment signature after checkout:
- Validates Razorpay signature using `RAZORPAY_KEY_SECRET`
- Updates appointment `payment_status` to `'paid'`
- Credits doctor wallet

**3. `generate-payment-qr/index.ts`** — Generates a Razorpay payment link for QR:
- Creates a Razorpay Payment Link via API
- Returns the payment link URL (for QR code display)
- Listens for payment completion via webhook or polling

**4. `razorpay-webhook/index.ts`** — Webhook to handle async payment events:
- Handles `payment_link.paid` events
- Credits doctor wallet when QR payment completes

---

### Phase 4: Frontend — Doctor Dashboard Changes

**1. New tab: "Wallet & Earnings"** in Doctor Dashboard (`DoctorDashboard.tsx`)
- Reuses existing wallet components pattern (`WalletCard`, `EarningsChart`, `TransactionHistory`)
- Shows balance, earnings summary, transaction history
- "Withdraw to Bank" button with bank details form

**2. New tab: "Fee Settings"** in Doctor Dashboard
- Input field for consultation fee (₹)
- Save button → updates `doctors.consultation_fee`

**3. Payment Collection Dialog** (`DoctorPaymentCollectionDialog.tsx`)
- Triggered when doctor marks "pay_at_clinic" appointment as completed
- Two buttons: **"Collect Cash"** and **"Generate QR"**
- Collect Cash: marks `payment_status = 'collected_cash'`, credits wallet
- Generate QR: calls edge function, displays QR code using a QR library, shows payment status polling

---

### Phase 5: Frontend — Booking Flow Changes

**1. Update `BookAppointmentDialog.tsx`:**
- Show doctor's consultation fee
- Add payment mode selector: "Pay Online" or "Pay at Clinic"
- If "Pay Online": integrate Razorpay checkout (load Razorpay script, open checkout modal)
- If "Pay at Clinic": create appointment with `payment_mode = 'pay_at_clinic'`

**2. Update `AppointmentCalendar.tsx`:**
- When doctor clicks "Mark Completed" on a `pay_at_clinic` appointment → open Payment Collection Dialog instead of directly completing

---

### Phase 6: New Components

| Component | Purpose |
|-----------|---------|
| `src/components/doctor/DoctorWallet.tsx` | Wallet tab for doctor dashboard |
| `src/components/doctor/DoctorFeeSettings.tsx` | Fee configuration UI |
| `src/components/doctor/DoctorPaymentCollectionDialog.tsx` | Cash/QR collection dialog |
| `src/components/doctor/PaymentQRDisplay.tsx` | QR code display with payment status |
| `src/services/doctorWalletService.ts` | Doctor wallet service (extends wallet pattern) |
| `src/services/razorpayService.ts` | Frontend Razorpay integration helpers |

---

### Modified Files

- `src/pages/DoctorDashboard.tsx` — Add Wallet & Fee Settings tabs
- `src/components/appointments/BookAppointmentDialog.tsx` — Add fee display, payment mode, Razorpay checkout
- `src/components/doctor/AppointmentCalendar.tsx` — Payment collection on completion
- `src/services/unifiedAppointmentService.ts` — Handle payment status in completion flow
- `index.html` — Add Razorpay checkout script

---

### Technical Notes

- Razorpay checkout.js is loaded via `<script>` in `index.html`
- QR codes generated using `qrcode.react` library (new dependency)
- Doctor wallet uses same `wallets` table with `owner_type = 'doctor'`
- Payment verification uses HMAC SHA256 signature validation server-side
- The user will need to provide their Razorpay Key ID and Key Secret

