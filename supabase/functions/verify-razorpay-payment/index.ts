import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function hmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw', encoder.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, appointment_id } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(JSON.stringify({ error: 'Missing required payment fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!RAZORPAY_KEY_SECRET) throw new Error('Razorpay secret not configured');

    // Verify signature using Web Crypto API
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = await hmacSha256(RAZORPAY_KEY_SECRET, body);

    if (expectedSignature !== razorpay_signature) {
      return new Response(JSON.stringify({ error: 'Invalid payment signature' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // If appointment_id is provided, update the appointment and credit doctor wallet
    if (appointment_id) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Get appointment details
      const { data: appointment, error: apptError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointment_id)
        .single();

      if (apptError || !appointment) throw new Error('Appointment not found');

      // Update appointment payment status
      await supabase
        .from('appointments')
        .update({ payment_status: 'paid', razorpay_payment_id })
        .eq('id', appointment_id);

      // Credit doctor wallet
      const doctorId = appointment.doctor_id;
      const amount = appointment.payment_amount || 0;

      if (doctorId && amount > 0) {
        const walletId = await supabase.rpc('get_or_create_wallet', {
          _user_id: doctorId, _owner_type: 'doctor', _owner_id: doctorId,
        });

        if (walletId.data) {
          await supabase.rpc('credit_wallet', {
            _wallet_id: walletId.data, _order_id: null, _amount: amount,
            _description: `Consultation fee - Appointment ${appointment_id.substring(0, 8)}`,
            _category: 'consultation_fee',
          });
        }
      }
    }

    // Payment signature verified successfully
    return new Response(JSON.stringify({ success: true, verified: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
