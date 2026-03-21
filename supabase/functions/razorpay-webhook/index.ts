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
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    // Razorpay webhook signatures use the Webhook Secret from the Dashboard,
    // NOT the API Key Secret. Fall back to KEY_SECRET if webhook secret is not set.
    const WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') || Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!WEBHOOK_SECRET) throw new Error('Razorpay secret not configured');

    // Verify webhook signature
    if (signature) {
      const expectedSignature = await hmacSha256(WEBHOOK_SECRET, body);
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

    // Handle QR Code payment events
    if (event.event === 'qr_code.credited') {
      const qrCodeId = event.payload?.qr_code?.entity?.id;
      const notes = event.payload?.qr_code?.entity?.notes;
      const appointmentId = notes?.appointment_id;
      const paymentId = event.payload?.payment?.entity?.id;

      console.log('QR payment received - QR ID:', qrCodeId, 'Appointment:', appointmentId, 'Payment:', paymentId);

      if (appointmentId) {
        const { data: appointment } = await supabase
          .from('appointments')
          .select('*')
          .eq('id', appointmentId)
          .single();

        if (appointment && appointment.payment_status !== 'paid') {
          // Fetch patient name
          let patientDisplayName = 'Patient';
          if (appointment.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', appointment.user_id)
              .single();
            if (profile) {
              patientDisplayName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Patient';
            }
          }

          await supabase
            .from('appointments')
            .update({
              payment_status: 'paid',
              razorpay_payment_id: paymentId || qrCodeId,
            })
            .eq('id', appointmentId);

          const doctorId = appointment.doctor_id;
          const amount = appointment.payment_amount || 0;

          if (doctorId && amount > 0) {
            const walletId = await supabase.rpc('get_or_create_wallet', {
              _user_id: doctorId, _owner_type: 'doctor', _owner_id: doctorId,
            });

            if (walletId.data) {
              await supabase.rpc('credit_wallet', {
                _wallet_id: walletId.data, _order_id: null, _amount: amount,
                _description: `QR Payment - ${patientDisplayName}`,
                _category: 'consultation_fee',
              });
              console.log('Doctor wallet credited:', amount);
            }
          }
        } else {
          console.log('Appointment already paid or not found, skipping wallet credit');
        }
      }
    }

    // Keep legacy payment_link.paid handler
    if (event.event === 'payment_link.paid') {
      const paymentLinkId = event.payload?.payment_link?.entity?.id;
      const notes = event.payload?.payment_link?.entity?.notes;
      const appointmentId = notes?.appointment_id;

      if (appointmentId) {
        const { data: appointment } = await supabase
          .from('appointments')
          .select('*')
          .eq('id', appointmentId)
          .single();

        if (appointment && appointment.payment_status !== 'paid') {
          // Fetch patient name
          let patientDisplayName = 'Patient';
          if (appointment.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', appointment.user_id)
              .single();
            if (profile) {
              patientDisplayName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Patient';
            }
          }

          await supabase
            .from('appointments')
            .update({
              payment_status: 'paid',
              razorpay_payment_id: event.payload?.payment?.entity?.id || paymentLinkId,
            })
            .eq('id', appointmentId);

          const doctorId = appointment.doctor_id;
          const amount = appointment.payment_amount || 0;

          if (doctorId && amount > 0) {
            const walletId = await supabase.rpc('get_or_create_wallet', {
              _user_id: doctorId, _owner_type: 'doctor', _owner_id: doctorId,
            });

            if (walletId.data) {
              await supabase.rpc('credit_wallet', {
                _wallet_id: walletId.data, _order_id: null, _amount: amount,
                _description: `QR Payment - ${patientDisplayName}`,
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
