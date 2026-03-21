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
    const { qr_code_id, appointment_id } = await req.json();

    if (!qr_code_id || !appointment_id) {
      return new Response(JSON.stringify({ error: 'Missing qr_code_id or appointment_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured');
    }

    const authHeader = 'Basic ' + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

    // Fetch QR code status from Razorpay
    const res = await fetch(`https://api.razorpay.com/v1/payments/qr_codes/${qr_code_id}`, {
      headers: { 'Authorization': authHeader },
    });
    const qrData = await res.json();

    console.log('QR status check:', qr_code_id, 'status:', qrData.status, 'payments_count:', qrData.payments_count_received);

    const isPaid = qrData.status === 'closed' && qrData.payments_count_received > 0;

    if (isPaid) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Check if already processed (idempotency)
      const { data: appointment } = await supabase
        .from('appointments')
        .select('payment_status, doctor_id, payment_amount')
        .eq('id', appointment_id)
        .single();

      if (appointment && appointment.payment_status !== 'paid') {
        // Get payment ID from Razorpay QR payments
        let paymentId = qr_code_id;
        try {
          const paymentsRes = await fetch(
            `https://api.razorpay.com/v1/payments/qr_codes/${qr_code_id}/payments`,
            { headers: { 'Authorization': authHeader } }
          );
          const paymentsData = await paymentsRes.json();
          if (paymentsData.items && paymentsData.items.length > 0) {
            paymentId = paymentsData.items[0].id;
          }
        } catch (e) {
          console.error('Failed to fetch QR payments:', e);
        }

        // Update appointment payment and auto-complete
        await supabase
          .from('appointments')
          .update({ payment_status: 'paid', razorpay_payment_id: paymentId, status: 'completed' })
          .eq('id', appointment_id);

        // Credit doctor wallet
        const doctorId = appointment.doctor_id;
        const amount = appointment.payment_amount || 0;

        if (doctorId && amount > 0) {
          const { data: walletId } = await supabase.rpc('get_or_create_wallet', {
            _user_id: doctorId, _owner_type: 'doctor', _owner_id: doctorId,
          });

          if (walletId) {
            await supabase.rpc('credit_wallet', {
              _wallet_id: walletId, _order_id: null, _amount: amount,
              _description: `QR Payment - Appointment ${appointment_id.substring(0, 8)}`,
              _category: 'consultation_fee',
            });
            console.log('Doctor wallet credited:', amount);
          }
        }

        console.log('Payment captured for appointment:', appointment_id);
      }
    }

    return new Response(JSON.stringify({
      paid: isPaid,
      status: qrData.status,
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
