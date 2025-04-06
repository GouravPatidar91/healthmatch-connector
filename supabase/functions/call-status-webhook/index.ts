
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.4.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS Headers
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
    // Parse form data from Twilio
    const formData = await req.formData();
    const callSid = formData.get('CallSid');
    const callStatus = formData.get('CallStatus');
    
    console.log(`Received status update for call ${callSid}: ${callStatus}`);
    
    // Try to update any emergency calls with this SID
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && callSid && callStatus) {
      try {
        const { data, error } = await supabase
          .from('emergency_calls')
          .update({ 
            status: callStatus.toString(),
            updated_at: new Date().toISOString()
          })
          .eq('twilio_sid', callSid);
          
        if (error) {
          console.error('Error updating call record:', error);
        } else {
          console.log('Updated call record for SID:', callSid);
        }
      } catch (dbError) {
        console.error('Database update error:', dbError);
      }
    }
    
    // Twilio expects a TwiML response
    const twiml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Response></Response>
    `;
    
    return new Response(twiml, {
      headers: { 'Content-Type': 'text/xml' }
    });
    
  } catch (error) {
    console.error('Error in call-status-webhook:', error);
    
    // Still return a valid TwiML response to Twilio
    const errorTwiml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Response></Response>
    `;
    
    return new Response(errorTwiml, {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
});
