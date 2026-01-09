import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    console.log('Generating daily notifications for:', today);

    const notifications: Array<{
      user_id: string;
      type: string;
      title: string;
      message: string;
      notification_category: string;
      priority: string;
      metadata: Record<string, any>;
    }> = [];

    // 1. Appointment Reminders - Today's appointments
    const { data: todayAppointments, error: aptError } = await supabase
      .from('appointments')
      .select('id, user_id, doctor_name, date, time, status')
      .eq('date', today)
      .in('status', ['confirmed', 'pending']);

    if (aptError) {
      console.error('Error fetching appointments:', aptError);
    } else if (todayAppointments && todayAppointments.length > 0) {
      console.log(`Found ${todayAppointments.length} appointments today`);
      
      for (const apt of todayAppointments) {
        // Check if notification already sent today
        const { data: existing } = await supabase
          .from('customer_notifications')
          .select('id')
          .eq('user_id', apt.user_id)
          .eq('type', 'appointment_reminder')
          .eq('metadata->>appointment_id', apt.id)
          .gte('created_at', today)
          .maybeSingle();

        if (!existing) {
          notifications.push({
            user_id: apt.user_id,
            type: 'appointment_reminder',
            title: '📅 Appointment Today!',
            message: `Your appointment with ${apt.doctor_name} is today at ${apt.time}. Don't forget!`,
            notification_category: 'appointment',
            priority: 'high',
            metadata: { appointment_id: apt.id, doctor_name: apt.doctor_name },
          });
        }
      }
    }

    // 2. Health Check Alerts - Recent severe health checks
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: recentHealthChecks, error: hcError } = await supabase
      .from('health_checks')
      .select('id, user_id, severity, urgency_level, symptoms, created_at')
      .gte('created_at', threeDaysAgo.toISOString())
      .or('severity.eq.severe,urgency_level.eq.high,urgency_level.eq.urgent');

    if (hcError) {
      console.error('Error fetching health checks:', hcError);
    } else if (recentHealthChecks && recentHealthChecks.length > 0) {
      console.log(`Found ${recentHealthChecks.length} urgent health checks`);

      for (const hc of recentHealthChecks) {
        // Check if alert already sent for this health check
        const { data: existing } = await supabase
          .from('customer_notifications')
          .select('id')
          .eq('user_id', hc.user_id)
          .eq('type', 'health_alert')
          .eq('metadata->>health_check_id', hc.id)
          .maybeSingle();

        if (!existing) {
          // Check if user has booked an appointment since this health check
          const { data: recentApt } = await supabase
            .from('appointments')
            .select('id')
            .eq('user_id', hc.user_id)
            .gte('created_at', hc.created_at)
            .maybeSingle();

          if (!recentApt) {
            notifications.push({
              user_id: hc.user_id,
              type: 'health_alert',
              title: '⚠️ Health Check Follow-up',
              message: 'Your recent health check indicates attention needed. Consider booking an appointment.',
              notification_category: 'health',
              priority: 'high',
              metadata: { health_check_id: hc.id, severity: hc.severity },
            });
          }
        }
      }
    }

    // 3. Weekly Health Tips (for active users)
    const dayOfWeek = now.getDay();
    if (dayOfWeek === 1) { // Monday
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: activeUsers } = await supabase
        .from('health_checks')
        .select('user_id')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const uniqueUserIds = [...new Set(activeUsers?.map(u => u.user_id) || [])];

      const healthTips = [
        { title: '💧 Stay Hydrated!', message: 'Drink at least 8 glasses of water today. Your body will thank you!' },
        { title: '🚶 Move Your Body', message: 'A 15-minute walk can boost your mood and energy. Take a break!' },
        { title: '😴 Sleep Matters', message: 'Aim for 7-8 hours of sleep tonight. Good rest = good health!' },
        { title: '🍎 Eat Your Greens', message: 'Add an extra serving of vegetables to your meals today!' },
        { title: '🧘 Breathe Deep', message: 'Take 5 deep breaths right now. Stress relief in seconds!' },
      ];

      const tipIndex = Math.floor(Math.random() * healthTips.length);
      const selectedTip = healthTips[tipIndex];

      for (const userId of uniqueUserIds.slice(0, 100)) { // Limit to 100 users per batch
        notifications.push({
          user_id: userId,
          type: 'health_tip',
          title: selectedTip.title,
          message: `${selectedTip.message} - Your health partner, Curezy 💙`,
          notification_category: 'health',
          priority: 'normal',
          metadata: { tip_index: tipIndex, week: Math.floor(Date.now() / 604800000) },
        });
      }
    }

    // Insert all notifications
    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from('customer_notifications')
        .insert(notifications);

      if (insertError) {
        console.error('Error inserting notifications:', insertError);
        throw insertError;
      }

      console.log(`Successfully created ${notifications.length} notifications`);
    } else {
      console.log('No notifications to create');
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationsCreated: notifications.length,
        breakdown: {
          appointments: notifications.filter(n => n.type === 'appointment_reminder').length,
          healthAlerts: notifications.filter(n => n.type === 'health_alert').length,
          healthTips: notifications.filter(n => n.type === 'health_tip').length,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-daily-notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
