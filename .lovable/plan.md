# Curezy Landing Page — Knotch-inspired Redesign

## Reference analysis (knotch.framer.ai)

- **Mood**: Deep midnight/cosmic background (near-black navy with subtle starfield + soft radial glows), premium AI-agency feel.
- **Typography**: Tight, oversized sans-serif display (Geist / Inter Tight style), regular white on black, generous line-height, small "New" pill above the headline.
- **Layout**: Full-bleed dark canvas with **rounded-frame inset** (the whole page sits inside a rounded container with a soft border). Centered hero. Section labels ("How it works", "Our solutions", "Case study") as small uppercase eyebrows above big H2.
- **Navigation**: Tiny floating pill nav with just a logo icon centered top.
- **CTAs**: Two pill buttons — solid white ("Book a call") + dark glass ("View services").
- **Cards**: Dark glass cards with subtle white/5 borders, soft inner glow, rounded-2xl to 3xl. Inline mini-UI mockups (chat bubbles, changelog rows, invoice tables, chips).
- **Sections rhythm**: Hero → Marquee logo strip → 3-step "How it works" (numbered step + illustrative card panel) → Solutions grid (bento of feature cards with live mini-mockups) → Case study → CTA → Footer.
- **Motion**: Parallax starfield, fade/slide-in on scroll, subtle looping micro-animations inside cards (typing chips, animated bars, ticking counters), hover lift on cards.

## Curezy adaptation (new pivot)

Keep the pivot: **Curezy — Enterprise Patient Engagement & Care Automation on WhatsApp + Voice.** Rewrite tone to be crisp and confident, agency-grade.

### New page structure (replaces current Homepage sections)

1. **Rounded dark frame wrapper** — whole page inside `rounded-[32px]` inset with cosmic bg + starfield + radial glows.
2. **Floating pill nav** — Curezy logo icon centered; Solutions / Platform / ROI links; "Book Demo" pill on right.
3. **Hero**
  - Small pill: "New · AI Care OS for Clinics"
  - H1: **"We make AI work for your clinic — not against your patients."**
  - Sub: "Curezy automates patient engagement, medication adherence, and follow-ups through WhatsApp & Voice — so your team focuses on care, not chasing."
  - CTAs: white "Book a Demo" + glass "See how it works"
  - Trust chips: HIPAA · DPDP · EMR-ready
4. **Trust marquee** — hospital/clinic/pharmacy/diagnostics/insurer labels scrolling; "Backed by ElevenLabs Grants" preserved.
5. **How it works (3 numbered steps)** — Knotch-style: each step = numbered label + big heading + illustrative dark glass card with live mini-mockup.
  - **Step 1. Listen** — WhatsApp inbox mockup card: incoming patient messages, AI triage tags ("Refill request", "Follow-up", "Query").
  - **Step 2. Engage** — Voice agent mockup: waveform, live transcript bubbles, call outcome chips ("Rescheduled", "Reminded", "Escalated").
  - **Step 3. Recover** — Revenue changelog card in Knotch's updates style: "12 no-shows recovered", "38 refills confirmed", "6 escalations routed".
6. **Solutions bento (AI Care modules)** — 5-card bento grid with mini live UI inside each:
  - Patient Engagement Agent (chat bubbles)
  - Voice Follow-up Agent (waveform + call log)
  - Adherence & Refills (medication timeline chips)
  - Smart Triage & Routing (tag flow)
  - Analytics & ROI (mini bar chart, revenue recovered)
7. **Case study strip** — "How Curezy helped clinics recover ₹X lakh in missed revenue" with 3 image tiles + metric callouts (175+ patients onboarded, 30% no-show reduction, 4hrs/day saved).
8. **Impact stats** (keep current 175+ patients, add 3 more metrics in Knotch style).
9. **Testimonials** — restyled as dark glass cards, 2-3 columns.
10. **Security & Compliance** — dark card row: HIPAA, DPDP, ISO-ready, EMR integration.
11. **FAQ** — accordion in dark glass style.
12. **Final CTA** — big centered dark card: "The future of clinics is continuous care." + waitlist/demo.
13. **Footer** — dark, minimal, Curezy wordmark + links + ElevenLabs Grants badge + Play Store badge.

### Design system changes (`src/index.css`, `tailwind.config.ts`)

- Introduce dark-mode-as-default cosmic palette:
  - `--bg-cosmic: 224 47% 4%` (near-black navy)
  - `--frame: 224 40% 6%`
  - `--surface-glass: 0 0% 100% / 0.04`
  - `--hairline: 0 0% 100% / 0.08`
  - Keep accents: ai-cyan, ai-blue, ai-violet for subtle highlights only (Knotch uses accent very sparingly — mostly white on black + one blue "New" pill).
- Fonts: switch display to **Geist / Inter Tight** (already loaded), body Inter, keep Instrument Serif for optional italic accent.
- New utilities: `.cosmic-bg` (radial + starfield SVG), `.frame-inset` (rounded outer frame), `.glass-dark-card`, `.btn-white-pill`, `.btn-glass-pill`, `.eyebrow` (uppercase tracked label), `.big-display` (h2 clamp 40-72px).
- Starfield: lightweight SVG/CSS background (no heavy JS), plus 2 soft radial glow blobs.

### Motion

- Framer Motion: fade+slide up on section enter (`whileInView`), stagger children in bento.
- Card micro-loops: existing WhatsApp/Voice video loops reused inside Step 1 & Step 2 cards.
- Marquee already exists — reuse for trust bar.
- Hover: `translateY(-4px)` + border glow on cards.

### Files to create

- `src/components/landing/CosmicFrame.tsx` — outer rounded dark wrapper + starfield.
- `src/components/landing/HowItWorks.tsx` — rewrite (3 numbered steps, Knotch layout).
- `src/components/landing/SolutionsBento.tsx` — new bento grid.
- `src/components/landing/CaseStudy.tsx` — new.
- Update `src/components/landing/Hero.tsx` — new copy + Knotch-style centered layout (drop the orb in hero; move a simplified version into Step 2 card).
- Update `src/components/landing/LandingNav.tsx` — icon-only centered pill.
- Update `src/components/landing/TrustBar.tsx`, `Testimonials.tsx`, `SecuritySection.tsx`, `FAQSection.tsx`, `FinalCTA.tsx`, `LandingFooter.tsx` — dark restyle.
- Update `src/pages/Homepage.tsx` — wrap in `CosmicFrame`, new section order.
- Update `src/index.css` + `tailwind.config.ts` — cosmic tokens & utilities.

### Files removed from landing flow (kept in repo, just unmounted)

- `LivingRecord`, `VisionSection`, `HealthTwinOrb` (as hero) — replaced by new sections. Orb repurposed inside Step 2 card at reduced scale.

### Out of scope

- Backend, auth, admin, edge functions untouched.
- Non-landing pages (Dashboard, DownloadApp, legal pages) untouched.

### Content principles

- Every headline crisp, agency tone. No emojis. Numbers where possible ("175+ patients", "30% fewer no-shows", "4 hrs/day saved").
- Preserve existing Curezy claims (HIPAA/DPDP, WhatsApp+Voice, EMR-ready, ElevenLabs backing).

## Deliverable

A single cohesive dark, cosmic, Knotch-styled landing page reflecting Curezy's AI Care OS pivot, ready for demo bookings.