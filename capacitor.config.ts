import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.957aa207ce9b40e0bf2723ae05d52508',
  appName: 'healthmatch-connector',
  webDir: 'dist',
  server: {
    url: 'https://957aa207-ce9b-40e0-bf27-23ae05d52508.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
