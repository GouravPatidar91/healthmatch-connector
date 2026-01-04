import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { requestId, partnerId, responseType, rejectionReason } = await req.json();

    console.log('[DeliveryPartnerResponse] Processing response:', { requestId, partnerId, responseType });

    if (!requestId || !partnerId || !responseType) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get the delivery request
    const { data: request, error: requestError } = await supabase
      .from('delivery_requests')
      .select('*, medicine_orders(*)')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      console.error('[DeliveryPartnerResponse] Request not found:', requestError);
      return new Response(
        JSON.stringify({ success: false, error: 'Request not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Check if request is already processed
    if (request.status !== 'pending') {
      console.log('[DeliveryPartnerResponse] Request already processed:', request.status);
      return new Response(
        JSON.stringify({ success: false, message: 'Request has already been processed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if order already has a delivery partner
    if (request.medicine_orders?.delivery_partner_id) {
      console.log('[DeliveryPartnerResponse] Order already assigned to another partner');
      await supabase
        .from('delivery_requests')
        .update({ status: 'rejected', rejection_reason: 'Order already assigned', responded_at: new Date().toISOString() })
        .eq('id', requestId);
      
      return new Response(
        JSON.stringify({ success: false, message: 'Order has already been assigned to another partner' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if request is expired (with 30s grace period)
    const expiresAt = new Date(request.expires_at);
    const gracePeriod = new Date(expiresAt.getTime() + 30000);
    if (new Date() > gracePeriod) {
      console.log('[DeliveryPartnerResponse] Request expired');
      return new Response(
        JSON.stringify({ success: false, message: 'Request has expired' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (responseType === 'reject') {
      console.log(`[DeliveryPartnerResponse] Partner ${partnerId} rejected request ${requestId}`);
      
      await supabase
        .from('delivery_requests')
        .update({ 
          status: 'rejected', 
          rejection_reason: rejectionReason || 'Not available',
          responded_at: new Date().toISOString()
        })
        .eq('id', requestId);

      // Check if all current pending requests for this order are rejected
      const { data: pendingRequests } = await supabase
        .from('delivery_requests')
        .select('id')
        .eq('order_id', request.order_id)
        .eq('status', 'pending');

      if (!pendingRequests || pendingRequests.length === 0) {
        // No more pending requests, trigger immediate escalation
        console.log('[DeliveryPartnerResponse] All pending requests rejected, triggering escalation');
        
        // Update broadcast to trigger escalation by setting phase_timeout_at to now
        await supabase
          .from('delivery_broadcasts')
          .update({ phase_timeout_at: new Date().toISOString() })
          .eq('order_id', request.order_id)
          .eq('status', 'searching');

        // Trigger escalation
        try {
          await supabase.functions.invoke('delivery-broadcast-escalation', { body: {} });
        } catch (error) {
          console.warn('[DeliveryPartnerResponse] Error triggering escalation:', error);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Request rejected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (responseType === 'accept') {
      console.log(`[DeliveryPartnerResponse] Partner ${partnerId} accepting request ${requestId}`);

      // Update the delivery request to accepted
      const { error: updateRequestError } = await supabase
        .from('delivery_requests')
        .update({ 
          status: 'accepted',
          responded_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateRequestError) {
        console.error('[DeliveryPartnerResponse] Error updating request:', updateRequestError);
        throw updateRequestError;
      }

      // Assign the partner to the order (keep status as ready_for_pickup)
      const { error: updateOrderError } = await supabase
        .from('medicine_orders')
        .update({ 
          delivery_partner_id: partnerId
        })
        .eq('id', request.order_id);

      if (updateOrderError) {
        console.error('[DeliveryPartnerResponse] Error updating order:', updateOrderError);
        throw updateOrderError;
      }

      // Reject all other pending requests for this order
      await supabase
        .from('delivery_requests')
        .update({ 
          status: 'rejected',
          rejection_reason: 'Another partner accepted',
          responded_at: new Date().toISOString()
        })
        .eq('order_id', request.order_id)
        .eq('status', 'pending')
        .neq('id', requestId);

      // Update broadcast to accepted
      await supabase
        .from('delivery_broadcasts')
        .update({ 
          status: 'accepted',
          accepted_by_partner_id: partnerId,
          accepted_at: new Date().toISOString()
        })
        .eq('order_id', request.order_id)
        .eq('status', 'searching');

      // Start location tracking for the partner
      await supabase
        .from('delivery_partners')
        .update({ location_updated_at: new Date().toISOString() })
        .eq('id', partnerId);

      console.log(`[DeliveryPartnerResponse] Partner ${partnerId} assigned to order ${request.order_id}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Request accepted successfully',
          orderId: request.order_id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid response type' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error) {
    console.error('[DeliveryPartnerResponse] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
