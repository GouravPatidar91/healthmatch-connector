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
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!RAZORPAY_KEY_SECRET) throw new Error('Razorpay secret not configured');

    // Verify webhook signature
    if (signature) {
      const expectedSignature = hmac('sha256', RAZORPAY_KEY_SECRET, body, 'utf8', 'hex');
      if (expectedSignature !== signature) {
        console.error('Invalid webhook signature');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
      }
    }

    const event = JSON.parse(body);
    console.log('Razorpay webhook event:', event.event);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (event.event === 'payment_link.paid') {
      const paymentLinkId = event.payload?.payment_link?.entity?.id;
      const notes = event.payload?.payment_link?.entity?.notes;
      const appointmentId = notes?.appointment_id;

      if (appointmentId) {
        // Get appointment
        const { data: appointment } = await supabase
          .from('appointments')
          .select('*')
          .eq('id', appointmentId)
          .single();

        if (appointment) {
          // Update payment status
          await supabase
            .from('appointments')
            .update({
              payment_status: 'paid',
              razorpay_payment_id: event.payload?.payment?.entity?.id || paymentLinkId,
            })
            .eq('id', appointmentId);

          // Credit doctor wallet
          const doctorId = appointment.doctor_id;
          const amount = appointment.payment_amount || 0;

          if (doctorId && amount > 0) {
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
                _description: `QR Payment - Appointment ${appointmentId.substring(0, 8)}`,
                _category: 'consultation_fee',
              });
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
});
