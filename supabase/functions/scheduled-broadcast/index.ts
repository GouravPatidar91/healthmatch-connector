import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
  // Handle CORS preflight
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

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = new Date().getDay();

    let topic: string;
    let tone: string;
    let notificationType: string;

    if (scheduleType === 'morning_health') {
      topic = MORNING_TOPICS[dayOfWeek];
      tone = 'friendly';
      notificationType = 'health_tip';
      console.log(`Morning health notification - Day ${dayOfWeek}, Topic: ${topic}`);
    } else {
      const config = NOON_MARKETING[dayOfWeek];
      topic = config.topic;
      tone = config.tone;
      notificationType = 'marketing';
      console.log(`Noon marketing notification - Day ${dayOfWeek}, Topic: ${topic}, Tone: ${tone}`);
    }

    // Step 1: Generate AI content using the generate-marketing-notification function
    console.log('Generating AI content...');
    const aiResponse = await fetch(`${supabaseUrl}/functions/v1/generate-marketing-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        topic,
        tone,
        includeBranding: true,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI generation failed:', errorText);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const { title, message } = await aiResponse.json();
    console.log('AI generated content:', { title, message });

    // Step 2: Broadcast to all users using the broadcast-notification function
    console.log('Broadcasting to all users...');
    const broadcastResponse = await fetch(`${supabaseUrl}/functions/v1/broadcast-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        title,
        message,
        type: notificationType,
        targetAudience: 'all',
        isAiGenerated: true,
        aiPrompt: `[Scheduled ${scheduleType}] ${topic}`,
      }),
    });

    if (!broadcastResponse.ok) {
      const errorText = await broadcastResponse.text();
      console.error('Broadcast failed:', errorText);
      throw new Error(`Broadcast failed: ${broadcastResponse.status}`);
    }

    const broadcastResult = await broadcastResponse.json();
    console.log('Broadcast result:', broadcastResult);

    return new Response(
      JSON.stringify({
        success: true,
        scheduleType,
        topic,
        tone,
        title,
        message,
        recipientsCount: broadcastResult.recipientsCount,
        broadcastId: broadcastResult.broadcastId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scheduled-broadcast:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
