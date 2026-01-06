import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

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

    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured');
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

    // Determine MIME type for Gemini
    let mimeType = fileType;
    if (fileType === 'application/pdf') {
      mimeType = 'application/pdf';
    } else if (fileType.startsWith('image/')) {
      mimeType = fileType;
    }

    const requestBody = {
      contents: [
        {
          parts: [
            { text: extractionPrompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: fileContent
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    };

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('[ExtractMedicalRecord] Gemini API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to analyze document' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();
    
    if (!geminiData.candidates || !geminiData.candidates[0]?.content?.parts?.[0]?.text) {
      console.error('[ExtractMedicalRecord] Invalid Gemini response:', geminiData);
      return new Response(
        JSON.stringify({ error: 'Invalid response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const responseText = geminiData.candidates[0].content.parts[0].text;
    console.log('[ExtractMedicalRecord] Raw response:', responseText);

    // Parse JSON from response
    let extractedData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('[ExtractMedicalRecord] JSON parse error:', parseError);
      // Return default structure if parsing fails
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
