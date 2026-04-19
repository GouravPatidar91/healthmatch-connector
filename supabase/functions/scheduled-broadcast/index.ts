import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Morning health topics in Hinglish - rotate by day of week
const MORNING_TOPICS = [
  "week ki shuruaat healthy mindset aur self-care tips ke saath karo",
  "Monday morning mein hydration aur energy boost karne ke tips",
  "Tuesday ke liye healthy breakfast ideas jo din ko productive banaye",
  "midweek stress relief aur mental wellness tips - tension mat lo!",
  "Thursday morning stretching aur light exercise ka routine",
  "weekend health planning aur preventive care ke reminders",
  "Saturday morning wellness rituals aur relaxation tips for family",
];

// Noon marketing topics in Hinglish with varying tones - rotate by day
const NOON_MARKETING = [
  { topic: "Curezy ka AI health check feature use karo, instant health insights lo", tone: "casual" },
  { topic: "verified doctors se appointment book karo easily on Curezy app", tone: "friendly" },
  { topic: "medicines order karo aur 30 minute mein delivery pao - jaldi karo!", tone: "urgent" },
  { topic: "apni health records digitally store karo Curezy pe - safe aur secure", tone: "professional" },
  { topic: "medicine orders pe exclusive discounts aur offers mil rahe hain - miss mat karo!", tone: "casual" },
  { topic: "Curezy ka emergency SOS feature - family ki safety ke liye must-have", tone: "urgent" },
  { topic: "apne paas ke specialist doctors se connect karo aaj hi", tone: "friendly" },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scheduleType } = await req.json();

    if (!scheduleType || !['morning_health', 'noon_marketing'].includes(scheduleType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid scheduleType. Use "morning_health" or "noon_marketing"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const dayOfWeek = new Date().getDay();
    let topic: string;
    let tone: string;
    let notificationType: string;

    if (scheduleType === 'morning_health') {
      topic = MORNING_TOPICS[dayOfWeek];
      tone = 'friendly';
      notificationType = 'health_tip';
    } else {
      const config = NOON_MARKETING[dayOfWeek];
      topic = config.topic;
      tone = config.tone;
      notificationType = 'marketing';
    }
    console.log(`[scheduled-broadcast] ${scheduleType} - Day ${dayOfWeek}, Topic: ${topic}, Tone: ${tone}`);

    // Step 1: Generate AI content
    const aiResponse = await fetch(`${supabaseUrl}/functions/v1/generate-marketing-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({ topic, tone, includeBranding: true }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI generation failed:', errorText);
      throw new Error(`AI generation failed: ${aiResponse.status} ${errorText}`);
    }

    const aiJson = await aiResponse.json();
    const title = aiJson.title;
    const message = aiJson.message;
    if (!title || !message) {
      throw new Error('AI response missing title or message');
    }
    console.log('AI generated content:', { title, message });

    // Step 2: Broadcast directly (avoid extra HTTP hop that can cause gateway 502)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: broadcast, error: broadcastError } = await supabaseAdmin
      .from('admin_broadcast_notifications')
      .insert({
        title,
        message,
        type: notificationType,
        target_audience: 'all',
        is_ai_generated: true,
        ai_prompt: `[Scheduled ${scheduleType}] ${topic}`,
        status: 'sending',
      })
      .select()
      .single();

    if (broadcastError) {
      console.error('Failed to create broadcast record:', broadcastError);
      throw broadcastError;
    }

    const { data: allUsers, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id');

    if (usersError) {
      console.error('Failed to fetch users:', usersError);
      throw usersError;
    }

    const userIds = allUsers?.map((u) => u.id) || [];
    console.log(`Notifying ${userIds.length} users`);

    if (userIds.length > 0) {
      const notifications = userIds.map((userId) => ({
        user_id: userId,
        type: notificationType,
        title,
        message,
        notification_category: notificationType,
        priority: 'normal',
        broadcast_id: broadcast.id,
        metadata: { broadcast_id: broadcast.id, ai_generated: true },
      }));

      const chunkSize = 200;
      for (let i = 0; i < notifications.length; i += chunkSize) {
        const chunk = notifications.slice(i, i + chunkSize);
        const { error: insertError } = await supabaseAdmin
          .from('customer_notifications')
          .insert(chunk);
        if (insertError) {
          console.error('Notification insert error:', insertError);
          throw insertError;
        }
      }
    }

    await supabaseAdmin
      .from('admin_broadcast_notifications')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        recipients_count: userIds.length,
      })
      .eq('id', broadcast.id);

    return new Response(
      JSON.stringify({
        success: true,
        scheduleType,
        topic,
        tone,
        title,
        message,
        recipientsCount: userIds.length,
        broadcastId: broadcast.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scheduled-broadcast:', error);
    return new Response(
      JSON.stringify({ error: error.message || String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
