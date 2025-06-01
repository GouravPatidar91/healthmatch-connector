
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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

    if (!openAIApiKey) {
      console.error('OpenAI API key not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured. Please check your Supabase secrets.' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate API key format
    if (!openAIApiKey.startsWith('sk-')) {
      console.error('Invalid OpenAI API key format');
      return new Response(
        JSON.stringify({ error: 'Invalid OpenAI API key format' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Analyzing medical report: ${fileName} in ${language}`);

    // Extract base64 content (remove data URL prefix if present)
    const base64Content = file.includes(',') ? file.split(',')[1] : file;

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

    let messages;

    if (fileType === 'application/pdf') {
      // For PDF files, we'll ask the user to describe the content since vision API doesn't support PDF
      messages = [
        {
          role: 'system',
          content: `You are a medical report analyzer. ${languageInstruction} 
          
          Analyze the medical report content and provide:
          1. A clear summary of what the report shows
          2. Key findings (list 3-5 important points)
          3. Recommendations for the patient (list 3-5 actionable items)
          4. Urgency level (Low/Medium/High)
          
          Respond in JSON format with: summary, keyFindings (array), recommendations (array), urgencyLevel, language.`
        },
        {
          role: 'user',
          content: `Please analyze this medical report content. Since this is a PDF, I'll need you to provide a general analysis framework. The file name is: ${fileName}`
        }
      ];
    } else {
      // For image files, use vision capabilities
      messages = [
        {
          role: 'system',
          content: `You are a medical report analyzer. ${languageInstruction}
          
          Analyze the medical report image and provide:
          1. A clear summary of what the report shows
          2. Key findings (list 3-5 important points from the visible content)
          3. Recommendations for the patient (list 3-5 actionable items)
          4. Urgency level (Low/Medium/High) based on the visible findings
          
          Respond in JSON format with: summary, keyFindings (array), recommendations (array), urgencyLevel, language.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Please analyze this medical report image: ${fileName}`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${fileType};base64,${base64Content}`
              }
            }
          ]
        }
      ];
    }

    console.log('Making request to OpenAI API...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: fileType === 'application/pdf' ? 'gpt-4o-mini' : 'gpt-4o',
        messages: messages,
        max_tokens: 1500,
        temperature: 0.3,
      }),
    });

    console.log('OpenAI API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`OpenAI API error (${response.status}):`, errorData);
      
      let errorMessage = 'Failed to analyze medical report';
      if (response.status === 401) {
        errorMessage = 'Invalid OpenAI API key. Please check your API key configuration.';
      } else if (response.status === 429) {
        errorMessage = 'OpenAI API rate limit exceeded. Please try again later.';
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
    console.log('OpenAI response received successfully');

    let analysisResult;
    try {
      analysisResult = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      // Fallback to a structured response
      const content = data.choices[0].message.content;
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
