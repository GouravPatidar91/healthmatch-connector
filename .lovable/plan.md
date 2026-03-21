
## Plan: Replace Payment-Link QR with True UPI QR Flow

### What’s actually causing the issue
The current doctor QR flow is not a real UPI QR flow. It:
1. Creates a Razorpay **Payment Link**
2. Encodes the **hosted URL** (`short_url`) into the QR
3. So when scanned, the customer is sent to a **Razorpay web page**

That behavior is expected for URL-based payment links. To behave more like Rapido, the QR must represent a **native UPI-compatible payment target**, not a hosted checkout page.

### Implementation approach
I’ll switch the in-clinic QR collection flow from **Razorpay Payment Links** to **Razorpay QR Codes API** so the doctor dashboard shows a scan-and-pay QR that UPI apps can handle directly.

### Changes to make

#### 1. Replace QR generation backend
**File:** `supabase/functions/generate-payment-qr/index.ts`

- Stop creating `payment_links`
- Create a **Razorpay QR Code** instead
- Save the returned Razorpay QR code id on the appointment for later matching
- Return QR metadata needed by the UI:
  - `qr_code_id`
  - `image_url` / `payload`
  - amount
  - expiry / status if available

Why:
- Payment Link QR = opens hosted page
- QR Code API = proper payment QR flow for scan-and-pay

#### 2. Update webhook handling
**File:** `supabase/functions/razorpay-webhook/index.ts`

Add support for the webhook events produced by Razorpay QR payments, not just `payment_link.paid`.

Planned webhook logic:
- Handle QR-related payment success events
- Resolve the appointment from:
  - QR code id, or
  - notes/metadata attached during QR creation
- Update appointment:
  - `payment_status = 'paid'`
  - `razorpay_payment_id`
- Credit doctor wallet once
- Guard against duplicate credits if webhook retries

Why:
- Current webhook is wired around `payment_link.paid`
- After moving to QR Codes API, payment completion event shape changes

#### 3. Update doctor QR dialog UI
**File:** `src/components/doctor/DoctorPaymentCollectionDialog.tsx`

- Render the returned **QR image/payload from the QR Codes API**
- Keep polling as a fallback, but make it watch the same appointment status as now
- Update labels to indicate this is a direct UPI scan-and-pay flow
- If the API returns both image and payload, prefer the official QR image over regenerating a QR from a URL string

Why:
- Right now the UI renders a QR from `payment_link_url`, which is the main reason scanning redirects to a page

#### 4. Update frontend service contract
**File:** `src/services/razorpayService.ts`

- Change `generatePaymentQR()` return type from payment-link fields to QR-code fields
- Ensure the dialog consumes the new shape cleanly

### Important product constraint
If the goal is:
- **Patient scans QR from their own phone in the clinic** → use **Razorpay QR Codes**
- **Patient taps a button on the same phone to open GPay/PhonePe directly** → use a **UPI intent/deep link**

Those are different flows. Your current doctor dashboard flow is clearly the first one, so QR Codes API is the correct fix.

### Extra safety fixes I’d include
- Add idempotency protection so wallet credit happens only once per appointment
- Store QR code reference separately instead of overloading `razorpay_order_id`
- Improve webhook logging for QR payments so failures are easier to trace

### Files to update
- `supabase/functions/generate-payment-qr/index.ts`
- `supabase/functions/razorpay-webhook/index.ts`
- `src/components/doctor/DoctorPaymentCollectionDialog.tsx`
- `src/services/razorpayService.ts`

### Expected result after this change
- Doctor clicks **Generate QR**
- Dashboard shows a real **scan-to-pay UPI QR**
- Patient scans from GPay / PhonePe / Paytm or scanner that supports UPI QR
- Payment completes without first landing on a hosted Razorpay payment page
- Appointment status updates to paid
- Doctor wallet gets credited
- Doctor sees the payment-completed state in the dashboard

### Technical note
If Razorpay’s QR webhook payload does not carry enough appointment context directly, I’ll map the Razorpay QR id to the appointment during QR creation and use that mapping in the webhook. This will make reconciliation reliable even if payload fields differ from Payment Links.
