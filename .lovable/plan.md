## Objective
Host the Digital Asset Links JSON file on the Curezy website to enable verified Android App Links (deep linking), so shared links open directly in the Curezy Android app instead of a web browser.

## What We're Building
1. The `assetlinks.json` file at `/.well-known/assetlinks.json`
2. Vercel configuration to serve it correctly (bypass SPA rewrite)
3. Companion files for iOS Universal Links (`apple-app-site-association`)
4. Verification that everything is reachable and correctly formatted

## Files to Create

### 1. `public/.well-known/assetlinks.json`
Place the user-provided Digital Asset Links JSON in the `public/` folder so Vite copies it to the build output verbatim.

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.curezy.app",
      "sha256_cert_fingerprints": [
        "3C:CC:30:68:AB:FA:F3:1A:13:68:97:55:79:8A:CB:70:38:BC:42:1D:7A:43:1F:B9:DF:C8:D3:2F:F1:4A:68:ED"
      ]
    }
  }
]
```

### 2. `public/.well-known/apple-app-site-association` (bonus — iOS)
Since we're doing deep linking, adding iOS Universal Links support is trivial and future-proofs the feature for when an iOS app ships.

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.curezy.app",
        "paths": ["*"]
      }
    ]
  }
}
```
> Note: Replace `TEAM_ID` with the actual Apple Developer Team ID when available. Until then, the file is harmless and doesn't break anything.

### 3. Update `vercel.json`
The current `vercel.json` rewrites **all** paths to `index.html`. We must add `headers` for the `.well-known/` directory and ensure these files are served as static assets, not routed through the SPA.

Changes:
- Add `headers` rule for `/.well-known/*` → `Content-Type: application/json` (and `application/pkccs12` for the Apple file)
- Add explicit `routes`/`rewrites` ordering so `/.well-known/` paths are served before the catch-all SPA rewrite
- Keep the existing `robots.txt` and `ads.txt` behavior intact

### 4. Update `index.html` (SEO metadata)
Add a `<link rel="alternate">` tag hinting at the Android app, which helps Google index the app-to-web association:

```html
<link rel="alternate" href="android-app://com.curezy.app/" />
```

## Verification Steps
After deployment:
1. `curl -I https://healthmatch-connector.lovable.app/.well-known/assetlinks.json` → should return `HTTP 200`, `Content-Type: application/json`, no redirect
2. `curl https://healthmatch-connector.lovable.app/.well-known/assetlinks.json | jq` → should return valid JSON matching the fingerprint
3. Google Play Console → `Setup > App integrity > Asset links` → paste the URL and verify it passes
4. Test a deep link on an Android device: `adb shell am start -W -a android.intent.action.VIEW -d "https://healthmatch-connector.lovable.app/doctor/123" com.curezy.app`

## Security Notes
- The SHA256 fingerprint must match the **app signing certificate** (not the upload certificate). Verify in Google Play Console.
- If you rotate signing keys in the future, append the new fingerprint to the `sha256_cert_fingerprints` array — don't replace the old one immediately, as it can break existing installs.
- Do NOT expose debug/developer fingerprints in production.

## Scope
- No changes to React components, routes, or auth logic.
- Only static file hosting + Vercel config + minor HTML metadata.
- No backend code required.

## Out of Scope (but recommended for later)
- Adding AndroidManifest.xml `intent-filter` autoVerify — this is Android-native code, not website code.
- iOS Team ID configuration — blocked until an iOS app exists.
- Deep link routing logic inside the React app — the app currently handles routing client-side, but native deep link paths (e.g., `/doctor/:id`) would need matching `intent-filter` entries in Android.