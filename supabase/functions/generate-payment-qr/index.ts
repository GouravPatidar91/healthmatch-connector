import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import jsQR from "https://esm.sh/jsqr@1.4.0";
import UPNG from "https://esm.sh/upng-js@2.1.0";

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

    // Create Razorpay QR Code
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
        payment_amount: Math.round(amount * 100),
        description: `Consultation fee for ${patient_name || 'Patient'}`,
        customer_id: undefined,
        close_by: Math.floor(Date.now() / 1000) + 1800,
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

    // Decode the branded QR image to extract raw UPI string
    let qrContent = '';
    try {
      const imgRes = await fetch(qrCode.image_url);
      const imgBuffer = await imgRes.arrayBuffer();
      const decoded = UPNG.decode(imgBuffer);
      const rgba = UPNG.toRGBA8(decoded)[0];
      const pixels = new Uint8ClampedArray(rgba);
      const result = jsQR(pixels, decoded.width, decoded.height);
      if (result && result.data) {
        qrContent = result.data;
        console.log('Decoded QR content:', qrContent.substring(0, 80));
      } else {
        console.log('jsQR could not decode the image');
      }
    } catch (e) {
      console.error('Failed to decode QR image:', e);
    }

    // Store the QR code ID on the appointment
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
