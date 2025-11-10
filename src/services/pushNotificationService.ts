import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

export class PushNotificationService {
  private static instance: PushNotificationService;

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  async initialize(deliveryPartnerId: string): Promise<void> {
    // Only initialize on native platforms
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications only supported on native platforms');
      return;
    }

    try {
      // Request permission
      const permResult = await PushNotifications.requestPermissions();
      
      if (permResult.receive === 'granted') {
        // Register with Apple / Google to receive push notifications
        await PushNotifications.register();
        console.log('Push notification registration successful');
      } else {
        console.log('Push notification permission denied');
      }

      // Set up event listeners
      this.setupListeners(deliveryPartnerId);
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  private setupListeners(deliveryPartnerId: string): void {
    // On success, we should be able to receive notifications
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push registration success, token:', token.value);
      await this.saveToken(token.value, deliveryPartnerId);
    });

    // Some issue with our setup and push will not work
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration:', error);
    });

    // Show us the notification payload if the app is open on our device
    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('Push notification received:', notification);
        // You can show a local notification or update UI here
      }
    );

    // Method called when tapping on a notification
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification: ActionPerformed) => {
        console.log('Push notification action performed:', notification);
        
        // Handle navigation based on notification data
        const data = notification.notification.data;
        if (data?.orderId) {
          // Navigate to order details
          window.location.href = `/delivery-partner-dashboard?orderId=${data.orderId}`;
        }
      }
    );
  }

  private async saveToken(token: string, deliveryPartnerId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found');
        return;
      }

      const platform = Capacitor.getPlatform();
      
      // Upsert the token
      const { error } = await supabase
        .from('device_tokens')
        .upsert({
          user_id: user.id,
          delivery_partner_id: deliveryPartnerId,
          token: token,
          platform: platform as 'ios' | 'android',
          device_info: {
            appVersion: '1.0.0',
            osVersion: Capacitor.getPlatform()
          },
          is_active: true,
          last_used_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,token'
        });

      if (error) {
        console.error('Error saving device token:', error);
      } else {
        console.log('Device token saved successfully');
      }
    } catch (error) {
      console.error('Error in saveToken:', error);
    }
  }

  async removeToken(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Mark tokens as inactive instead of deleting
      const { error } = await supabase
        .from('device_tokens')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error removing device token:', error);
      }

      // Unregister from push notifications
      if (Capacitor.isNativePlatform()) {
        await PushNotifications.removeAllListeners();
      }
    } catch (error) {
      console.error('Error in removeToken:', error);
    }
  }

  async checkPermissions(): Promise<{ receive: string }> {
    if (!Capacitor.isNativePlatform()) {
      return { receive: 'denied' };
    }
    return await PushNotifications.checkPermissions();
  }
}

export const pushNotificationService = PushNotificationService.getInstance();
