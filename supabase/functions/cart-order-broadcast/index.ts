import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Phase 1: Notify top 2-3 pharmacies for 15 seconds
const PHASE1_VENDOR_COUNT = 3;
const PHASE1_TIMEOUT_SECONDS = 15;

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

    const body = await req.json();
    const {
      user_id,
      items,
      delivery_address,
      delivery_latitude,
      delivery_longitude,
      customer_phone,
      total_amount,
      final_amount,
      handling_charges,
      delivery_fee,
      discount_amount,
      prescription_required
    } = body;

    console.log('[HybridBroadcast] Cart order broadcast request:', { 
      user_id, 
      items: items?.length, 
      delivery_latitude, 
      delivery_longitude 
    });

    // Validate required fields
    if (!user_id || !items || !delivery_latitude || !delivery_longitude) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Find and RANK nearby pharmacies using the new RPC function
    const { data: rankedVendors, error: vendorError } = await supabaseClient
      .rpc('find_ranked_nearby_vendors', {
        user_lat: delivery_latitude,
        user_lng: delivery_longitude,
        radius_km: 15
      });

    if (vendorError) {
      console.error('[HybridBroadcast] Error finding ranked vendors:', vendorError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to find nearby pharmacies' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!rankedVendors || rankedVendors.length === 0) {
      console.log('[HybridBroadcast] No nearby pharmacies found');
      return new Response(
        JSON.stringify({ success: false, error: 'No pharmacies available in your area' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    console.log(`[HybridBroadcast] Found ${rankedVendors.length} ranked pharmacies`);

    // Phase 1: Take top 2-3 vendors
    const phase1Vendors = rankedVendors.slice(0, PHASE1_VENDOR_COUNT);
    const remainingVendors = rankedVendors.slice(PHASE1_VENDOR_COUNT);
    const phase1Timeout = new Date(Date.now() + PHASE1_TIMEOUT_SECONDS * 1000);
    const overallTimeout = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes total

    console.log(`[HybridBroadcast] Phase 1: Notifying ${phase1Vendors.length} vendors for ${PHASE1_TIMEOUT_SECONDS}s`);

    // Create order data
    const orderData = {
      items,
      total_amount,
      final_amount,
      handling_charges,
      delivery_fee,
      discount_amount,
      prescription_required
    };

    // Create cart order broadcast record with phase tracking
    const { data: broadcast, error: broadcastError } = await supabaseClient
      .from('cart_order_broadcasts')
      .insert({
        patient_id: user_id,
        patient_latitude: delivery_latitude,
        patient_longitude: delivery_longitude,
        order_data: orderData,
        delivery_address,
        customer_phone,
        status: 'searching',
        broadcast_round: 1,
        timeout_at: overallTimeout.toISOString(),
        // New hybrid broadcast fields
        current_phase: 'controlled_parallel',
        phase_timeout_at: phase1Timeout.toISOString(),
        notified_vendor_ids: phase1Vendors.map((v: any) => v.id),
        current_vendor_index: 0,
        remaining_vendors: remainingVendors.map((v: any) => ({
          id: v.id,
          pharmacy_name: v.pharmacy_name,
          distance_km: v.distance_km,
          reliability_score: v.reliability_score
        }))
      })
      .select()
      .single();

    if (broadcastError) {
      console.error('[HybridBroadcast] Error creating broadcast:', broadcastError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create broadcast' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('[HybridBroadcast] Created broadcast:', broadcast.id);

    // Notify Phase 1 vendors simultaneously
    const notificationPromises = phase1Vendors.map(async (vendor: any) => {
      try {
        const { error: notifError } = await supabaseClient
          .from('vendor_notifications')
          .insert({
            vendor_id: vendor.id,
            title: '🛒 New Cart Order - Quick Response!',
            message: `Order with ${items.length} item(s) worth ₹${final_amount?.toFixed(2) || total_amount?.toFixed(2)}. Accept within ${PHASE1_TIMEOUT_SECONDS} seconds!`,
            type: 'cart_order_request',
            priority: 'high',
            metadata: {
              broadcast_id: broadcast.id,
              patient_latitude: delivery_latitude,
              patient_longitude: delivery_longitude,
              distance_km: vendor.distance_km,
              items: items,
              total_amount,
              final_amount,
              delivery_address,
              customer_phone,
              phase: 'controlled_parallel',
              phase_timeout_at: phase1Timeout.toISOString(),
              timeout_at: overallTimeout.toISOString()
            }
          });

        if (notifError) {
          console.error(`[HybridBroadcast] Error notifying vendor ${vendor.id}:`, notifError);
          return false;
        }
        console.log(`[HybridBroadcast] Notified vendor ${vendor.pharmacy_name} (score: ${vendor.reliability_score?.toFixed(2)}, ${vendor.distance_km?.toFixed(1)}km)`);
        return true;
      } catch (error) {
        console.error(`[HybridBroadcast] Error notifying vendor ${vendor.id}:`, error);
        return false;
      }
    });

    const results = await Promise.all(notificationPromises);
    const successCount = results.filter(r => r).length;

    console.log(`[HybridBroadcast] Phase 1: Successfully notified ${successCount}/${phase1Vendors.length} pharmacies`);
    console.log(`[HybridBroadcast] Remaining for Phase 2 fallback: ${remainingVendors.length} vendors`);

    return new Response(
      JSON.stringify({
        success: true,
        broadcast_id: broadcast.id,
        pharmacies_notified: successCount,
        phase: 'controlled_parallel',
        phase_timeout_seconds: PHASE1_TIMEOUT_SECONDS,
        remaining_vendors: remainingVendors.length,
        message: `Order broadcasted to ${successCount} top pharmacies. ${PHASE1_TIMEOUT_SECONDS}s to respond.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[HybridBroadcast] Cart order broadcast error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
