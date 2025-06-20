
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');

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
    const { messages, model = 'llama3-8b-8192', temperature = 0.7, max_tokens = 1000 } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Groq API key not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Making request to Groq API with model:", model);

    // Call Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: temperature,
        max_tokens: max_tokens,
      }),
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      console.error("Groq API error:", errorDetails);
      throw new Error(`Groq API returned error status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Received response from Groq API");
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Unexpected response structure:", JSON.stringify(data));
      throw new Error("Invalid response structure from Groq API");
    }

    return new Response(
      JSON.stringify({
        message: data.choices[0].message.content,
        usage: data.usage,
        model: data.model
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in groq-chat function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unknown error occurred"
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
