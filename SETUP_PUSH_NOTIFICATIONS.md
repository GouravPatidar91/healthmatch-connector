# 📱 Native Push Notifications Setup Guide

Your app now has native push notifications configured! Follow these steps to build and deploy the mobile app.

## 🚀 Quick Start

### 1. Transfer Project to GitHub
Click the **"Export to GitHub"** button in Lovable to transfer your project to your own repository.

### 2. Clone and Install
```bash
git clone <your-repo-url>
cd <your-project>
npm install
```

### 3. Initialize Capacitor
Capacitor is already configured in `capacitor.config.ts`. Now add the native platforms:

```bash
# For Android
npx cap add android

# For iOS (Mac with Xcode required)
npx cap add ios
```

### 4. Build the Web App
```bash
npm run build
```

### 5. Sync to Native Platforms
```bash
npx cap sync
```

---

## 📱 Android Setup (FCM - Firebase Cloud Messaging)

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Add an Android app:
   - Package name: `app.lovable.957aa207ce9b40e0bf2723ae05d52508`
   - Download `google-services.json`
4. Place `google-services.json` in `android/app/` directory

### Step 2: Get FCM Server Key
1. In Firebase Console → Project Settings → Cloud Messaging
2. Copy the **Server Key**
3. Add to Supabase:
   - Go to: https://supabase.com/dashboard/project/bpflebtklgnivcanhlbp/settings/functions
   - Add secret: `FCM_SERVER_KEY` = your server key

### Step 3: Update Android Config
Edit `android/app/build.gradle` and add:
```gradle
dependencies {
    // Add this line
    implementation 'com.google.firebase:firebase-messaging:23.1.0'
}
```

### Step 4: Run on Android
```bash
npx cap run android
```

---

## 🍎 iOS Setup (APNS - Apple Push Notification Service)

### Step 1: Apple Developer Account
- You need an active [Apple Developer Account](https://developer.apple.com/) ($99/year)

### Step 2: Create Push Notification Certificate
1. Go to [Apple Developer Certificates](https://developer.apple.com/account/resources/certificates/list)
2. Create a new Certificate → Apple Push Notification service SSL
3. Download the certificate and convert to `.p8` format

### Step 3: Get APNS Credentials
1. Create an **APNs Auth Key**:
   - Go to Keys in Apple Developer Portal
   - Create new key with Push Notifications enabled
   - Download the `.p8` file
   - Note the **Key ID** and **Team ID**

2. Add to Supabase:
   - Go to: https://supabase.com/dashboard/project/bpflebtklgnivcanhlbp/settings/functions
   - Add secrets:
     - `APNS_KEY_ID` = Your Key ID
     - `APNS_TEAM_ID` = Your Team ID
     - `APNS_AUTH_KEY` = Contents of your .p8 file

### Step 4: Configure Xcode
1. Open project in Xcode:
   ```bash
   npx cap open ios
   ```
2. Select your project in the navigator
3. Go to "Signing & Capabilities"
4. Add capability: "Push Notifications"
5. Enable "Background Modes" → Check "Remote notifications"

### Step 5: Run on iOS
```bash
npx cap run ios
```

---

## 🔔 Testing Push Notifications

### Test on Physical Device
1. **Android**: 
   - Connect device via USB
   - Enable USB debugging
   - Run: `npx cap run android --target=<device-id>`

2. **iOS**: 
   - Connect iPhone via USB (Mac only)
   - Trust device in Xcode
   - Run: `npx cap run ios --target=<device-name>`

### Test Notification Flow
1. Log in as a delivery partner
2. Grant notification permissions when prompted
3. Have a vendor mark an order as "Order Packed"
4. You should receive a push notification instantly!

---

## 🔧 Development vs Production

### Development Mode
- Uses the current hot-reload URL in `capacitor.config.ts`
- Changes reflect immediately without rebuilding
- Perfect for testing

### Production Mode
To switch to production:

1. Update `capacitor.config.ts`:
```typescript
const config: CapacitorConfig = {
  appId: 'app.lovable.957aa207ce9b40e0bf2723ae05d52508',
  appName: 'healthmatch-connector',
  webDir: 'dist',
  // Remove or comment out the server section:
  // server: {
  //   url: '...',
  //   cleartext: true
  // }
};
```

2. Rebuild and sync:
```bash
npm run build
npx cap sync
npx cap run android  # or ios
```

---

## 📋 Checklist

- [ ] Project transferred to GitHub
- [ ] Dependencies installed (`npm install`)
- [ ] Native platforms added (`npx cap add android/ios`)
- [ ] Firebase project created (Android)
- [ ] `google-services.json` added to `android/app/`
- [ ] FCM Server Key added to Supabase
- [ ] Apple Developer account active (iOS)
- [ ] APNS credentials added to Supabase
- [ ] Push Notifications capability added in Xcode
- [ ] App built (`npm run build`)
- [ ] Synced to native (`npx cap sync`)
- [ ] Tested on physical device

---

## 🆘 Troubleshooting

### Notifications Not Arriving

1. **Check device token registration**:
   - Look for "Push registration success" in device logs
   - Verify token is saved in `device_tokens` table

2. **Check FCM/APNS credentials**:
   - Verify all secrets are set correctly in Supabase
   - Test with a simple notification first

3. **Check permissions**:
   - Ensure app has notification permissions enabled
   - On iOS, check Settings → Notifications → Your App

4. **Check edge function logs**:
   - Go to: https://supabase.com/dashboard/project/bpflebtklgnivcanhlbp/functions/send-push-notification/logs
   - Look for errors in sending notifications

### Build Errors

- **Android**: Make sure Android Studio is installed
- **iOS**: Make sure Xcode is installed (Mac only)
- **General**: Run `npx cap doctor` to check for issues

---

## 📚 Additional Resources

- [Capacitor Push Notifications Docs](https://capacitorjs.com/docs/apis/push-notifications)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Apple Push Notification Service](https://developer.apple.com/documentation/usernotifications)
- [Capacitor iOS Setup](https://capacitorjs.com/docs/ios)
- [Capacitor Android Setup](https://capacitorjs.com/docs/android)

---

## 🎉 Success!

Once configured, delivery partners will receive instant push notifications whenever:
- A new order is ready for pickup
- The system retries with an expanded search radius
- Any order is assigned to them

The notifications work even when the app is completely closed! 🚀
