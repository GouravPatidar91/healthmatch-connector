
## Goal

Replace the inline "Download App" section on the landing page with a dedicated, public, shareable download page that promotes the Curezy Android app on Google Play, and surface a Play Store badge in the footer.

Play Store URL: `https://play.google.com/store/apps/details?id=com.curezy.app`

## Changes

### 1. New page: `src/pages/DownloadApp.tsx`

A production-grade, public marketing page (no auth required) that matches the existing Curezy theme (blue primary, slate text, soft gradient background, `modern-card` / `gradient-text` utilities from `index.css`).

Sections:
- **Hero** — "Curezy is now on Google Play", subline, large official Google Play badge button linking to the Play Store URL (opens in new tab, `rel="noopener noreferrer"`), small "Free • Android 7.0+" meta line. Secondary link to Uptodown for users who can't access Play Store.
- **Key features grid** — 6 cards using lucide icons already in the project: AI Symptom Checker, Online Doctor Consultations, Instant Medicine Delivery, 24/7 Emergency Assistance, Medical Records Vault, Secure Payments. Icons + short copy.
- **Why Curezy** — 3–4 trust points (HIPAA-aligned, DPDP Act compliant, verified pharmacies & doctors, India-wide rollout).
- **How it works** — 3 numbered steps (Install → Sign up → Get care).
- **Screenshots strip** — reuse existing `appMockup1-4` assets in a responsive row.
- **FAQ** — 4–5 items (Is it free? Which devices? Data safety? Prescription needed? Support contact) using existing `Accordion` component.
- **Final CTA** — repeats Play Store badge + Uptodown link.
- **SEO via `react-helmet-async`**: per-route title, description, canonical (`/download`), og:* tags, and `MobileApplication` JSON-LD pointing to the Play Store URL.

Play Store badge: use the official Google badge image
`https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png`
wrapped in an `<a target="_blank">`.

### 2. Route + public access — `src/App.tsx`

Add a public route (outside `RequireAuth`) so the link is shareable without login:
```tsx
<Route path="/download" element={<DownloadApp />} />
<Route path="/download-app" element={<Navigate to="/download" replace />} />
```

### 3. Landing page cleanup — `src/pages/Homepage.tsx`

Remove the current "Download the Curezy App" section (Uptodown badge block). Replace its CTA spot with a single compact line/button: "Get the Curezy app" → links to `/download` (internal route, not external). Keeps the landing minimal.

### 4. Footer — `src/components/layout/Footer.tsx`

In the brand column, add an official Google Play badge image next to (above) the existing Uptodown badge, linking directly to the Play Store URL in a new tab. Both badges remain — Play Store primary, Uptodown secondary. Also add a "Download App" link in the Quick Links list pointing to `/download`.

### 5. SEO

- `index.html`: update `MobileApplication` JSON-LD `downloadUrl` / `installUrl` to the Play Store URL (keep Uptodown in `sameAs`). Update sitewide meta description to mention Google Play.
- `public/robots.txt` / `public/sitemap.xml`: ensure `/download` is allowed and listed.
- New page uses `react-helmet-async` for per-route SEO (install if not present).

### 6. Auth

The `/download` route is registered outside `RequireAuth`, so anyone with the link reaches it directly — no login wall, fully shareable for Play Store listing, social posts, QR codes, etc.

## Files touched

- create `src/pages/DownloadApp.tsx`
- edit `src/App.tsx` (add public route + redirect alias)
- edit `src/pages/Homepage.tsx` (remove download section, add small link to `/download`)
- edit `src/components/layout/Footer.tsx` (Play Store badge + Quick Link)
- edit `index.html` (JSON-LD + meta description)
- edit `public/sitemap.xml` (add `/download`)
- edit `src/main.tsx` only if `HelmetProvider` is not yet wrapping the app

## Out of scope

- No backend / DB changes.
- No changes to existing legal pages.
- No changes to authenticated app flows.
