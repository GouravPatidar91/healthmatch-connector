
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') || '';
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN') || '';
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER') || '';
const BASE_URL = Deno.env.get('BASE_URL') || 'https://bpflebtklgnivcanhlbp.supabase.co';

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
    // Get the request body
    const { phoneNumber, userId, patientName } = await req.json();

    // Validate inputs
    if (!phoneNumber || !userId) {
      return new Response(
        JSON.stringify({ error: 'Phone number and user ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format the phone number (ensure it has country code)
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+1${phoneNumber}`;

    // Build the TwiML for the call
    const twimlUrl = `${BASE_URL}/functions/v1/call-twiml?patientName=${encodeURIComponent(patientName)}&userId=${encodeURIComponent(userId)}`;

    // Make the API call to Twilio to initiate the call
    const twilioApiUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`;
    const authHeader = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const twilioResponse = await fetch(twilioApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`,
      },
      body: new URLSearchParams({
        To: formattedPhone,
        From: TWILIO_PHONE_NUMBER,
        Url: twimlUrl,
        StatusCallback: `${BASE_URL}/functions/v1/call-status-webhook`,
        StatusCallbackEvent: ['initiated', 'answered', 'completed'].join(' '),
        StatusCallbackMethod: 'POST',
      }).toString(),
    });

    if (!twilioResponse.ok) {
      const errorData = await twilioResponse.json();
      console.error('Twilio API Error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to initiate call', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const callData = await twilioResponse.json();

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        callSid: callData.sid, 
        status: callData.status 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in emergency call function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
