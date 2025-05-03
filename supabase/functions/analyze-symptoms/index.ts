
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symptoms, severity, duration } = await req.json();

    if (!symptoms || symptoms.length === 0) {
      return new Response(
        JSON.stringify({ error: "No symptoms provided" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format the symptoms for the AI
    const symptomsText = symptoms.join(", ");
    const severityInfo = severity ? `The symptoms are ${severity} in severity.` : "";
    const durationInfo = duration ? `The symptoms have been present for ${duration}.` : "";

    // Create the prompt for the AI
    const prompt = `
      As a medical AI assistant, analyze the following symptoms and provide possible conditions:
      
      Symptoms: ${symptomsText}
      ${severityInfo}
      ${durationInfo}
      
      For each potential condition, provide:
      1. Name of the condition
      2. A brief description
      3. Which symptoms match this condition
      4. A confidence score (percentage)
      5. Recommended actions
      
      Return the top 3 most likely conditions in JSON format like this:
      {
        "conditions": [
          {
            "name": "Condition Name",
            "description": "Brief description of the condition",
            "matchedSymptoms": ["symptom1", "symptom2"],
            "matchScore": 85,
            "recommendedActions": ["action1", "action2", "action3"]
          }
        ]
      }
      
      Note: The JSON should be properly formatted and parseable.
    `;

    console.log("Sending request to OpenAI with symptoms:", symptomsText);

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a medical AI assistant that analyzes symptoms and provides possible medical conditions. Always return your response in valid JSON format.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2, // Lower temperature for more deterministic, factual responses
      }),
    });

    const data = await response.json();
    console.log("Received response from OpenAI");
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response from OpenAI");
    }

    const aiResponse = data.choices[0].message.content;
    
    // Extract the JSON from the AI response
    let jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not extract JSON from AI response");
    }
    
    const jsonStr = jsonMatch[0];
    const analysisResult = JSON.parse(jsonStr);

    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in analyze-symptoms function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "An unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
