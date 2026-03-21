import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, appointment_id, doctor_name, patient_name } = await req.json();

    if (!amount || !appointment_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured');
    }

    const webhookUrl = `${SUPABASE_URL}/functions/v1/razorpay-webhook`;

    // Create Razorpay Payment Link with UPI deep link enabled
    const response = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency: 'INR',
        description: `Consultation fee - Dr. ${doctor_name || 'Doctor'}`,
        customer: {
          name: patient_name || 'Patient',
        },
        upi_link: true,
        notes: {
          appointment_id,
          type: 'clinic_qr_payment',
        },
        callback_url: webhookUrl,
        callback_method: 'get',
      }),
    });

    const paymentLink = await response.json();

    if (!response.ok) {
      console.error('Razorpay payment link creation failed:', paymentLink);
      throw new Error(paymentLink.error?.description || 'Failed to create payment link');
    }

    // Store the payment link ID for webhook reference
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, supabaseKey);

    await supabase
      .from('appointments')
      .update({ 
        razorpay_order_id: paymentLink.id,
        payment_amount: amount
      })
      .eq('id', appointment_id);

    return new Response(JSON.stringify({
      payment_link_id: paymentLink.id,
      payment_link_url: paymentLink.short_url,
      amount: paymentLink.amount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
