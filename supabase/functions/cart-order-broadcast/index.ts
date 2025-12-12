import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    console.log('Cart order broadcast request:', { user_id, items: items?.length, delivery_latitude, delivery_longitude });

    // Validate required fields
    if (!user_id || !items || !delivery_latitude || !delivery_longitude) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Find nearby pharmacies using the RPC function
    const { data: nearbyVendors, error: vendorError } = await supabaseClient
      .rpc('find_nearby_medicine_vendors', {
        user_lat: delivery_latitude,
        user_lng: delivery_longitude,
        radius_km: 50
      });

    if (vendorError) {
      console.error('Error finding nearby vendors:', vendorError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to find nearby pharmacies' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!nearbyVendors || nearbyVendors.length === 0) {
      console.log('No nearby pharmacies found');
      return new Response(
        JSON.stringify({ success: false, error: 'No pharmacies available in your area' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    console.log(`Found ${nearbyVendors.length} nearby pharmacies`);

    // Create cart order broadcast record
    const orderData = {
      items,
      total_amount,
      final_amount,
      handling_charges,
      delivery_fee,
      discount_amount,
      prescription_required
    };

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
        timeout_at: new Date(Date.now() + 3 * 60 * 1000).toISOString() // 3 minutes timeout
      })
      .select()
      .single();

    if (broadcastError) {
      console.error('Error creating broadcast:', broadcastError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create broadcast' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Created broadcast:', broadcast.id);

    // Notify first batch of pharmacies (up to 5)
    const pharmaciesToNotify = nearbyVendors.slice(0, 5);
    const notificationPromises = pharmaciesToNotify.map(async (vendor: any) => {
      try {
        // Create notification for vendor
        const { error: notifError } = await supabaseClient
          .from('vendor_notifications')
          .insert({
            vendor_id: vendor.id,
            title: '🛒 New Cart Order Request',
            message: `New order with ${items.length} item(s) worth ₹${final_amount?.toFixed(2) || total_amount?.toFixed(2)}. Review and accept within 3 minutes!`,
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
              timeout_at: broadcast.timeout_at
            }
          });

        if (notifError) {
          console.error(`Error notifying vendor ${vendor.id}:`, notifError);
          return false;
        }
        console.log(`Notified vendor ${vendor.pharmacy_name} (${vendor.distance_km?.toFixed(1)}km away)`);
        return true;
      } catch (error) {
        console.error(`Error notifying vendor ${vendor.id}:`, error);
        return false;
      }
    });

    const results = await Promise.all(notificationPromises);
    const successCount = results.filter(r => r).length;

    console.log(`Successfully notified ${successCount}/${pharmaciesToNotify.length} pharmacies`);

    return new Response(
      JSON.stringify({
        success: true,
        broadcast_id: broadcast.id,
        pharmacies_notified: successCount,
        message: `Order broadcasted to ${successCount} nearby pharmacies`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Cart order broadcast error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
