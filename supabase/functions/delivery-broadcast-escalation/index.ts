import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PHASE_TIMEOUT_SECONDS = 20;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[DeliveryEscalation] Processing escalation check');

    // Find broadcasts that need escalation
    const now = new Date();
    
    const { data: broadcasts, error: broadcastsError } = await supabase
      .from('delivery_broadcasts')
      .select('*')
      .eq('status', 'searching')
      .lt('phase_timeout_at', now.toISOString())
      .lt('timeout_at', new Date(now.getTime() + 60000).toISOString()); // Not yet at total timeout

    if (broadcastsError) {
      console.error('[DeliveryEscalation] Error fetching broadcasts:', broadcastsError);
      throw broadcastsError;
    }

    console.log(`[DeliveryEscalation] Found ${broadcasts?.length || 0} broadcasts needing escalation`);

    if (!broadcasts || broadcasts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, escalated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let escalatedCount = 0;

    for (const broadcast of broadcasts) {
      // Check if overall timeout has passed
      if (new Date(broadcast.timeout_at) < now) {
        console.log(`[DeliveryEscalation] Broadcast ${broadcast.id} has timed out completely`);
        await supabase
          .from('delivery_broadcasts')
          .update({ status: 'failed' })
          .eq('id', broadcast.id);
        continue;
      }

      const remainingPartners = (broadcast.remaining_partners || []) as Array<{ id: string; distance: number }>;
      const notifiedPartnerIds = broadcast.notified_partner_ids || [];

      // Check if we're in controlled_parallel phase and need to switch to sequential
      if (broadcast.current_phase === 'controlled_parallel') {
        console.log(`[DeliveryEscalation] Broadcast ${broadcast.id}: Transitioning from controlled_parallel to sequential`);
        
        // Expire all Phase 1 pending requests
        await supabase
          .from('delivery_requests')
          .update({ status: 'expired', responded_at: now.toISOString() })
          .eq('order_id', broadcast.order_id)
          .eq('status', 'pending');

        if (remainingPartners.length === 0) {
          console.log(`[DeliveryEscalation] Broadcast ${broadcast.id}: No remaining partners, marking as failed`);
          await supabase
            .from('delivery_broadcasts')
            .update({ status: 'failed' })
            .eq('id', broadcast.id);
          continue;
        }

        // Transition to sequential and notify first remaining partner
        const nextPartner = remainingPartners[0];
        const newRemainingPartners = remainingPartners.slice(1);
        const newNotifiedIds = [...notifiedPartnerIds, nextPartner.id];
        const newPhaseTimeout = new Date(now.getTime() + PHASE_TIMEOUT_SECONDS * 1000);

        // Create delivery request for next partner
        await supabase
          .from('delivery_requests')
          .insert({
            order_id: broadcast.order_id,
            vendor_id: broadcast.vendor_id,
            delivery_partner_id: nextPartner.id,
            status: 'pending',
            expires_at: newPhaseTimeout.toISOString()
          });

        // Update broadcast
        await supabase
          .from('delivery_broadcasts')
          .update({
            current_phase: 'sequential',
            phase_timeout_at: newPhaseTimeout.toISOString(),
            notified_partner_ids: newNotifiedIds,
            remaining_partners: newRemainingPartners
          })
          .eq('id', broadcast.id);

        console.log(`[DeliveryEscalation] Broadcast ${broadcast.id}: Notified partner ${nextPartner.id} in sequential phase`);
        escalatedCount++;
      } 
      // Handle sequential phase escalation
      else if (broadcast.current_phase === 'sequential') {
        console.log(`[DeliveryEscalation] Broadcast ${broadcast.id}: Sequential phase timeout`);

        // Expire the current pending request
        await supabase
          .from('delivery_requests')
          .update({ status: 'expired', responded_at: now.toISOString() })
          .eq('order_id', broadcast.order_id)
          .eq('status', 'pending');

        if (remainingPartners.length === 0) {
          console.log(`[DeliveryEscalation] Broadcast ${broadcast.id}: No more partners, marking as failed`);
          await supabase
            .from('delivery_broadcasts')
            .update({ status: 'failed' })
            .eq('id', broadcast.id);
          continue;
        }

        // Notify next partner
        const nextPartner = remainingPartners[0];
        const newRemainingPartners = remainingPartners.slice(1);
        const newNotifiedIds = [...notifiedPartnerIds, nextPartner.id];
        const newPhaseTimeout = new Date(now.getTime() + PHASE_TIMEOUT_SECONDS * 1000);

        // Create delivery request for next partner
        await supabase
          .from('delivery_requests')
          .insert({
            order_id: broadcast.order_id,
            vendor_id: broadcast.vendor_id,
            delivery_partner_id: nextPartner.id,
            status: 'pending',
            expires_at: newPhaseTimeout.toISOString()
          });

        // Update broadcast
        await supabase
          .from('delivery_broadcasts')
          .update({
            phase_timeout_at: newPhaseTimeout.toISOString(),
            notified_partner_ids: newNotifiedIds,
            remaining_partners: newRemainingPartners
          })
          .eq('id', broadcast.id);

        console.log(`[DeliveryEscalation] Broadcast ${broadcast.id}: Notified partner ${nextPartner.id} in sequential phase`);
        escalatedCount++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, escalated: escalatedCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[DeliveryEscalation] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
