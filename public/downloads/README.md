# Curezy APK Download

Place the Curezy Android APK file here with the **exact** filename:

```
public/downloads/curezy.apk
```

## How to upload via GitHub

1. Open your repo on GitHub.
2. Navigate to the `public/downloads/` folder.
3. Click **Add file → Upload files**.
4. Drag your `curezy.apk` (rename it if needed — must be exactly `curezy.apk`).
5. Commit directly to `main`.

GitHub allows files up to **100 MB** via the web uploader. If your APK is larger, push it from your local machine using `git`:

```bash
git add public/downloads/curezy.apk
git commit -m "Add Curezy APK"
git push
```

The "Download for Android" button on the homepage points to `/downloads/curezy.apk`, so once the file is committed and the site redeploys, the download will work automatically.
