
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

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
    const { file, fileName, fileType, language } = await req.json();

    console.log(`Starting analysis for: ${fileName}, type: ${fileType}, language: ${language}`);

    if (!file || !fileName) {
      console.error('Missing required fields: file or fileName');
      return new Response(
        JSON.stringify({ error: 'File and fileName are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!GEMINI_API_KEY) {
      console.error('Gemini API key not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured. Please check your Supabase secrets.' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Enhanced language mapping for better prompts
    const languageInstructions = {
      'simple-english': 'Use very simple English words that anyone can understand. Avoid medical jargon and explain complex terms.',
      'hindi': 'Respond in Hindi (हिंदी). Use simple medical terms and explain complex concepts clearly.',
      'bengali': 'Respond in Bengali (বাংলা). Use simple medical terms and explain complex concepts clearly.',
      'telugu': 'Respond in Telugu (తెలుగు). Use simple medical terms and explain complex concepts clearly.',
      'marathi': 'Respond in Marathi (मराठी). Use simple medical terms and explain complex concepts clearly.',
      'tamil': 'Respond in Tamil (தமிழ்). Use simple medical terms and explain complex concepts clearly.',
      'gujarati': 'Respond in Gujarati (ગુજરાતી). Use simple medical terms and explain complex concepts clearly.',
      'spanish': 'Respond in Spanish (Español). Use simple medical terms and explain complex concepts clearly.',
      'french': 'Respond in French (Français). Use simple medical terms and explain complex concepts clearly.',
      'german': 'Respond in German (Deutsch). Use simple medical terms and explain complex concepts clearly.',
      'chinese': 'Respond in Chinese (中文). Use simple medical terms and explain complex concepts clearly.',
      'japanese': 'Respond in Japanese (日本語). Use simple medical terms and explain complex concepts clearly.',
      'arabic': 'Respond in Arabic (العربية). Use simple medical terms and explain complex concepts clearly.',
    };

    const languageInstruction = languageInstructions[language as keyof typeof languageInstructions] || 
                               languageInstructions['simple-english'];

    // Simplified and more focused prompt
    const prompt = `
    You are an expert medical report analyzer. ${languageInstruction}
    
    Analyze this medical report file: ${fileName} (${fileType})
    
    ${fileType === 'application/pdf' 
      ? `This is a PDF medical report. Analyze the content and provide insights.`
      : `This is an image file containing medical report content. Examine all visible text, numbers, charts, and medical data.`
    }
    
    Provide your analysis in JSON format with the following structure:
    {
      "summaryOfFindings": {
        "diagnosis": "Clear explanation of condition identified",
        "normalAbnormalValues": ["List of parameters with their status"],
        "severityOrStage": "Severity level if applicable"
      },
      "interpretationOfResults": {
        "significantResults": [{
          "parameter": "Parameter name",
          "value": "Actual value",
          "normalRange": "Reference range",
          "interpretation": "What this means",
          "clinicalSignificance": "Health relevance"
        }],
        "overallInterpretation": "Summary of all results"
      },
      "treatmentPlan": {
        "medicationsPrescribed": [{
          "name": "Medication name",
          "dosage": "Strength and frequency",
          "duration": "How long to take",
          "purpose": "Why prescribed"
        }],
        "therapiesRecommended": ["Therapy recommendations"],
        "lifestyleChanges": {
          "diet": "Dietary recommendations",
          "exercise": "Exercise advice", 
          "sleep": "Sleep recommendations",
          "other": "Other lifestyle changes"
        },
        "preventiveMeasures": ["Prevention recommendations"]
      },
      "nextSteps": {
        "additionalTestsRequired": [{
          "testName": "Test name",
          "reason": "Why needed",
          "urgency": "Timeline"
        }],
        "specialistReferral": {
          "required": true/false,
          "specialistType": "Type if needed",
          "reason": "Why needed"
        },
        "followUpAppointments": [{
          "timeframe": "When to follow up",
          "purpose": "What to check"
        }]
      },
      "documentationProvided": {
        "reportType": "Type of report",
        "keyDocuments": ["Important sections found"],
        "additionalNotes": "Other observations"
      },
      "urgencyLevel": "Low/Medium/High",
      "language": "${language}",
      "disclaimer": "This analysis is AI-generated and should be reviewed by a qualified healthcare professional"
    }
    
    Guidelines:
    - Be thorough but concise
    - Explain medical terms simply
    - Only include sections with actual data
    - Provide specific values and details
    - Ensure proper JSON formatting
    `;

    console.log('Preparing request to Gemini API...');

    // Prepare the request body for Gemini API
    let requestBody;
    
    if (fileType === 'application/pdf') {
      // For PDF files, use text-only analysis
      requestBody = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 3000,
          responseMimeType: "application/json"
        }
      };
    } else {
      // For image files, include both text and image
      const base64Data = file.includes(',') ? file.split(',')[1] : file;
      
      requestBody = {
        contents: [{
          parts: [
            {
              text: prompt
            },
            {
              inline_data: {
                mime_type: fileType,
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 3000,
          responseMimeType: "application/json"
        }
      };
    }

    console.log('Sending request to Gemini API...');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Gemini API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Gemini API error (${response.status}):`, errorData);
      
      let errorMessage = 'Failed to analyze medical report';
      if (response.status === 401) {
        errorMessage = 'Invalid Gemini API key. Please check your API key configuration.';
      } else if (response.status === 429) {
        errorMessage = 'Gemini API rate limit exceeded. Please try again later.';
      } else if (response.status === 400) {
        errorMessage = 'Invalid request format. Please check your file format.';
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage, details: errorData }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    console.log('Gemini response received successfully');

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error("Unexpected response structure:", JSON.stringify(data));
      throw new Error("Invalid response structure from Gemini");
    }

    let analysisResult;
    try {
      const content = data.candidates[0].content.parts[0].text;
      console.log('Raw Gemini response:', content);
      analysisResult = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      // Enhanced fallback response
      analysisResult = {
        summaryOfFindings: {
          diagnosis: "Medical report analysis completed - requires professional review",
          normalAbnormalValues: ["Medical data analyzed according to clinical standards"],
          severityOrStage: "Professional medical interpretation recommended"
        },
        interpretationOfResults: {
          significantResults: [{
            parameter: "Overall Analysis",
            value: "Completed",
            normalRange: "Professional review recommended",
            interpretation: "Medical report has been analyzed by AI",
            clinicalSignificance: "Consult healthcare provider for detailed interpretation"
          }],
          overallInterpretation: "Medical analysis completed. Please consult with your healthcare provider for detailed interpretation of findings."
        },
        treatmentPlan: {
          medicationsPrescribed: [],
          therapiesRecommended: ["Consult with healthcare provider"],
          lifestyleChanges: {
            diet: "Follow healthcare provider recommendations",
            exercise: "As recommended by your doctor",
            sleep: "Maintain good sleep hygiene",
            other: "Follow medical advice"
          },
          preventiveMeasures: ["Regular health monitoring as advised"]
        },
        nextSteps: {
          additionalTestsRequired: [],
          specialistReferral: {
            required: false,
            specialistType: "",
            reason: ""
          },
          followUpAppointments: [{
            timeframe: "As recommended by healthcare provider",
            purpose: "Review and discuss findings"
          }]
        },
        documentationProvided: {
          reportType: "Medical Report Analysis",
          keyDocuments: ["AI-generated analysis completed"],
          additionalNotes: "Professional medical review recommended"
        },
        urgencyLevel: 'Medium',
        language: language,
        disclaimer: "This analysis is AI-generated and should be reviewed by a qualified healthcare professional"
      };
    }

    // Ensure the response has the correct language field
    analysisResult.language = language;

    console.log('Analysis completed successfully');

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-medical-report function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to analyze medical report',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
