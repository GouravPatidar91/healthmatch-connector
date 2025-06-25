
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      symptoms, 
      severity, 
      duration, 
      symptomDetails, 
      previousConditions = [], 
      medications = [], 
      notes 
    } = await req.json();

    console.log('Analyzing symptoms with enhanced AI:', { symptoms, severity, duration });

    // Check for visual symptoms that can benefit from image analysis
    const visualSymptoms = symptomDetails?.filter(symptom => symptom.photo) || [];
    const hasVisualData = visualSymptoms.length > 0;

    let analysisResult;

    if (hasVisualData && GEMINI_API_KEY) {
      console.log('Using Gemini API for visual symptom analysis');
      analysisResult = await analyzeWithGemini({
        symptoms,
        severity,
        duration,
        symptomDetails,
        previousConditions,
        medications,
        notes,
        visualSymptoms
      });
    } else if (GROQ_API_KEY) {
      console.log('Using Groq API for text-based symptom analysis');
      analysisResult = await analyzeWithGroq({
        symptoms,
        severity,
        duration,
        previousConditions,
        medications,
        notes
      });
    } else {
      throw new Error('No AI service available for analysis');
    }

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-symptoms:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to analyze symptoms', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function analyzeWithGemini(data: any) {
  const { symptoms, severity, duration, symptomDetails, previousConditions, medications, notes, visualSymptoms } = data;

  // Enhanced prompt for comprehensive analysis with visual data
  const prompt = `
    You are an expert medical AI assistant specializing in comprehensive symptom analysis with visual diagnostic capabilities.
    
    Analyze the following patient information and provide detailed medical insights:
    
    PATIENT SYMPTOMS: ${symptoms.join(', ')}
    SEVERITY: ${severity || 'Not specified'}
    DURATION: ${duration || 'Not specified'}
    PREVIOUS CONDITIONS: ${previousConditions.join(', ') || 'None reported'}
    CURRENT MEDICATIONS: ${medications.join(', ') || 'None reported'}
    ADDITIONAL NOTES: ${notes || 'None provided'}
    
    ${visualSymptoms.length > 0 ? `
    VISUAL SYMPTOM ANALYSIS:
    The patient has provided ${visualSymptoms.length} photos for the following symptoms: ${visualSymptoms.map(s => s.name).join(', ')}.
    Please analyze these images for visual diagnostic features and correlate with reported symptoms.
    ` : ''}
    
    Provide your analysis in the following JSON format:
    {
      "conditions": [
        {
          "name": "Condition name",
          "matchScore": 85,
          "description": "Detailed explanation of the condition",
          "matchedSymptoms": ["symptom1", "symptom2"],
          "recommendedActions": ["action1", "action2"],
          "seekMedicalAttention": "When to seek immediate care",
          "visualDiagnosticFeatures": ["feature1", "feature2"],
          "photoAnalysisMethod": "How AI analyzed the visual symptoms",
          "medicalHistoryRelevance": "How patient's history affects this diagnosis",
          "medicationConsiderations": "Relevant medication interactions or effects"
        }
      ],
      "comprehensiveAnalysis": true,
      "includedMedicalHistory": ${previousConditions.length > 0},
      "includedMedications": ${medications.length > 0},
      "includedNotes": ${!!notes},
      "visualAnalysisIncluded": ${visualSymptoms.length > 0},
      "urgencyLevel": "low/moderate/high",
      "overallAssessment": "Comprehensive assessment summary",
      "aiInsights": {
        "patternAnalysis": "Deep patterns detected in symptoms and visual data",
        "riskFactors": "Key risk factors identified",
        "recommendations": "AI-powered personalized recommendations"
      }
    }
    
    ANALYSIS GUIDELINES:
    - Use advanced pattern recognition for visual symptoms
    - Consider drug interactions and medical history comprehensively
    - Provide evidence-based differential diagnoses
    - Include confidence scores for each condition
    - Suggest appropriate urgency levels based on symptom combinations
    - For visual symptoms, describe specific diagnostic features observed
    - Correlate visual findings with reported symptoms
    - Consider systemic implications of symptom combinations
    `;

  // Prepare request body with visual data if available
  const parts = [{ text: prompt }];
  
  // Add images to the analysis if available
  visualSymptoms.forEach(symptom => {
    if (symptom.photo && symptom.photo.includes('base64,')) {
      const base64Data = symptom.photo.split('base64,')[1];
      parts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: base64Data
        }
      });
    }
  });

  const requestBody = {
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 4096,
      responseMimeType: "application/json"
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_MEDICAL",
        threshold: "BLOCK_NONE"
      }
    ]
  };

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const result = await response.json();
  
  if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('Invalid Gemini API response');
  }

  return JSON.parse(result.candidates[0].content.parts[0].text);
}

async function analyzeWithGroq(data: any) {
  const { symptoms, severity, duration, previousConditions, medications, notes } = data;

  const prompt = `You are a medical AI assistant. Analyze these symptoms and provide potential conditions with treatment recommendations.

SYMPTOMS: ${symptoms.join(', ')}
SEVERITY: ${severity || 'Not specified'}
DURATION: ${duration || 'Not specified'}  
MEDICAL HISTORY: ${previousConditions.join(', ') || 'None'}
MEDICATIONS: ${medications.join(', ') || 'None'}
NOTES: ${notes || 'None'}

Respond in JSON format with conditions array, each containing: name, matchScore (0-100), description, matchedSymptoms, recommendedActions, and seekMedicalAttention fields.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-70b-versatile',
      messages: [
        { role: 'system', content: 'You are a helpful medical AI assistant that provides symptom analysis.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const result = await response.json();
  const content = result.choices[0].message.content;

  try {
    return JSON.parse(content);
  } catch (parseError) {
    // Fallback if JSON parsing fails
    return {
      conditions: [
        {
          name: "Symptom Analysis Completed",
          matchScore: 75,
          description: content,
          matchedSymptoms: symptoms,
          recommendedActions: ["Consult with a healthcare provider", "Monitor symptoms"],
          seekMedicalAttention: "If symptoms worsen or persist"
        }
      ],
      comprehensiveAnalysis: previousConditions.length > 0 || medications.length > 0 || !!notes,
      urgencyLevel: severity === 'Severe' ? 'high' : severity === 'Moderate' ? 'moderate' : 'low'
    };
  }
}
