import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedMedicine {
  name: string;
  dosage: string;
  form: string;
  quantity: number;
  frequency?: string;
  duration?: string;
  instructions?: string;
  confidence: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { prescription_id, image_url, image_base64 } = await req.json();

    console.log(`Starting OCR for prescription ${prescription_id}`);

    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    // Update status to processing
    await supabase
      .from('prescription_uploads')
      .update({ ocr_status: 'processing' })
      .eq('id', prescription_id);

    // Prepare image data
    let imageData: string;
    let mimeType = 'image/jpeg';
    
    if (image_base64) {
      imageData = image_base64.includes(',') ? image_base64.split(',')[1] : image_base64;
      // Extract mime type from data URL if present
      if (image_base64.includes(',')) {
        const match = image_base64.match(/data:(image\/[^;]+);/);
        if (match) mimeType = match[1];
      }
    } else if (image_url) {
      // Extract bucket path from full URL
      // URL format: https://.../storage/v1/object/public/prescriptions/path/to/file.webp
      const urlParts = image_url.split('/storage/v1/object/public/');
      if (urlParts.length < 2) {
        throw new Error('Invalid storage URL format');
      }
      
      const filePath = urlParts[1];
      console.log('Downloading file from storage:', filePath);
      
      // Use Supabase client to download with authentication
      const { data: fileData, error: downloadError } = await supabase
        .storage
        .from('prescriptions')
        .download(filePath.replace('prescriptions/', ''));
      
      if (downloadError) {
        console.error('Storage download error:', downloadError);
        throw new Error(`Failed to download image: ${downloadError.message}`);
      }
      
      // Detect mime type from file path
      if (filePath.toLowerCase().includes('.webp')) {
        mimeType = 'image/webp';
      } else if (filePath.toLowerCase().includes('.png')) {
        mimeType = 'image/png';
      } else if (filePath.toLowerCase().includes('.jpg') || filePath.toLowerCase().includes('.jpeg')) {
        mimeType = 'image/jpeg';
      }
      
      // Convert Blob to base64
      const imageBlob = await fileData.arrayBuffer();
      const bytes = new Uint8Array(imageBlob);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      imageData = btoa(binary);
      
      console.log('Image downloaded and encoded successfully');
    } else {
      throw new Error('No image data provided');
    }

    const prompt = `
You are an expert pharmacist analyzing a medical prescription image. 
Extract ALL medicines mentioned with their complete details.

IMPORTANT INSTRUCTIONS:
1. Extract the exact medicine name as written (brand or generic)
2. Include dosage strength (e.g., 500mg, 10ml)
3. Specify form (tablet, capsule, syrup, injection, cream, etc.)
4. Extract quantity prescribed (number of tablets/bottles)
5. Note frequency if mentioned (e.g., "twice daily", "3 times a day")
6. Note duration if mentioned (e.g., "7 days", "1 month")
7. Extract any special instructions
8. Handle handwritten text carefully
9. If text is unclear, mark confidence as low
10. For each medicine, provide a confidence score (0.0 to 1.0)

Return ONLY a valid JSON object with this exact structure:
{
  "medicines": [
    {
      "name": "Medicine name exactly as written",
      "dosage": "500mg",
      "form": "tablet",
      "quantity": 10,
      "frequency": "twice daily",
      "duration": "7 days",
      "instructions": "Take after meals",
      "confidence": 0.95
    }
  ],
  "overallConfidence": 0.92,
  "prescriptionType": "typed" or "handwritten" or "mixed",
  "doctorName": "Dr. Name if visible",
  "prescriptionDate": "YYYY-MM-DD if visible",
  "additionalNotes": "Any other relevant information"
}

If no medicines are found, return: {"medicines": [], "overallConfidence": 0, "error": "No medicines detected"}
`;

    console.log('Calling OpenRouter API...');

    const openRouterResponse = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': supabaseUrl,
          'X-Title': 'Medical Prescription OCR'
        },
        body: JSON.stringify({
          model: 'google/gemini-flash-1.5-8b', // Fast and reliable vision model
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${imageData}`
                  }
                }
              ]
            }
          ],
          temperature: 0.1,
          max_tokens: 2000
        })
      }
    );

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error('OpenRouter API error:', errorText);
      throw new Error(`OpenRouter API error: ${openRouterResponse.status}`);
    }

    const openRouterData = await openRouterResponse.json();
    const extractedText = openRouterData.choices[0].message.content;
    
    console.log('Raw OpenRouter response:', extractedText);

    let extractedData: any;
    try {
      // Clean the response if it contains markdown code blocks
      let cleanedText = extractedText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.slice(7);
      }
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.slice(3);
      }
      if (cleanedText.endsWith('```')) {
        cleanedText = cleanedText.slice(0, -3);
      }
      extractedData = JSON.parse(cleanedText.trim());
    } catch (parseError) {
      console.error('Failed to parse OpenRouter response:', parseError);
      throw new Error('Invalid JSON response from OpenRouter');
    }

    if (!extractedData.medicines || !Array.isArray(extractedData.medicines)) {
      throw new Error('Invalid extracted data structure');
    }

    const processingTime = Date.now() - startTime;

    // Match extracted medicines with database
    const matchedMedicines = await matchMedicinesWithDatabase(
      supabase, 
      extractedData.medicines
    );

    // Update prescription with OCR results
    await supabase
      .from('prescription_uploads')
      .update({
        ocr_status: 'completed',
        ocr_extracted_data: extractedData,
        ocr_confidence_score: extractedData.overallConfidence,
        ocr_processed_at: new Date().toISOString(),
        medicines_detected: extractedData.medicines.length
      })
      .eq('id', prescription_id);

    // Log OCR extraction
    await supabase
      .from('prescription_ocr_logs')
      .insert({
        prescription_id,
        raw_text: extractedText,
        extracted_medicines: extractedData.medicines,
        confidence_scores: extractedData.overallConfidence,
        processing_time_ms: processingTime,
        api_provider: 'openrouter'
      });

    console.log(`OCR completed in ${processingTime}ms. Found ${extractedData.medicines.length} medicines`);

    return new Response(
      JSON.stringify({
        success: true,
        extracted_medicines: extractedData.medicines,
        matched_medicines: matchedMedicines,
        overall_confidence: extractedData.overallConfidence,
        processing_time_ms: processingTime,
        prescription_type: extractedData.prescriptionType
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('OCR error:', error);

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function matchMedicinesWithDatabase(
  supabase: any, 
  extractedMedicines: ExtractedMedicine[]
) {
  const matched = [];

  for (const extracted of extractedMedicines) {
    const { data: exactMatch } = await supabase
      .from('medicines')
      .select('*')
      .or(
        `name.ilike.%${extracted.name}%,brand.ilike.%${extracted.name}%,generic_name.ilike.%${extracted.name}%`
      )
      .limit(5);

    if (exactMatch && exactMatch.length > 0) {
      const alternatives = await findAlternatives(
        supabase, 
        exactMatch[0].id,
        exactMatch[0].composition
      );

      matched.push({
        extracted: extracted,
        matches: exactMatch,
        alternatives: alternatives,
        match_confidence: extracted.confidence
      });
    } else {
      matched.push({
        extracted: extracted,
        matches: [],
        alternatives: [],
        match_confidence: 0,
        suggestion: 'Please search manually or contact pharmacy'
      });
    }
  }

  return matched;
}

async function findAlternatives(
  supabase: any, 
  medicineId: string,
  composition: string
) {
  const { data: alternatives } = await supabase
    .from('medicine_alternatives')
    .select(`
      *,
      alternative:medicines!alternative_medicine_id(*)
    `)
    .eq('primary_medicine_id', medicineId)
    .limit(3);

  if (!alternatives || alternatives.length === 0) {
    const { data: compositionMatches } = await supabase
      .from('medicines')
      .select('*')
      .ilike('composition', `%${composition}%`)
      .neq('id', medicineId)
      .order('mrp', { ascending: true })
      .limit(3);

    return compositionMatches || [];
  }

  return alternatives;
}
