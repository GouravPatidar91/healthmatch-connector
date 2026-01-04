import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PHASE1_PARTNER_COUNT = 3;
const PHASE1_TIMEOUT_SECONDS = 20;
const TOTAL_TIMEOUT_SECONDS = 180; // 3 minutes total

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId, vendorId, vendorLocation, radiusKm = 10 } = await req.json();

    console.log('[DeliveryHybridBroadcast] Starting broadcast:', { orderId, vendorId, vendorLocation, radiusKm });

    // Validate input
    if (!orderId || !vendorId || !vendorLocation?.latitude || !vendorLocation?.longitude) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check if there's already an active broadcast for this order
    const { data: existingBroadcast } = await supabase
      .from('delivery_broadcasts')
      .select('id')
      .eq('order_id', orderId)
      .eq('status', 'searching')
      .single();

    if (existingBroadcast) {
      console.log('[DeliveryHybridBroadcast] Broadcast already exists for order:', orderId);
      return new Response(
        JSON.stringify({ 
          success: true, 
          broadcastId: existingBroadcast.id,
          message: 'Broadcast already in progress'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find available delivery partners within radius
    const { data: partners, error: partnersError } = await supabase
      .from('delivery_partners')
      .select('id, user_id, name, phone, current_latitude, current_longitude')
      .eq('is_verified', true)
      .eq('is_available', true)
      .not('current_latitude', 'is', null)
      .not('current_longitude', 'is', null);

    if (partnersError) {
      console.error('[DeliveryHybridBroadcast] Error fetching partners:', partnersError);
      throw partnersError;
    }

    console.log(`[DeliveryHybridBroadcast] Found ${partners?.length || 0} total available partners`);

    if (!partners || partners.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No available delivery partners found',
          broadcastId: null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate distances and sort by distance
    const partnersWithDistance = partners
      .map(partner => {
        const distance = calculateDistance(
          vendorLocation.latitude,
          vendorLocation.longitude,
          partner.current_latitude!,
          partner.current_longitude!
        );
        return { ...partner, distance };
      })
      .filter(partner => partner.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    console.log(`[DeliveryHybridBroadcast] Found ${partnersWithDistance.length} partners within ${radiusKm}km radius`);

    if (partnersWithDistance.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `No delivery partners found within ${radiusKm}km radius`,
          broadcastId: null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Split into Phase 1 and remaining partners
    const phase1Partners = partnersWithDistance.slice(0, PHASE1_PARTNER_COUNT);
    const remainingPartners = partnersWithDistance.slice(PHASE1_PARTNER_COUNT);

    const now = new Date();
    const phaseTimeoutAt = new Date(now.getTime() + PHASE1_TIMEOUT_SECONDS * 1000);
    const totalTimeoutAt = new Date(now.getTime() + TOTAL_TIMEOUT_SECONDS * 1000);

    // Create the broadcast record
    const { data: broadcast, error: broadcastError } = await supabase
      .from('delivery_broadcasts')
      .insert({
        order_id: orderId,
        vendor_id: vendorId,
        status: 'searching',
        current_phase: 'controlled_parallel',
        phase_timeout_at: phaseTimeoutAt.toISOString(),
        timeout_at: totalTimeoutAt.toISOString(),
        notified_partner_ids: phase1Partners.map(p => p.id),
        all_partner_ids: partnersWithDistance.map(p => p.id),
        remaining_partners: remainingPartners.map(p => ({ id: p.id, distance: p.distance }))
      })
      .select()
      .single();

    if (broadcastError) {
      console.error('[DeliveryHybridBroadcast] Error creating broadcast:', broadcastError);
      throw broadcastError;
    }

    console.log(`[DeliveryHybridBroadcast] Created broadcast ${broadcast.id}, notifying ${phase1Partners.length} Phase 1 partners`);

    // Create delivery requests for Phase 1 partners
    const requests = phase1Partners.map(partner => ({
      order_id: orderId,
      vendor_id: vendorId,
      delivery_partner_id: partner.id,
      status: 'pending',
      expires_at: phaseTimeoutAt.toISOString()
    }));

    const { data: createdRequests, error: requestsError } = await supabase
      .from('delivery_requests')
      .insert(requests)
      .select();

    if (requestsError) {
      console.error('[DeliveryHybridBroadcast] Error creating delivery requests:', requestsError);
      throw requestsError;
    }

    console.log(`[DeliveryHybridBroadcast] Created ${createdRequests?.length || 0} delivery requests for Phase 1`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        broadcastId: broadcast.id,
        phase: 'controlled_parallel',
        partnersNotified: phase1Partners.length,
        remainingPartners: remainingPartners.length,
        phaseTimeoutAt: phaseTimeoutAt.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[DeliveryHybridBroadcast] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        broadcastId: null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
