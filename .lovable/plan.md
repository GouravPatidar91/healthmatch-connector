
## Plan: Replace Cropping With a True Raw-QR Rendering Method

### Why the current approach keeps failing
The current UI is trying to crop Razorpay’s branded QR image with CSS. That is unreliable because the branding/header/footer spacing inside the image is not guaranteed to stay perfectly centered. So even after tweaking offsets, the QR will keep looking misaligned on different images.

### Better alternative
Instead of displaying Razorpay’s branded `image_url`, I’ll render a **fresh QR component in the app** using the **actual QR payload/content** returned by Razorpay.

That gives you:
- only the QR square
- no Razorpay text/logos
- perfect centering every time
- a Rapido-style clean QR block

### Preferred implementation
#### 1. Return raw QR content from the backend
**File:** `supabase/functions/generate-payment-qr/index.ts`

- Keep creating the Razorpay QR on the backend
- Update the response to also return the QR’s raw content if Razorpay provides it (`image_content` / payload field)
- Still return `qr_code_id` for webhook reconciliation
- Keep the current DB update and payment tracking flow unchanged

### 2. Render the QR ourselves in React
**File:** `src/components/doctor/DoctorPaymentCollectionDialog.tsx`

- Stop showing the branded `image_url` as the main QR
- Use the already-installed `qrcode.react` package to render the QR from the raw payload
- Place it inside a fixed white square with padding so it is visually centered
- Keep the payment polling and success state exactly as now
- Keep the branded `image_url` only as a silent fallback if payload is unavailable

### 3. Update the frontend service contract
**File:** `src/services/razorpayService.ts`

- Extend `QRCodeResponse` to include the raw QR payload/content field
- Pass that to the dialog so the UI can render the clean QR component

### Fallback strategy
If Razorpay does **not** return usable raw QR content in this project/account:
- fallback option A: fetch QR details by `qr_code_id` and extract content there
- fallback option B: generate and render a direct UPI payload ourselves only if the payment target can be made stable and compatible with your reconciliation flow

### Why this is better than cropping
- no guessing image offsets
- no broken centering
- no dependency on Razorpay image layout
- fully controlled UI appearance
- much closer to the “only QR code” look you want

### Files to update
- `supabase/functions/generate-payment-qr/index.ts`
- `src/services/razorpayService.ts`
- `src/components/doctor/DoctorPaymentCollectionDialog.tsx`

### Expected result
When the doctor clicks **Generate UPI QR Code**:
- the dialog shows a clean, centered QR square only
- no “Powered by Razorpay”, BHIM, or other branding text in the displayed QR block
- payment completion polling and wallet credit flow continue working as before

### Technical note
Your project already has `qrcode.react` installed, so this can be implemented cleanly without adding a new dependency. This is the best alternative to CSS cropping.
