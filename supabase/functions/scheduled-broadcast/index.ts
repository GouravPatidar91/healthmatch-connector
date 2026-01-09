import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Morning health topics - rotate by day of week
const MORNING_TOPICS = [
  "starting the week with positive health mindset and self-care tips",
  "monday morning hydration and energy boosting tips",
  "healthy breakfast ideas for a productive tuesday",
  "midweek stress relief and mental wellness tips",
  "thursday morning stretching and exercise routine",
  "weekend health planning and preventive care reminders",
  "saturday morning wellness rituals and relaxation tips",
];

// Noon marketing topics with varying tones - rotate by day
const NOON_MARKETING = [
  { topic: "using Curezy's AI health check feature for instant insights", tone: "casual" },
  { topic: "booking verified doctor appointments easily on Curezy", tone: "friendly" },
  { topic: "ordering medicines with fast 30-minute delivery", tone: "urgent" },
  { topic: "storing and tracking health records digitally on Curezy", tone: "professional" },
  { topic: "exclusive discounts and offers on medicine orders", tone: "casual" },
  { topic: "Curezy's emergency SOS features for family safety", tone: "urgent" },
  { topic: "connecting with specialist doctors near you", tone: "friendly" },
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
