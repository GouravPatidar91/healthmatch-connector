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

    // Validate required fields
    if (!broadcast_id || !vendor_id || !response_type) {
      console.error('Missing required fields:', { broadcast_id, vendor_id, response_type });
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing required fields: broadcast_id, vendor_id, or response_type' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Get broadcast details
    const { data: broadcast, error: broadcastError } = await supabase
      .from('prescription_broadcasts')
      .select('*, medicine_orders!order_id(*)')
      .eq('id', broadcast_id)
      .single();

    if (broadcastError) {
      console.error('Broadcast query error:', broadcastError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Failed to fetch broadcast: ${broadcastError.message}` 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!broadcast) {
      console.error('Broadcast not found:', broadcast_id);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Broadcast not found' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      // Rejection case - check if should re-broadcast to next vendors
      const { data: allNotifications } = await supabase
        .from('pharmacy_notification_queue')
        .select('*')
        .eq('broadcast_id', broadcast_id);

      const activeNotifications = allNotifications?.filter(n => n.notification_status === 'sent') || [];

      if (activeNotifications.length === 0) {
        console.log('All notified pharmacies responded for broadcast', broadcast_id);
        
        // Get next batch of vendors
        const currentRound = broadcast.broadcast_round || 1;
        const nextRound = currentRound + 1;
        const radiusKm = 10 * nextRound; // Increase radius per round (10km, 20km, 30km)
        
        console.log(`Searching for next batch - Round ${nextRound}, Radius ${radiusKm}km`);
        
        const { data: nearbyVendors, error: vendorError } = await supabase
          .rpc('find_nearby_medicine_vendors', {
            user_lat: broadcast.patient_latitude,
            user_lng: broadcast.patient_longitude,
            radius_km: radiusKm
          });

        if (vendorError) {
          console.error('Error finding vendors:', vendorError);
        }

        // Filter out already notified vendors
        const existingVendorIds = allNotifications?.map(n => n.vendor_id) || [];
        const newVendors = nearbyVendors?.filter(v => !existingVendorIds.includes(v.id)).slice(0, 5) || [];
        
        console.log(`Found ${newVendors.length} new vendors for round ${nextRound}`);

        if (newVendors.length > 0 && nextRound <= 3) {
          // Create new notifications
          const newNotifications = newVendors.map(vendor => ({
            broadcast_id,
            vendor_id: vendor.id,
            notification_status: 'sent'
          }));

          await supabase
            .from('pharmacy_notification_queue')
            .insert(newNotifications);

          // Create vendor_notifications for real-time push
          const vendorNotifications = newVendors.map(vendor => ({
            vendor_id: vendor.id,
            order_id: broadcast.order_id,
            type: 'prescription_upload',
            priority: 'high',
            title: '🚨 NEW PRESCRIPTION ORDER',
            message: `Review and respond within 3 minutes. Customer is ${vendor.distance_km.toFixed(1)}km away.`,
            metadata: {
              broadcast_id,
              prescription_id: broadcast.prescription_id,
              patient_latitude: broadcast.patient_latitude,
              patient_longitude: broadcast.patient_longitude,
              distance_km: vendor.distance_km,
              timeout_at: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
              prescription_url: broadcast.prescription_url
            }
          }));

          await supabase
            .from('vendor_notifications')
            .insert(vendorNotifications);

          // Update broadcast round
          await supabase
            .from('prescription_broadcasts')
            .update({ broadcast_round: nextRound })
            .eq('id', broadcast_id);

          console.log(`Re-broadcast successful - Notified ${newVendors.length} new pharmacies`);
        } else {
          console.log('No more vendors available or max rounds reached');
          
          // Mark broadcast as failed
          await supabase
            .from('prescription_broadcasts')
            .update({ status: 'failed' })
            .eq('id', broadcast_id);
        }
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
      JSON.stringify({ 
        success: false,
        error: error.message || 'An unexpected error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
