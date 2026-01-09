import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, tone = 'friendly', includeBranding = true } = await req.json();

    if (!topic) {
      return new Response(
        JSON.stringify({ error: 'Topic is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const toneDescriptions: Record<string, string> = {
      friendly: 'warm, friendly, and engaging',
      professional: 'professional and informative',
      urgent: 'urgent and action-oriented',
      casual: 'casual, fun, and playful',
    };

    const brandingInstruction = includeBranding
      ? 'Include subtle Curezy branding (e.g., "Your health partner, Curezy 💙" or "From Curezy with care").'
      : 'Do not include any branding.';

    const prompt = `You are the marketing team for Curezy, a health and wellness app in India.
Create a catchy, engaging push notification about: ${topic}

Requirements:
- Title: Maximum 50 characters, use a relevant emoji at the start
- Message: Maximum 150 characters, ${toneDescriptions[tone] || 'friendly and engaging'}
- ${brandingInstruction}
- Make it action-oriented and create urgency where appropriate
- Keep language simple and accessible
- Must be suitable for all age groups

Return ONLY a valid JSON object with this exact structure:
{
  "title": "Your title here",
  "message": "Your message here"
}

Do not include any other text, markdown, or explanation.`;

    console.log('Generating notification with prompt:', topic);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 200,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('AI response:', content);

    // Parse JSON from response
    let result;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback: Create a default notification
      result = {
        title: `✨ ${topic.slice(0, 40)}...`,
        message: `Check out our latest update on ${topic}. Stay healthy with Curezy! 💙`,
      };
    }

    // Ensure title and message are within limits
    result.title = result.title?.slice(0, 50) || 'Health Update from Curezy';
    result.message = result.message?.slice(0, 150) || 'Check out what\'s new in your health journey!';

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating notification:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate notification',
        title: '💙 Stay Healthy with Curezy',
        message: 'Check out our latest health tips and features. Your wellness journey starts here!',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
