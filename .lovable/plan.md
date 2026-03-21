

## Plan: Show Clean QR Code Without Razorpay Branding

### Problem
The Razorpay QR Codes API returns a branded `image_url` with logos, text ("Powered by Razorpay", "BHIM UPI", GPay/PhonePe logos, business name). The user wants just the raw QR code square, like Rapido.

### Approach
Use CSS cropping on the Razorpay image to isolate the QR code portion, hiding the branding above and below. The Razorpay QR image has a consistent layout where the actual QR pattern sits in the center ~55-60% of the image. We'll use `overflow: hidden` with `object-fit: none` and `object-position` to show only the QR square.

### File to modify

**`src/components/doctor/DoctorPaymentCollectionDialog.tsx`** (lines 126-133)

Replace the current `<img>` rendering with a cropped container:
- Outer `div` with fixed dimensions and `overflow: hidden`
- Inner `img` using `object-fit: none` and `object-position: center 38%` to crop out the top branding ("Powered by Razorpay", BHIM UPI) and bottom branding (GPay/PhonePe logos, business name)
- Show only the clean QR pattern
- Keep the same white background and rounded border styling

This requires no new dependencies and no backend changes.

