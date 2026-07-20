Add the ElevenLabs Grants logo to the Curezy website per the grant conditions.

## Placement
1. **Landing Footer** — add a "Supported by" block with the ElevenLabs Grants logo so it appears on every landing page and satisfies the linking requirement.
2. **Homepage Trust section** — optionally add a small partner logo lockup near the existing TrustBar for visibility on the main marketing page.

## Logo variant
Use the **light-background** version because the footer and current landing sections are white/light:
```html
<a href="https://elevenlabs.io/startup-grants">
  <img src="https://eleven-public-cdn.elevenlabs.io/payloadcms/pwsc4vchsqt-ElevenLabsGrants.webp" alt="ElevenLabs Grants" style="width:180px" />
</a>
```

## Files to change
- `src/components/landing/LandingFooter.tsx` — add the logo + "Supported by" label in the brand column.
- `src/components/landing/TrustBar.tsx` — add a static partner logo row or replace one marquee slot with the ElevenLabs badge.

## Acceptance criteria
- Logo links to `https://elevenlabs.io/startup-grants`.
- Uses the light-background asset on the white footer.
- Maintains existing spacing and responsive layout.
- Alt text is descriptive for accessibility.