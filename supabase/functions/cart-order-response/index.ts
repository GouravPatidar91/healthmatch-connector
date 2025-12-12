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
    const { broadcast_id, vendor_id, response_type, rejection_reason } = body;

    console.log('Cart order response:', { broadcast_id, vendor_id, response_type });

    if (!broadcast_id || !vendor_id || !response_type) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get the broadcast
    const { data: broadcast, error: broadcastError } = await supabaseClient
      .from('cart_order_broadcasts')
      .select('*')
      .eq('id', broadcast_id)
      .single();

    if (broadcastError || !broadcast) {
      console.error('Broadcast not found:', broadcastError);
      return new Response(
        JSON.stringify({ success: false, error: 'Broadcast not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Check if already accepted
    if (broadcast.status === 'accepted') {
      return new Response(
        JSON.stringify({ success: false, message: 'This order has already been accepted by another pharmacy' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if timeout has passed
    if (new Date(broadcast.timeout_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, message: 'This order request has expired' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (response_type === 'reject') {
      console.log(`Vendor ${vendor_id} rejected broadcast ${broadcast_id}`);
      // Just acknowledge the rejection, don't need to do anything special
      return new Response(
        JSON.stringify({ success: true, message: 'Order rejected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle accept
    if (response_type === 'accept') {
      // Get vendor info
      const { data: vendor, error: vendorError } = await supabaseClient
        .from('medicine_vendors')
        .select('*')
        .eq('id', vendor_id)
        .single();

      if (vendorError || !vendor) {
        return new Response(
          JSON.stringify({ success: false, error: 'Vendor not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      const orderData = broadcast.order_data;
      const items = orderData.items || [];

      // Generate order number
      const { data: orderNumber, error: orderNumError } = await supabaseClient
        .rpc('generate_order_number');

      if (orderNumError) {
        console.error('Error generating order number:', orderNumError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to generate order number' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Create the medicine order
      const { data: order, error: orderError } = await supabaseClient
        .from('medicine_orders')
        .insert({
          user_id: broadcast.patient_id,
          vendor_id: vendor_id,
          order_number: orderNumber,
          total_amount: orderData.total_amount,
          delivery_fee: orderData.delivery_fee || 50,
          handling_charges: orderData.handling_charges || 30,
          discount_amount: orderData.discount_amount || 0,
          final_amount: orderData.final_amount,
          payment_method: 'cod',
          delivery_address: broadcast.delivery_address,
          customer_phone: broadcast.customer_phone,
          delivery_latitude: broadcast.patient_latitude,
          delivery_longitude: broadcast.patient_longitude,
          prescription_required: orderData.prescription_required || false,
          order_status: 'placed'
        })
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create order' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      console.log('Created order:', order.id);

      // Create order items
      const orderItems = items.map((item: any) => ({
        order_id: order.id,
        medicine_id: item.medicine_id,
        vendor_medicine_id: item.vendor_medicine_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount || 0,
        total_price: item.total_price
      }));

      if (orderItems.length > 0) {
        const { error: itemsError } = await supabaseClient
          .from('medicine_order_items')
          .insert(orderItems);

        if (itemsError) {
          console.error('Error creating order items:', itemsError);
          // Continue anyway, order is already created
        }
      }

      // Update broadcast status
      const { error: updateError } = await supabaseClient
        .from('cart_order_broadcasts')
        .update({
          status: 'accepted',
          accepted_by_vendor_id: vendor_id,
          accepted_at: new Date().toISOString(),
          order_id: order.id
        })
        .eq('id', broadcast_id);

      if (updateError) {
        console.error('Error updating broadcast:', updateError);
      }

      // Create notification for customer
      const { error: customerNotifError } = await supabaseClient
        .from('customer_notifications')
        .insert({
          user_id: broadcast.patient_id,
          order_id: order.id,
          title: '✅ Order Accepted!',
          message: `Your order has been accepted by ${vendor.pharmacy_name}. Order #${orderNumber}`,
          type: 'order_accepted'
        });

      if (customerNotifError) {
        console.warn('Error creating customer notification:', customerNotifError);
      }

      // Broadcast to nearby delivery partners
      if (vendor.latitude && vendor.longitude) {
        try {
          const { error: deliveryBroadcastError } = await supabaseClient.functions.invoke(
            'broadcast-delivery-request',
            {
              body: {
                orderId: order.id,
                vendorId: vendor_id,
                vendorLocation: {
                  latitude: vendor.latitude,
                  longitude: vendor.longitude
                },
                radiusKm: 10
              }
            }
          );

          if (deliveryBroadcastError) {
            console.warn('Error broadcasting to delivery partners:', deliveryBroadcastError);
          } else {
            console.log('Broadcasted to delivery partners');
          }
        } catch (error) {
          console.warn('Failed to broadcast to delivery partners:', error);
        }
      }

      console.log(`Order ${order.id} created successfully for vendor ${vendor.pharmacy_name}`);

      return new Response(
        JSON.stringify({
          success: true,
          order_id: order.id,
          order_number: orderNumber,
          message: 'Order accepted successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid response type' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error) {
    console.error('Cart order response error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
