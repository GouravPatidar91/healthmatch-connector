

## Plan: Extract Raw UPI Payload from Razorpay QR Image

### Root cause
Razorpay's QR Codes API does **not** return a `content` field with the raw UPI string. The detail response only has `image_url` (the branded PNG). So `qr_content` is always empty, and the frontend always falls back to showing the branded Razorpay image.

### Solution
Decode the branded QR image server-side to extract the raw UPI payment string, then return it to the frontend for clean rendering via `QRCodeSVG`.

### Changes

#### 1. Backend: Decode QR image to extract UPI string
**File:** `supabase/functions/generate-payment-qr/index.ts`

- After creating the Razorpay QR and getting `image_url`, fetch the PNG image
- Use `jsqr` (via esm.sh) to decode the QR pattern from the image pixels
- Use a lightweight PNG decoder (e.g. `pngs` or `upng-js` via esm.sh) to get raw pixel data from the PNG
- Return the decoded UPI string as `qr_content`
- Keep `image_url` as fallback

#### 2. Frontend: Already correct, just needs the data
**File:** `src/components/doctor/DoctorPaymentCollectionDialog.tsx`

- The `QRCodeSVG` rendering path already exists (lines 132-138)
- It correctly checks `qrContent` and renders a clean QR when available
- No changes needed here — once the backend returns actual `qr_content`, this will work

#### 3. No changes needed to razorpayService.ts
- The `qr_content` field is already in the interface

### Files to update
- `supabase/functions/generate-payment-qr/index.ts` (decode QR image server-side)

### Expected result
- Backend fetches Razorpay's branded QR PNG, decodes it to get the raw UPI string (e.g. `upi://pay?pa=...&pn=...&am=...`)
- Frontend receives this string in `qr_content`
- `QRCodeSVG` renders a perfectly clean, centered QR code with zero branding
- Payment polling and wallet credit continue working unchanged

