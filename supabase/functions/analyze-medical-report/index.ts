
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

    if (!file || !fileName) {
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

    console.log(`Analyzing medical report: ${fileName} in ${language}`);

    // Language mapping for better prompts
    const languageInstructions = {
      'simple-english': 'Use very simple English words that anyone can understand. Avoid medical jargon.',
      'spanish': 'Respond in Spanish (Español). Use simple medical terms.',
      'french': 'Respond in French (Français). Use simple medical terms.',
      'hindi': 'Respond in Hindi (हिंदी). Use simple medical terms.',
      'arabic': 'Respond in Arabic (العربية). Use simple medical terms.',
      'chinese': 'Respond in Chinese (中文). Use simple medical terms.',
      'portuguese': 'Respond in Portuguese (Português). Use simple medical terms.',
      'russian': 'Respond in Russian (Русский). Use simple medical terms.',
    };

    const languageInstruction = languageInstructions[language as keyof typeof languageInstructions] || 
                               languageInstructions['simple-english'];

    // Create prompt for medical report analysis
    const prompt = `
    You are a medical report analyzer. ${languageInstruction}
    
    Analyze the medical report content and provide:
    1. A clear summary of what the report shows
    2. Key findings (list 3-5 important points)
    3. Recommendations for the patient (list 3-5 actionable items)
    4. Urgency level (Low/Medium/High)
    
    The report file is: ${fileName} (${fileType})
    
    ${fileType === 'application/pdf' 
      ? `Since this is a PDF file, provide a general analysis framework based on common medical report structures.`
      : `This is an image file that contains medical report content. Please analyze the visual content of the medical report.`
    }
    
    Please respond in JSON format with the following structure:
    {
      "summary": "Clear summary of the report",
      "keyFindings": ["finding1", "finding2", "finding3"],
      "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
      "urgencyLevel": "Low/Medium/High",
      "language": "${language}"
    }
    
    Ensure the JSON is properly formatted without any additional text before or after.
    `;

    console.log('Making request to Gemini API...');

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
          maxOutputTokens: 2048,
          responseMimeType: "application/json"
        }
      };
    } else {
      // For image files, include both text and image
      const base64Data = file.split(',')[1]; // Remove data:image/jpeg;base64, prefix
      
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
          maxOutputTokens: 2048,
          responseMimeType: "application/json"
        }
      };
    }

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
      analysisResult = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      // Fallback to a structured response
      const content = data.candidates[0].content.parts[0].text;
      analysisResult = {
        summary: content,
        keyFindings: ['Analysis completed - please review the summary for key points'],
        recommendations: ['Consult with your healthcare provider for detailed interpretation'],
        urgencyLevel: 'Medium',
        language: language
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
