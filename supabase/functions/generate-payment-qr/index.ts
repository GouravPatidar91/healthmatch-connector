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

    // Create Razorpay QR Code (true UPI QR, not a payment link)
    const response = await fetch('https://api.razorpay.com/v1/payments/qr_codes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
      },
      body: JSON.stringify({
        type: 'upi_qr',
        name: `Dr. ${doctor_name || 'Doctor'} - Consultation`,
        usage: 'single_use',
        fixed_amount: true,
        payment_amount: Math.round(amount * 100), // amount in paise
        description: `Consultation fee for ${patient_name || 'Patient'}`,
        customer_id: undefined,
        close_by: Math.floor(Date.now() / 1000) + 1800, // expires in 30 minutes
        notes: {
          appointment_id,
          type: 'clinic_qr_payment',
          doctor_name: doctor_name || '',
          patient_name: patient_name || '',
        },
      }),
    });

    const qrCode = await response.json();

    if (!response.ok) {
      console.error('Razorpay QR Code creation failed:', qrCode);
      throw new Error(qrCode.error?.description || 'Failed to create QR code');
    }

    console.log('Razorpay QR Code created:', qrCode.id);

    // Fetch QR code details to get the raw content/payload
    let qrContent = '';
    try {
      const detailRes = await fetch(`https://api.razorpay.com/v1/payments/qr_codes/${qrCode.id}`, {
        headers: {
          'Authorization': 'Basic ' + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
        },
      });
      const detailData = await detailRes.json();
      // Razorpay returns the raw UPI content in the 'content' field or we can construct it
      qrContent = detailData?.content || '';
      console.log('QR detail fields:', Object.keys(detailData));
    } catch (e) {
      console.error('Failed to fetch QR details:', e);
    }

    // Store the QR code ID on the appointment for webhook reconciliation
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, supabaseKey);

    await supabase
      .from('appointments')
      .update({
        razorpay_order_id: qrCode.id,
        payment_amount: amount,
      })
      .eq('id', appointment_id);

    return new Response(JSON.stringify({
      qr_code_id: qrCode.id,
      image_url: qrCode.image_url,
      qr_content: qrContent,
      amount: qrCode.payment_amount,
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
