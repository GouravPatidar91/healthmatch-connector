import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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
    // Validate JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Verify user with anon client
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const userId = claimsData.claims.sub;

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      appointment_data,
    } = await req.json();

    // Validate required payment fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(JSON.stringify({ error: 'Missing payment verification fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!appointment_data) {
      return new Response(JSON.stringify({ error: 'Missing appointment data' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify Razorpay signature
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!RAZORPAY_KEY_SECRET) throw new Error('Razorpay secret not configured');

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = await hmacSha256(RAZORPAY_KEY_SECRET, body);

    if (expectedSignature !== razorpay_signature) {
      return new Response(JSON.stringify({ error: 'Invalid payment signature' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Payment verified — create appointment using service role (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: appointment, error: insertError } = await supabase
      .from('appointments')
      .insert([{
        user_id: userId,
        doctor_id: appointment_data.doctor_id,
        doctor_name: appointment_data.doctor_name,
        doctor_specialty: appointment_data.doctor_specialty || null,
        date: appointment_data.date,
        time: appointment_data.time,
        reason: appointment_data.reason || null,
        notes: appointment_data.notes || null,
        status: 'pending',
        payment_mode: 'online',
        payment_status: 'paid',
        payment_amount: appointment_data.payment_amount || 0,
        razorpay_order_id,
        razorpay_payment_id,
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert appointment:', insertError);
      throw new Error('Failed to create appointment after payment');
    }

    // Credit doctor wallet
    const doctorId = appointment_data.doctor_id;
    const amount = appointment_data.payment_amount || 0;

    if (doctorId && amount > 0) {
      const walletId = await supabase.rpc('get_or_create_wallet', {
        _user_id: doctorId, _owner_type: 'doctor', _owner_id: doctorId,
      });

      if (walletId.data) {
        await supabase.rpc('credit_wallet', {
          _wallet_id: walletId.data, _order_id: null, _amount: amount,
          _description: `Consultation fee - Appointment ${appointment.id.substring(0, 8)}`,
          _category: 'consultation_fee',
        });
      }
    }

    return new Response(JSON.stringify({ success: true, appointment }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
