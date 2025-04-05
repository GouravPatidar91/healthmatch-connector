
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.4.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const BASE_URL = Deno.env.get('BASE_URL') || 'https://bpflebtklgnivcanhlbp.supabase.co';

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get query parameters
  const url = new URL(req.url);
  const patientName = url.searchParams.get('patientName') || 'Patient';
  const userId = url.searchParams.get('userId') || '';

  try {
    // Create a new emergency call record in the database
    if (userId) {
      const { error } = await supabase
        .from('emergency_calls')
        .insert({
          user_id: userId,
          patient_name: patientName,
          status: 'initiated',
          symptoms: [],
          address: 'To be collected during call',
        });

      if (error) {
        console.error('Error creating emergency call record:', error);
      }
    }

    // Generate TwiML for the phone call
    const twiml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="Polly.Joanna">
          Hello ${patientName}, this is the HealthMatch emergency medical assistant. We've received your emergency call request.
          I'll be gathering some important information about your medical situation.
        </Say>
        
        <Gather input="speech" timeout="5" action="${BASE_URL}/functions/v1/collect-symptoms" method="POST">
          <Say voice="Polly.Joanna">
            Please describe your symptoms or medical emergency.
          </Say>
        </Gather>
        
        <Say voice="Polly.Joanna">
          I didn't hear anything. Let's try again.
        </Say>
        
        <Redirect>${BASE_URL}/functions/v1/call-twiml?patientName=${encodeURIComponent(patientName)}&amp;userId=${encodeURIComponent(userId)}</Redirect>
      </Response>
    `;

    return new Response(twiml, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/xml' 
      }
    });

  } catch (error) {
    console.error('Error generating TwiML:', error);
    
    // Return a simple TwiML with an error message
    const errorTwiml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="Polly.Joanna">
          I'm sorry, we're experiencing technical difficulties with our emergency system. Please hang up and dial 911 directly if this is a medical emergency.
        </Say>
        <Hangup />
      </Response>
    `;
    
    return new Response(errorTwiml, {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
});
