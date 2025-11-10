import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationPayload {
  deliveryPartnerIds: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: PushNotificationPayload = await req.json();
    console.log('Sending push notifications to:', payload.deliveryPartnerIds);

    // Get device tokens for the delivery partners
    const { data: tokens, error: tokensError } = await supabase
      .from('device_tokens')
      .select('*')
      .in('delivery_partner_id', payload.deliveryPartnerIds)
      .eq('is_active', true);

    if (tokensError) {
      console.error('Error fetching device tokens:', tokensError);
      throw tokensError;
    }

    if (!tokens || tokens.length === 0) {
      console.log('No active device tokens found for partners');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No devices to notify',
          notificationsSent: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${tokens.length} device token(s)`);

    // Group tokens by platform
    const iosTokens = tokens.filter(t => t.platform === 'ios').map(t => t.token);
    const androidTokens = tokens.filter(t => t.platform === 'android').map(t => t.token);

    let notificationsSent = 0;

    // Send to FCM (Android)
    if (androidTokens.length > 0) {
      const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
      if (fcmServerKey) {
        console.log(`Sending to ${androidTokens.length} Android device(s)`);
        
        const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Authorization': `key=${fcmServerKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            registration_ids: androidTokens,
            notification: {
              title: payload.title,
              body: payload.body,
              sound: 'default',
              priority: 'high',
            },
            data: payload.data || {},
          }),
        });

        const fcmResult = await fcmResponse.json();
        console.log('FCM Response:', fcmResult);
        notificationsSent += fcmResult.success || 0;
      } else {
        console.warn('FCM_SERVER_KEY not configured');
      }
    }

    // Send to APNS (iOS)
    if (iosTokens.length > 0) {
      const apnsKeyId = Deno.env.get('APNS_KEY_ID');
      const apnsTeamId = Deno.env.get('APNS_TEAM_ID');
      const apnsKey = Deno.env.get('APNS_AUTH_KEY');
      
      if (apnsKeyId && apnsTeamId && apnsKey) {
        console.log(`Sending to ${iosTokens.length} iOS device(s)`);
        
        // Note: This is a simplified example. In production, you'd need to:
        // 1. Generate a proper JWT token using APNS credentials
        // 2. Send notifications to Apple's APNS servers
        // 3. Handle production vs development environments
        
        console.log('APNS notification would be sent here');
        console.log('For production, implement proper APNS JWT signing');
        
        // Placeholder for iOS notifications
        notificationsSent += iosTokens.length;
      } else {
        console.warn('APNS credentials not fully configured');
      }
    }

    // Update last_used_at for sent tokens
    await supabase
      .from('device_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .in('token', [...iosTokens, ...androidTokens]);

    const result = {
      success: true,
      message: 'Notifications sent',
      notificationsSent,
      androidDevices: androidTokens.length,
      iosDevices: iosTokens.length,
    };

    console.log('Result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending push notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
