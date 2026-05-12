## Goal

Replace the current mobile-app section on the landing page (text + bullets + sliding mockup carousel + APK link) with a clean, minimalist section that uses the official Uptodown media-kit badge linking to `https://curezy.en.uptodown.com/android`. Add the same badge to the global footer. Update SEO so the Curezy app download surfaces on Google when users search "Curezy".

---

### 1. Landing page — replace `DownloadApp` section (`src/pages/Homepage.tsx`)

Remove:
- Mockup imports (`appMockup1..4`) and `MockupCarousel` usage
- Two-column grid, headline, bullet list, custom APK button, Android version note
- The `APK_DOWNLOAD_URL` constant (no longer used)

Replace with a clean, minimalist centered section:

```text
┌─────────────────────────────────────────┐
│           Available on Android          │   ← small uppercase eyebrow
│                                         │
│        Download the Curezy App          │   ← single bold headline
│   AI symptom checks, doctor visits,     │   ← one short subline
│   medicines, and SOS — in your pocket.  │
│                                         │
│        [ Uptodown download badge ]      │   ← official media-kit image, links to Uptodown
│                                         │
└─────────────────────────────────────────┘
```

Markup outline:

```tsx
<section id="download-app" className="py-24 bg-white border-y border-gray-100">
  <div className="max-w-3xl mx-auto px-6 text-center">
    <p className="text-xs font-semibold tracking-[0.2em] text-blue-600 uppercase mb-4">
      Available on Android
    </p>
    <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-5">
      Download the Curezy App
    </h2>
    <p className="text-gray-600 text-lg mb-10">
      AI symptom checks, doctor consultations, medicine delivery, and 24/7
      emergency support — right in your pocket.
    </p>
    <a
      href="https://curezy.en.uptodown.com/android"
      title="Download Curezy"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block transition-transform hover:scale-105"
    >
      <img
        src="https://stc.utdstc.com/img/mediakit/download-gio-big-b.png"
        alt="Download Curezy on Uptodown"
        loading="lazy"
        className="h-16 w-auto mx-auto"
      />
    </a>
  </div>
</section>
```

Also remove the now-unused `Smartphone`, `CheckCircle2`, `Download` icon imports and the mockup `<img>` preloading code if it's no longer referenced.

The mockup PNG asset files (`src/assets/app-mockup-1..4.png`) will be left in place to keep the change minimal; they can be deleted later if desired.

---

### 2. Global footer — `src/components/layout/Footer.tsx`

Add the Uptodown badge in the brand column (under the HIPAA badge):

```tsx
<a
  href="https://curezy.en.uptodown.com/android"
  title="Download Curezy"
  target="_blank"
  rel="noopener noreferrer"
  className="inline-block mt-3"
>
  <img
    src="https://stc.utdstc.com/img/mediakit/download-gio-big-b.png"
    alt="Download Curezy on Uptodown"
    loading="lazy"
    className="h-12 w-auto"
  />
</a>
```

---

### 3. SEO — `index.html`

Update the `MobileApplication` JSON-LD so Google can surface the download in search results pointing to the live Uptodown listing (the GitHub releases URL is replaced):

- `downloadUrl` → `https://curezy.en.uptodown.com/android`
- `installUrl` → `https://curezy.en.uptodown.com/android`
- `url` → `https://curezy.en.uptodown.com/android`
- Add `"sameAs": ["https://curezy.en.uptodown.com/android"]` to the existing `Organization` schema so Google links the brand entity to the Uptodown listing.
- Keep `Offer` (free) and `AggregateRating` so a rich download chip is eligible.

Also tighten the discoverable copy:
- `<meta name="description">` → include "Download the Curezy Android app" so Google has a download-oriented snippet for brand searches.
- Add `<meta name="keywords" content="Curezy, Curezy app, Curezy download, Curezy Android, AI doctor app">` (low SEO weight but harmless for brand queries).
- Add an `og:url` pointing to the canonical site URL.

No code or routing changes beyond these three files.

---

### Files to change

- `src/pages/Homepage.tsx` — replace `DownloadApp` section, drop unused imports/constants
- `src/components/layout/Footer.tsx` — add Uptodown badge in brand column
- `index.html` — update `MobileApplication` JSON-LD URLs, add Uptodown to `Organization.sameAs`, tighten meta description

### Out of scope

- Deleting the mockup PNG assets
- Changes to other pages or routing
- Any backend/Supabase changes
