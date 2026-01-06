import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recordId, fileContent, fileName, fileType } = await req.json();

    if (!fileContent || !fileType) {
      return new Response(
        JSON.stringify({ error: 'Missing file content or type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[ExtractMedicalRecord] Processing record: ${recordId}, file: ${fileName}`);

    const extractionPrompt = `You are a medical document analyzer. Analyze this medical document (prescription, lab report, diagnosis, etc.) and extract the following information in JSON format:

{
  "conditions": ["list of medical conditions, diseases, or diagnoses mentioned"],
  "medications": ["list of medications with dosages if available, e.g., 'Metformin 500mg', 'Lisinopril 10mg'"],
  "summary": "A brief 2-3 sentence summary of what this document contains and its key findings",
  "doctor_name": "Name of the doctor if mentioned, or null",
  "hospital_name": "Name of the hospital/clinic if mentioned, or null"
}

IMPORTANT:
- Extract ALL conditions and medications mentioned
- For medications, include dosage and frequency if visible
- Keep the summary concise but informative
- Return ONLY the JSON object, no additional text
- If a field cannot be determined, use an empty array for arrays or null for strings`;

    // Determine MIME type for the image
    let mimeType = fileType;
    if (fileType === 'application/pdf') {
      mimeType = 'application/pdf';
    } else if (fileType.startsWith('image/')) {
      mimeType = fileType;
    }

    // Build the message with image content for vision model
    const messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: extractionPrompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${fileContent}`
            }
          }
        ]
      }
    ];

    console.log(`[ExtractMedicalRecord] Calling Lovable AI Gateway with model: google/gemini-2.5-flash`);

    // Call Lovable AI Gateway (uses Gemini 2.5 Flash with vision)
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
        max_tokens: 2048,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ExtractMedicalRecord] Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Usage limit reached. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to analyze document' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await response.json();
    
    if (!aiData.choices || !aiData.choices[0]?.message?.content) {
      console.error('[ExtractMedicalRecord] Invalid AI response:', aiData);
      return new Response(
        JSON.stringify({ error: 'Invalid response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const responseText = aiData.choices[0].message.content;
    console.log('[ExtractMedicalRecord] Raw response:', responseText);

    // Parse JSON from response
    let extractedData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('[ExtractMedicalRecord] JSON parse error:', parseError);
      extractedData = {
        conditions: [],
        medications: [],
        summary: 'Unable to extract detailed information from this document.',
        doctor_name: null,
        hospital_name: null
      };
    }

    console.log('[ExtractMedicalRecord] Extracted data:', extractedData);

    return new Response(
      JSON.stringify({
        success: true,
        recordId,
        conditions: extractedData.conditions || [],
        medications: extractedData.medications || [],
        summary: extractedData.summary || null,
        doctor_name: extractedData.doctor_name || null,
        hospital_name: extractedData.hospital_name || null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ExtractMedicalRecord] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
