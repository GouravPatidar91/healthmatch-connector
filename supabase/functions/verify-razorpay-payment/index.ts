import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hmac } from "https://deno.land/x/hmac@v2.0.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, appointment_id } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !appointment_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!RAZORPAY_KEY_SECRET) throw new Error('Razorpay secret not configured');

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = hmac('sha256', RAZORPAY_KEY_SECRET, body, 'utf8', 'hex');

    if (expectedSignature !== razorpay_signature) {
      return new Response(JSON.stringify({ error: 'Invalid payment signature' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get appointment details
    const { data: appointment, error: apptError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointment_id)
      .single();

    if (apptError || !appointment) {
      throw new Error('Appointment not found');
    }

    // Update appointment payment status
    await supabase
      .from('appointments')
      .update({
        payment_status: 'paid',
        razorpay_payment_id,
      })
      .eq('id', appointment_id);

    // Credit doctor wallet
    const doctorId = appointment.doctor_id;
    const amount = appointment.payment_amount || 0;

    if (doctorId && amount > 0) {
      // Get doctor's user_id (doctor_id IS the user_id in doctors table)
      const walletId = await supabase.rpc('get_or_create_wallet', {
        _user_id: doctorId,
        _owner_type: 'doctor',
        _owner_id: doctorId,
      });

      if (walletId.data) {
        await supabase.rpc('credit_wallet', {
          _wallet_id: walletId.data,
          _order_id: null,
          _amount: amount,
          _description: `Consultation fee - Appointment ${appointment_id.substring(0, 8)}`,
          _category: 'consultation_fee',
        });
      }
    }

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
