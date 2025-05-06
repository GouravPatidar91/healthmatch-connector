
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') || "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";

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
    const { symptoms, severity, duration, symptomDetails } = await req.json();

    if (!symptoms || symptoms.length === 0) {
      return new Response(
        JSON.stringify({ error: "No symptoms provided" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format the symptoms for the AI
    const symptomsText = symptoms.join(", ");
    const severityInfo = severity ? `The symptoms are ${severity} in severity.` : "";
    const durationInfo = duration ? `The symptoms have been present for ${duration}.` : "";
    
    // Enhanced photo analysis section
    let photoAnalysisText = "";
    let hasDetailedVisualAnalysis = false;
    let photoAnalysisDetails = {};
    
    if (symptomDetails && symptomDetails.some(s => s.photo)) {
      photoAnalysisText = "\n\nVisual symptoms from uploaded photos include: \n";
      
      // Map photos to their corresponding symptoms for better context
      const eyeSymptoms = symptomDetails.filter(s => s.photo && isEyeSymptom(s.name));
      const skinSymptoms = symptomDetails.filter(s => s.photo && isSkinSymptom(s.name));
      
      // Detailed analysis for eye symptoms
      if (eyeSymptoms.length > 0) {
        hasDetailedVisualAnalysis = true;
        photoAnalysisText += "\nEYE SYMPTOMS WITH PHOTOS:\n";
        photoAnalysisDetails["eyeAnalysis"] = {
          count: eyeSymptoms.length,
          symptoms: eyeSymptoms.map(s => s.name)
        };
        
        eyeSymptoms.forEach(s => {
          photoAnalysisText += `- ${s.name}: Photo provided shows possible eye condition\n`;
        });
        
        photoAnalysisText += "\nFor eye symptoms, analyze the following visual characteristics in detail:\n";
        photoAnalysisText += "1. Redness: Is there visible inflammation or blood vessel dilation in the sclera (white part)?\n";
        photoAnalysisText += "2. Discharge: Is there any visible discharge or crusting around the eye?\n";
        photoAnalysisText += "3. Corneal appearance: Is the cornea clear or cloudy?\n";
        photoAnalysisText += "4. Pupil: Are pupils normal size, dilated, or constricted?\n";
        photoAnalysisText += "5. Eyelid: Is there swelling, drooping, or abnormal positioning?\n";
        photoAnalysisText += "6. Conjunctiva: Is the conjunctiva inflamed, swollen, or discolored?\n";
        photoAnalysisText += "7. Overall appearance: Are there any visible lesions, growths, or structural abnormalities?\n";
      }
      
      // Detailed analysis for skin symptoms
      if (skinSymptoms.length > 0) {
        hasDetailedVisualAnalysis = true;
        photoAnalysisText += "\n\nSKIN SYMPTOMS WITH PHOTOS:\n";
        photoAnalysisDetails["skinAnalysis"] = {
          count: skinSymptoms.length,
          symptoms: skinSymptoms.map(s => s.name)
        };
        
        skinSymptoms.forEach(s => {
          photoAnalysisText += `- ${s.name}: Photo provided shows skin condition\n`;
        });
        
        photoAnalysisText += "\nFor skin symptoms, analyze the following visual characteristics in detail:\n";
        photoAnalysisText += "1. Color: What is the coloration of the affected area (red, brown, purple, etc.)?\n";
        photoAnalysisText += "2. Pattern: Is there a specific pattern or distribution (localized, widespread, linear, circular)?\n";
        photoAnalysisText += "3. Texture: Is the skin raised, flat, rough, scaly, or smooth?\n";
        photoAnalysisText += "4. Borders: Are the borders well-defined or irregular?\n";
        photoAnalysisText += "5. Associated features: Is there visible swelling, blistering, oozing, or crusting?\n";
        photoAnalysisText += "6. Distribution: Where on the body is the condition and how extensive is it?\n";
        photoAnalysisText += "7. Specific lesion type: Identify if these are macules, papules, pustules, plaques, or other lesion types.\n";
      }
      
      // Add info for other symptoms with photos
      const otherSymptoms = symptomDetails.filter(s => s.photo && !isEyeSymptom(s.name) && !isSkinSymptom(s.name));
      if (otherSymptoms.length > 0) {
        photoAnalysisText += "\n\nOTHER SYMPTOMS WITH PHOTOS:\n";
        photoAnalysisDetails["otherAnalysis"] = {
          count: otherSymptoms.length,
          symptoms: otherSymptoms.map(s => s.name)
        };
        
        otherSymptoms.forEach(s => {
          photoAnalysisText += `- ${s.name}: Photo provided for symptom analysis\n`;
        });
      }
      
      photoAnalysisText += "\n\nThe photos show visible symptoms which have been considered in this analysis.";
    }

    // Create the prompt for the AI
    const prompt = `
      As a medical AI assistant specializing in visual diagnosis, analyze the following symptoms and provide possible conditions:
      
      Symptoms: ${symptomsText}
      ${severityInfo}
      ${durationInfo}
      ${photoAnalysisText}
      
      ${hasDetailedVisualAnalysis ? "Pay special attention to the visual symptoms where photos were provided. For eye conditions, examine for redness, discharge, swelling, or abnormal appearance. For skin conditions, look for patterns, coloration, texture, and distribution of the affected areas." : ""}
      
      For each potential condition, provide:
      1. Name of the condition
      2. A detailed description including visual characteristics
      3. Which symptoms match this condition
      4. A confidence score (percentage)
      5. Recommended actions or treatments
      6. When to seek immediate medical attention
      
      ${hasDetailedVisualAnalysis ? "For conditions diagnosed based on photos, explain clearly which visual characteristics led to this diagnosis and include a 'visualDiagnosticFeatures' section listing specific visual markers that support this diagnosis." : ""}
      
      Return the top 3 most likely conditions in JSON format like this:
      {
        "conditions": [
          {
            "name": "Condition Name",
            "description": "Detailed description including visual characteristics and symptoms",
            "matchedSymptoms": ["symptom1", "symptom2"],
            "matchScore": 85,
            "recommendedActions": ["action1", "action2", "action3"],
            "seekMedicalAttention": "When to see a doctor immediately",
            "visualDiagnosticFeatures": ["feature1", "feature2"] // Only for photo-based diagnoses
          }
        ],
        "photoAnalysisMethod": "Description of the visual analysis method used for photos" // Only when photos are analyzed
      }
      
      The JSON should be properly formatted without any non-JSON content before or after.
    `;

    console.log("Sending request to Groq API with symptoms:", symptomsText);
    console.log("Has photo analysis:", hasDetailedVisualAnalysis);
    console.log("Photo analysis details:", JSON.stringify(photoAnalysisDetails));

    // Call Groq API with a structured output format
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { 
            role: 'system', 
            content: 'You are a medical AI assistant specialized in visual diagnosis that analyzes symptoms and provides possible medical conditions. When photos of visual symptoms like eye or skin conditions are provided, perform a detailed analysis of the visual symptoms. Always return your response in valid JSON format with no additional text.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" } // Ensure we get JSON back
      }),
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      console.error("Groq API error:", errorDetails);
      throw new Error(`Groq API returned error status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Received response from Groq:", JSON.stringify(data));
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Unexpected response structure:", JSON.stringify(data));
      throw new Error("Invalid response structure from Groq");
    }

    const aiResponse = data.choices[0].message.content;
    console.log("AI response content:", aiResponse);
    
    try {
      // Parse the JSON response directly
      const analysisResult = JSON.parse(aiResponse);
      
      // Validate that the result has the expected structure
      if (!analysisResult.conditions || !Array.isArray(analysisResult.conditions)) {
        throw new Error("Response missing expected 'conditions' array");
      }
      
      // Add analysis metadata
      if (hasDetailedVisualAnalysis) {
        analysisResult.visualAnalysisIncluded = true;
        analysisResult.photoAnalysisDetails = photoAnalysisDetails;
      }
      
      return new Response(
        JSON.stringify(analysisResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (jsonError) {
      console.error("Error parsing JSON from AI response:", jsonError);
      console.error("AI response was:", aiResponse);
      
      // Attempt to extract JSON from a text response as fallback
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extractedJson = JSON.parse(jsonMatch[0]);
          return new Response(
            JSON.stringify(extractedJson),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (extractError) {
        console.error("Failed to extract JSON:", extractError);
      }
      
      throw new Error("Could not parse valid JSON from AI response");
    }
  } catch (error) {
    console.error("Error in analyze-symptoms function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unknown error occurred",
        fallback: true 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper functions to categorize symptoms
function isEyeSymptom(symptom: string): boolean {
  const eyeSymptoms = [
    "Blurry vision", "Eye redness", "Eye pain", "Dry eyes", 
    "Watery eyes", "Eye discharge", "Light sensitivity", 
    "Double vision", "Eye strain"
  ];
  return eyeSymptoms.includes(symptom);
}

function isSkinSymptom(symptom: string): boolean {
  const skinSymptoms = [
    "Rash", "Itching", "Bruising", "Dryness", 
    "Sores", "Changes in mole"
  ];
  return skinSymptoms.includes(symptom);
}
