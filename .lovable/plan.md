

## Plan: Create Razorpay Verification Pages

Razorpay requires the following pages on your website for payment gateway activation/verification:

1. **Contact Us** — Business contact details, support email, phone, address
2. **Refund & Cancellation Policy** — Clear refund/cancellation terms for orders
3. **Shipping & Delivery Policy** — Delivery timelines, charges, service areas
4. **About Us** — Company overview, mission, what Curezy does

You already have **Privacy Policy** and **Terms of Service** pages, which are also required — no changes needed there.

### What will be created

**4 new pages:**

| Page | Route | Key Content |
|------|-------|-------------|
| Contact Us | `/contact-us` | Email (admin@curezy.in), phone, address, support form placeholder |
| Refund & Cancellation Policy | `/refund-policy` | Order cancellation rules, refund timelines, prescription order policies |
| Shipping & Delivery Policy | `/shipping-policy` | Delivery radius, estimated times, delivery charges (₹30-100), service areas |
| About Us | `/about-us` | Curezy's mission, services (health check, medicine delivery, appointments, emergency), team vision |

**Modified files:**
- `src/App.tsx` — Add 4 new public routes
- `src/components/layout/Footer.tsx` — Add links to all 4 new pages in the Support and Quick Links sections
- `src/pages/Homepage.tsx` — Add footer links to new policy pages

### Design approach
- Same visual style as existing Privacy Policy and Terms of Service pages (Card-based layout, consistent icons, back-to-home link)
- All pages are public (no auth required) as Razorpay reviewers need to access them
- Real Curezy branding and contact info (admin@curezy.in)
- Healthcare-specific policy language appropriate for a medicine delivery platform

