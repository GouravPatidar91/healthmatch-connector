import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sequential phase: 15 seconds per vendor
const SEQUENTIAL_TIMEOUT_SECONDS = 15;
const MAX_SEQUENTIAL_ATTEMPTS = 10;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[Escalation] Checking for broadcasts needing escalation...');

    // Find broadcasts where phase_timeout_at has passed but still searching
    const now = new Date().toISOString();
    const { data: expiredBroadcasts, error: fetchError } = await supabaseClient
      .from('cart_order_broadcasts')
      .select('*')
      .eq('status', 'searching')
      .lt('phase_timeout_at', now)
      .gt('timeout_at', now); // Overall timeout not yet passed

    if (fetchError) {
      console.error('[Escalation] Error fetching expired broadcasts:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch broadcasts' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!expiredBroadcasts || expiredBroadcasts.length === 0) {
      console.log('[Escalation] No broadcasts need escalation');
      return new Response(
        JSON.stringify({ success: true, message: 'No broadcasts need escalation', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Escalation] Found ${expiredBroadcasts.length} broadcasts needing escalation`);

    let processedCount = 0;

    for (const broadcast of expiredBroadcasts) {
      try {
        await processBroadcastEscalation(supabaseClient, broadcast);
        processedCount++;
      } catch (error) {
        console.error(`[Escalation] Error processing broadcast ${broadcast.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: processedCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Escalation] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function processBroadcastEscalation(supabase: any, broadcast: any) {
  const broadcastId = broadcast.id;
  const currentPhase = broadcast.current_phase;
  const notifiedVendorIds = broadcast.notified_vendor_ids || [];
  const remainingVendors = broadcast.remaining_vendors || [];
  const currentVendorIndex = broadcast.current_vendor_index || 0;
  const orderData = broadcast.order_data;

  console.log(`[Escalation] Processing broadcast ${broadcastId}, phase: ${currentPhase}, notified: ${notifiedVendorIds.length}, remaining: ${remainingVendors.length}`);

  // Mark previous notifications as expired
  await expireVendorNotifications(supabase, broadcastId, notifiedVendorIds);

  if (currentPhase === 'controlled_parallel') {
    // Transition from Phase 1 to Phase 2 (sequential)
    console.log(`[Escalation] Transitioning broadcast ${broadcastId} to sequential phase`);
    await startSequentialPhase(supabase, broadcast);
  } else if (currentPhase === 'sequential') {
    // Continue sequential: notify next vendor
    const nextIndex = currentVendorIndex + 1;
    
    if (nextIndex >= MAX_SEQUENTIAL_ATTEMPTS || nextIndex >= remainingVendors.length) {
      // Try to expand radius and find more vendors
      const moreVendors = await findMoreVendors(supabase, broadcast, 30); // Expand to 30km
      
      if (moreVendors.length === 0) {
        // No more vendors, mark as failed
        console.log(`[Escalation] No more vendors for broadcast ${broadcastId}, marking as failed`);
        await supabase
          .from('cart_order_broadcasts')
          .update({ status: 'failed' })
          .eq('id', broadcastId);
        return;
      }
      
      // Add new vendors to remaining list
      const updatedRemaining = [...remainingVendors, ...moreVendors];
      await supabase
        .from('cart_order_broadcasts')
        .update({ remaining_vendors: updatedRemaining })
        .eq('id', broadcastId);
      
      // Notify first of the new vendors
      await notifyNextVendor(supabase, broadcast, 0, moreVendors);
    } else {
      // Notify next vendor in sequence
      await notifyNextVendor(supabase, broadcast, nextIndex, remainingVendors);
    }
  }
}

async function expireVendorNotifications(supabase: any, broadcastId: string, vendorIds: string[]) {
  if (!vendorIds || vendorIds.length === 0) return;
  
  console.log(`[Escalation] Expiring notifications for ${vendorIds.length} vendors`);
  
  // Mark all notifications for this broadcast as read/expired
  const { error } = await supabase
    .from('vendor_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('type', 'cart_order_request')
    .eq('is_read', false)
    .in('vendor_id', vendorIds);
  
  if (error) {
    console.warn('[Escalation] Error expiring notifications:', error);
  }
}

async function startSequentialPhase(supabase: any, broadcast: any) {
  const remainingVendors = broadcast.remaining_vendors || [];
  const orderData = broadcast.order_data;
  
  if (remainingVendors.length === 0) {
    // No remaining vendors, try expanding radius
    const moreVendors = await findMoreVendors(supabase, broadcast, 25);
    
    if (moreVendors.length === 0) {
      console.log(`[Escalation] No vendors for sequential phase, marking as failed`);
      await supabase
        .from('cart_order_broadcasts')
        .update({ status: 'failed' })
        .eq('id', broadcast.id);
      return;
    }
    
    // Use expanded vendors
    remainingVendors.push(...moreVendors);
    await supabase
      .from('cart_order_broadcasts')
      .update({ remaining_vendors: remainingVendors })
      .eq('id', broadcast.id);
  }
  
  // Notify first vendor in sequential phase
  await notifyNextVendor(supabase, broadcast, 0, remainingVendors);
}

async function notifyNextVendor(supabase: any, broadcast: any, vendorIndex: number, vendorList: any[]) {
  if (vendorIndex >= vendorList.length) {
    console.log(`[Escalation] No more vendors to notify, marking as failed`);
    await supabase
      .from('cart_order_broadcasts')
      .update({ status: 'failed' })
      .eq('id', broadcast.id);
    return;
  }
  
  const nextVendor = vendorList[vendorIndex];
  const orderData = broadcast.order_data;
  const items = orderData.items || [];
  const phaseTimeout = new Date(Date.now() + SEQUENTIAL_TIMEOUT_SECONDS * 1000);
  
  console.log(`[Escalation] Sequential: Notifying vendor ${nextVendor.id} (${nextVendor.pharmacy_name})`);
  
  // Create notification
  const { error: notifError } = await supabase
    .from('vendor_notifications')
    .insert({
      vendor_id: nextVendor.id,
      title: '🛒 Cart Order Available',
      message: `Order with ${items.length} item(s) worth ₹${orderData.final_amount?.toFixed(2) || orderData.total_amount?.toFixed(2)}. You have ${SEQUENTIAL_TIMEOUT_SECONDS} seconds!`,
      type: 'cart_order_request',
      priority: 'high',
      metadata: {
        broadcast_id: broadcast.id,
        patient_latitude: broadcast.patient_latitude,
        patient_longitude: broadcast.patient_longitude,
        distance_km: nextVendor.distance_km,
        items: items,
        total_amount: orderData.total_amount,
        final_amount: orderData.final_amount,
        delivery_address: broadcast.delivery_address,
        customer_phone: broadcast.customer_phone,
        phase: 'sequential',
        phase_timeout_at: phaseTimeout.toISOString(),
        timeout_at: broadcast.timeout_at
      }
    });
  
  if (notifError) {
    console.error(`[Escalation] Error notifying vendor ${nextVendor.id}:`, notifError);
  }
  
  // Update broadcast state
  const updatedNotifiedIds = [...(broadcast.notified_vendor_ids || []), nextVendor.id];
  
  const { error: updateError } = await supabase
    .from('cart_order_broadcasts')
    .update({
      current_phase: 'sequential',
      phase_timeout_at: phaseTimeout.toISOString(),
      notified_vendor_ids: updatedNotifiedIds,
      current_vendor_index: vendorIndex,
      broadcast_round: (broadcast.broadcast_round || 1) + 1
    })
    .eq('id', broadcast.id);
  
  if (updateError) {
    console.error(`[Escalation] Error updating broadcast:`, updateError);
  }
}

async function findMoreVendors(supabase: any, broadcast: any, radiusKm: number): Promise<any[]> {
  const notifiedIds = broadcast.notified_vendor_ids || [];
  
  console.log(`[Escalation] Searching for more vendors within ${radiusKm}km...`);
  
  const { data: vendors, error } = await supabase
    .rpc('find_ranked_nearby_vendors', {
      user_lat: broadcast.patient_latitude,
      user_lng: broadcast.patient_longitude,
      radius_km: radiusKm
    });
  
  if (error) {
    console.error('[Escalation] Error finding more vendors:', error);
    return [];
  }
  
  // Filter out already notified vendors
  const newVendors = (vendors || []).filter((v: any) => !notifiedIds.includes(v.id));
  
  console.log(`[Escalation] Found ${newVendors.length} new vendors at expanded radius`);
  
  return newVendors.map((v: any) => ({
    id: v.id,
    pharmacy_name: v.pharmacy_name,
    distance_km: v.distance_km,
    reliability_score: v.reliability_score
  }));
}
