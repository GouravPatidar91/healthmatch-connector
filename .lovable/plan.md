# Account Deletion Request Page (Play Store Compliance)

Google Play requires a **public URL** (no login required) where users can request deletion of their Curezy account and associated data. The page must clearly state: app name, deletion steps, what data is deleted vs. retained, and retention period.

## What I'll Build

### 1. New page: `src/pages/DeleteAccount.tsx`
A public, mobile-friendly page (Curezy branding, plain text — no logo) containing:

- **Heading**: "Delete Your Curezy Account"
- **Intro**: Explains this page lets Curezy app users request deletion of their account and associated data.
- **Two request methods** (users can pick either):
  1. **In-app**: Settings → Account → Delete Account (instructions for logged-in users)
  2. **Email request form** on this page — for users who can't access the app
- **Request form** with zod validation:
  - Full name (required, max 100)
  - Registered email (required, valid email)
  - Registered phone (optional, 10 digits)
  - Reason (optional textarea, max 500)
  - Confirmation checkbox: "I understand this will permanently delete my account"
  - Submit button → opens user's email client with a pre-filled mail to `admin@curezy.in` (subject: "Account Deletion Request – Curezy", body: form contents). Fallback: shows the email address to copy.
- **What gets deleted** (clear list):
  - Profile (name, phone, address, DOB, health profile)
  - Appointment history & prescriptions uploaded
  - Cart, orders, wallet balance (after settlement)
  - Saved medical records & AI symptom check history
  - Authentication credentials
- **What is retained & why** (legal/regulatory):
  - Order invoices & payment records — **retained 7 years** (Indian tax/GST law)
  - Anonymized prescription data (vendor compliance) — retained as required by Drugs & Cosmetics Act
  - Aggregated anonymous analytics — retained indefinitely (no PII)
- **Timeline**: Requests processed within **7 business days**; full deletion completed within **30 days**.
- **Contact**: admin@curezy.in · +91-9165043258 · Curezy LLP, Indore, MP

### 2. Routing
- Add route `/delete-account` in `src/App.tsx` (public — outside `RequireAuth`).
- Add footer link "Delete Account" in `src/components/layout/Footer.tsx` so it's discoverable and indexable.

### 3. SEO
- Add `<title>` and meta description via a small head update inside the page (using a `useEffect` to set `document.title`), so Google indexes it as "Delete Your Curezy Account".

## URL to submit to Play Console
After deploy, paste this into Play Console → "Delete account URL":
```
https://healthmatch-connector.lovable.app/delete-account
```
(Or your custom domain once attached.)

## Files Touched
- **New**: `src/pages/DeleteAccount.tsx`
- **Edit**: `src/App.tsx` (add public route)
- **Edit**: `src/components/layout/Footer.tsx` (add link)

No database changes, no backend — requests come in via email, which keeps it simple and Play-compliant.
