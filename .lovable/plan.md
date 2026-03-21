

## Plan: Reliable Unbranded QR Code via Server-Side Image Decoding

### Problem
The current approach tries to decode Razorpay's branded PNG using `jsqr` and `upng-js` via ESM imports in Deno, but it's silently failing — likely due to ESM module compatibility issues in the Deno edge function runtime. When `qrContent` comes back empty, the frontend falls back to showing the branded Razorpay `image_url`.

### Root Cause
The `jsqr` and `upng-js` libraries imported via `esm.sh` may not work correctly in Deno's edge function environment (CJS/ESM interop issues, missing default exports, or UPNG not producing valid RGBA data). The logs show no output, suggesting the function may not even be deploying correctly or the decode silently fails.

### Solution: Fix the server-side decoding approach

The architecture is correct — create Razorpay QR, fetch branded image, decode it to extract raw UPI string, return to frontend for clean rendering via `QRCodeSVG`. The issue is purely in the library imports/usage.

### Changes

**File: `supabase/functions/generate-payment-qr/index.ts`**

Replace the current `jsqr` + `upng-js` approach with a more reliable method:

1. Use the **Canvas API** approach — Deno doesn't have Canvas, so instead use a different PNG decoding strategy
2. Import `pngs` (a Deno-native PNG decoder) or use `png-js` that works better in Deno
3. Actually, the simplest fix: use `jsqr` with a **proper default import** pattern and decode the PNG manually using raw byte parsing

Concrete fix:
- Replace `import jsQR from "https://esm.sh/jsqr@1.4.0"` with `import jsQR from "https://esm.sh/jsqr@1.4.0?bundle"`  
- Replace `import UPNG from "https://esm.sh/upng-js@2.1.0"` with `import UPNG from "https://esm.sh/upng-js@2.1.0?bundle"`
- The `?bundle` flag tells esm.sh to bundle the module properly for Deno, resolving CJS interop issues
- Add extensive logging so we can see exactly what's happening: log the image fetch status, decoded dimensions, jsQR result
- Add a fallback: if image decoding still fails, construct the UPI string manually using Razorpay's QR code details endpoint (`GET /v1/payments/qr_codes/{qr_code_id}`) which may return additional payment metadata

**No changes needed to:**
- `src/components/doctor/DoctorPaymentCollectionDialog.tsx` — already correctly renders `QRCodeSVG` when `qrContent` is available
- `src/services/razorpayService.ts` — already has `qr_content` in the interface

### Fallback chain (in the edge function)
1. Try decode branded PNG → extract UPI string via jsQR
2. If that fails, fetch QR code details from Razorpay API and try to extract payment metadata  
3. If that also fails, return empty `qr_content` and frontend shows branded image (current behavior, as last resort)

### Expected result
- The edge function successfully decodes the Razorpay branded QR PNG
- Returns the raw UPI string (e.g. `upi://pay?pa=...&pn=...&am=...`) as `qr_content`
- Frontend renders a clean, centered QR code via `QRCodeSVG` with zero branding
- Payment polling and webhook reconciliation continue unchanged

### File to update
- `supabase/functions/generate-payment-qr/index.ts`

