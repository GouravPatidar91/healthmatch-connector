import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { 
      broadcast_id, 
      vendor_id,
      response_type, // 'accept' or 'reject'
      rejection_reason 
    } = await req.json();

    console.log(`Pharmacy ${vendor_id} ${response_type}ed broadcast ${broadcast_id}`);

    // Step 1: Get broadcast details
    const { data: broadcast, error: broadcastError } = await supabase
      .from('prescription_broadcasts')
      .select('*, medicine_orders!order_id(*)')
      .eq('id', broadcast_id)
      .single();

    if (broadcastError) {
      console.error('Broadcast query error:', broadcastError);
      throw broadcastError;
    }

    // Check if already accepted by someone else
    if (broadcast.status === 'accepted') {
      console.log('Order already accepted by another pharmacy');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'This order has already been accepted by another pharmacy' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
      );
    }

    // Step 2: Update notification queue
    const { error: queueError } = await supabase
      .from('pharmacy_notification_queue')
      .update({
        notification_status: response_type === 'accept' ? 'accepted' : 'rejected',
        responded_at: new Date().toISOString(),
        response_type,
        rejection_reason
      })
      .eq('broadcast_id', broadcast_id)
      .eq('vendor_id', vendor_id);

    if (queueError) {
      console.error('Queue update error:', queueError);
      throw queueError;
    }

    if (response_type === 'accept') {
      // Step 3: Update broadcast status
      const { error: broadcastUpdateError } = await supabase
        .from('prescription_broadcasts')
        .update({
          status: 'accepted',
          accepted_by_vendor_id: vendor_id,
          accepted_at: new Date().toISOString()
        })
        .eq('id', broadcast_id);

      if (broadcastUpdateError) {
        console.error('Broadcast update error:', broadcastUpdateError);
        throw broadcastUpdateError;
      }

      // Step 4: Update order with vendor assignment
      const { error: orderUpdateError } = await supabase
        .from('medicine_orders')
        .update({
          vendor_id,
          order_status: 'confirmed',
          prescription_status: 'approved'
        })
        .eq('id', broadcast.order_id);

      if (orderUpdateError) {
        console.error('Order update error:', orderUpdateError);
        throw orderUpdateError;
      }

      // Step 5: Mark all other notifications as cancelled
      const { error: cancelError } = await supabase
        .from('pharmacy_notification_queue')
        .update({ notification_status: 'cancelled' })
        .eq('broadcast_id', broadcast_id)
        .neq('vendor_id', vendor_id);

      if (cancelError) {
        console.error('Cancel notifications error:', cancelError);
      }

      console.log(`Order ${broadcast.order_id} assigned to pharmacy ${vendor_id}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Order accepted successfully',
          order_id: broadcast.order_id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Rejection case - check if should re-broadcast
      const { data: activeNotifications } = await supabase
        .from('pharmacy_notification_queue')
        .select('*')
        .eq('broadcast_id', broadcast_id)
        .eq('notification_status', 'sent');

      if (!activeNotifications || activeNotifications.length === 0) {
        console.log('All pharmacies responded/timed out for broadcast', broadcast_id);
        
        // Update broadcast to failed if no more active notifications
        await supabase
          .from('prescription_broadcasts')
          .update({ status: 'failed' })
          .eq('id', broadcast_id);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Rejection recorded' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in pharmacy-response:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
