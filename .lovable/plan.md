# Curezy Landing Page Redesign — AI Care Operating System

Complete rewrite of `src/pages/Homepage.tsx` to reposition Curezy from a healthcare marketplace to the "AI Care Operating System" with an AI Health Twin narrative. Existing app routes, auth, dashboards, and download page stay untouched — only the marketing landing at `/` is redesigned.

## Design language (extracted from mykare.ai + Stripe/Linear/Vercel references)

**Palette (light, premium, AI-first):**
- Background: near-white `#FAFBFC` with soft radial gradients
- Text primary: deep navy `#0A1128`
- Text secondary: slate `#5A6478`
- Accent 1 (primary): Cyan `#00D4FF` → gradient to `#0090FF`
- Accent 2: soft violet `#8B7BFF` for AI highlights
- Surfaces: white `#FFFFFF` with `1px` border `#EEF1F5`, glass panels using `backdrop-blur`

**Type:**
- Headings: `Instrument Serif` accents + `Geist`/`Inter Tight` for main display (large, tight tracking, mixed weight — mirrors mykare's split heading where one line goes cyan/gradient)
- Body: `Inter` 15–17px, `text-slate-600`
- Load via Google Fonts in `index.html`

**Motion & effects:**
- Framer Motion for section reveals (fade + subtle y)
- Floating glass cards with parallax
- Animated gradient mesh background in hero
- Health Twin orbit animation (SVG + motion)
- Marquee for provider logos
- Micro-interactions on cards (tilt/hover-glow)
- Smooth-scroll via `scroll-behavior: smooth`

All colors added as HSL semantic tokens in `index.css` + `tailwind.config.ts` (no hard-coded hex in components). New tokens: `--ai-cyan`, `--ai-cyan-glow`, `--ai-violet`, `--navy`, `--surface-glass`, `--gradient-hero`, `--shadow-glass`, `--shadow-elevated`.

## Page structure (single file → composed sections)

New folder `src/components/landing/` housing focused sections:

1. `LandingNav.tsx` — pill nav (Product, How it Works, Why Curezy, Company) + Get Early Access CTA, glassmorphic sticky
2. `Hero.tsx` — "Building the AI Care Operating System for Continuous Healthcare", gradient-blue second line, dual CTA, animated Health Twin orb + floating prescription/report/WhatsApp cards
3. `TrustBar.tsx` — "Backed by / Trusted by" placeholder logo strip
4. `ProblemSection.tsx` — "Healthcare Doesn't End After The Consultation" — 4-step broken-flow illustration → resolves to Curezy circle
5. `SolutionSection.tsx` — "Meet Your AI Health Twin" central orb w/ orbiting nodes (Prescription, Reports, Symptoms, Timeline)
6. `FeaturesGrid.tsx` — 11 bento-grid cards (AI Health Twin, Prescription Intelligence, Pre-Assessment, WhatsApp Follow-ups, Voice AI, Records, Nearby Doctors, Medicine Ordering, Doctor Dashboard, Patient Dashboard, Workflow Automation)
7. `HowItWorks.tsx` — horizontal animated timeline, 6 steps, scroll-driven progress
8. `WhyCurezy.tsx` — Traditional vs Curezy split cards with animated diff highlights
9. `BenefitsSection.tsx` — two columns (Patients / Providers) with iconed lists
10. `ProductScreens.tsx` — iPhone mockups carousel/stack showing Dashboard, OCR, Health Twin, WhatsApp, Voice AI
11. `TechStack.tsx` — enterprise architecture diagram (React Native, Node.js, Supabase, Health Twin Engine, OCR, WhatsApp API, Voice AI, Cloud)
12. `SecuritySection.tsx` — 5 pillars w/ shield iconography, DPDP-aligned copy
13. `VisionSection.tsx` — full-bleed dark navy band, "Creating an AI Health Twin for Every Patient"
14. `FinalCTA.tsx` — "The Future of Healthcare is Continuous" + Book a Demo / Join Waitlist
15. `LandingFooter.tsx` — Company / Product / Resources / Legal columns + socials

`Homepage.tsx` becomes a thin composer rendering these sections in order with a light body background and SEO meta.

## CTAs & routing

- "Get Early Access" / "Join the Waitlist" → scroll to a new inline waitlist form in `FinalCTA` (email capture stored via existing Supabase — a new `waitlist_signups` table can be added later; for now the form posts to console + toast so no schema changes now)
- "Book a Demo" → `mailto:admin@curezy.in?subject=Book%20a%20Demo`
- Existing routes for `/login`, `/download-app`, legal pages remain linked from footer

## SEO / meta

Update `index.html` `<title>` and `<meta description>` to reflect new positioning:
- Title: "Curezy — The AI Care Operating System for Continuous Healthcare"
- Description: "Curezy builds an AI Health Twin for every patient, helping providers deliver personalized, continuous care before, during, and after every consultation."
- Update og:title / og:description to match.

## Files touched

**Edited**
- `src/pages/Homepage.tsx` — full rewrite as composer
- `src/index.css` — add cyan/navy/violet tokens, hero gradient, glass shadow utilities
- `tailwind.config.ts` — extend colors, boxShadow, backgroundImage, keyframes (orbit, float, gradient-shift)
- `index.html` — fonts, new title/description/og tags

**Created** (in `src/components/landing/`)
- `LandingNav.tsx`, `Hero.tsx`, `TrustBar.tsx`, `ProblemSection.tsx`, `SolutionSection.tsx`, `FeaturesGrid.tsx`, `HowItWorks.tsx`, `WhyCurezy.tsx`, `BenefitsSection.tsx`, `ProductScreens.tsx`, `TechStack.tsx`, `SecuritySection.tsx`, `VisionSection.tsx`, `FinalCTA.tsx`, `LandingFooter.tsx`
- `HealthTwinOrb.tsx` — reusable animated SVG orb used in Hero + Solution

**Not touched:** all `/admin-*`, `/marketing-dashboard`, `/doctor-*`, `/vendor-*`, `/delivery-*`, `/download-app`, auth flows, edge functions, DB.

## Out of scope (call out for later)

- Real waitlist backend table + edge function
- Real iPhone mockup screenshots (using stylized SVG frames with placeholder UI initially)
- Lottie files (using Framer Motion + SVG only to keep bundle lean)
- Dark mode toggle for the landing (design is light-first like mykare; dark mode can be added in a follow-up)

Approve to build.
