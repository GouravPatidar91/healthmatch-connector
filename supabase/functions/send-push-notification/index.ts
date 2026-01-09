import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationRequest {
  user_id?: string;
  user_ids?: string[];
  title: string;
  message: string;
  data?: Record<string, any>;
  icon?: string;
  click_action?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const fcmServerKey = Deno.env.get('FIREBASE_SERVER_KEY');
    
    if (!fcmServerKey) {
      console.warn('Firebase server key not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Push notifications not configured. Add FIREBASE_SERVER_KEY to enable.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { user_id, user_ids, title, message, data, icon, click_action }: PushNotificationRequest = await req.json();

    // Determine target user IDs
    const targetUserIds = user_ids || (user_id ? [user_id] : []);
    
    if (targetUserIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No user IDs provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending push notification to ${targetUserIds.length} users`);

    // Fetch FCM tokens for target users
    const { data: tokens, error: tokenError } = await supabase
      .from('push_notification_tokens')
      .select('fcm_token, user_id')
      .in('user_id', targetUserIds)
      .eq('is_active', true);

    if (tokenError) {
      console.error('Error fetching tokens:', tokenError);
      throw tokenError;
    }

    if (!tokens || tokens.length === 0) {
      console.log('No active push tokens found for target users');
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No active push tokens' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${tokens.length} active tokens`);

    // Send to each token
    let successCount = 0;
    let failedTokens: string[] = [];

    for (const { fcm_token, user_id: tokenUserId } of tokens) {
      try {
        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `key=${fcmServerKey}`,
          },
          body: JSON.stringify({
            to: fcm_token,
            notification: {
              title,
              body: message,
              icon: icon || '/logo.png',
              click_action: click_action || 'https://curezy.app/dashboard',
              badge: '/logo.png',
            },
            data: {
              ...data,
              click_action: click_action || '/dashboard',
            },
            // Android specific
            android: {
              priority: 'high',
              notification: {
                sound: 'default',
                click_action: 'OPEN_APP',
                channel_id: 'curezy_notifications',
              },
            },
            // iOS specific
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                  badge: 1,
                },
              },
            },
          }),
        });

        const result = await response.json();
        
        if (result.success === 1) {
          successCount++;
        } else if (result.results?.[0]?.error) {
          const error = result.results[0].error;
          console.error(`FCM error for token: ${error}`);
          
          // Mark invalid tokens as inactive
          if (['InvalidRegistration', 'NotRegistered', 'MismatchSenderId'].includes(error)) {
            failedTokens.push(fcm_token);
          }
        }
      } catch (error) {
        console.error('Error sending to token:', error);
      }
    }

    // Deactivate failed tokens
    if (failedTokens.length > 0) {
      await supabase
        .from('push_notification_tokens')
        .update({ is_active: false })
        .in('fcm_token', failedTokens);
      
      console.log(`Deactivated ${failedTokens.length} invalid tokens`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        total: tokens.length,
        failed: tokens.length - successCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-push-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
