import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeliveryRequest {
  id: string;
  order_id: string;
  delivery_partner_id: string;
  status: string;
  expires_at: string;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  vendor_id: string;
  delivery_partner_id: string | null;
  created_at: string;
  vendor: {
    id: string;
    pharmacy_name: string;
    latitude: number;
    longitude: number;
  };
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting retry delivery broadcast check...');

    // Find orders in ready_for_pickup status without delivery partner
    const { data: ordersNeedingPartner, error: ordersError } = await supabase
      .from('medicine_orders')
      .select(`
        id,
        order_number,
        vendor_id,
        delivery_partner_id,
        created_at,
        vendor:medicine_vendors!vendor_id(
          id,
          pharmacy_name,
          latitude,
          longitude
        )
      `)
      .eq('order_status', 'ready_for_pickup')
      .is('delivery_partner_id', null);

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      throw ordersError;
    }

    console.log(`Found ${ordersNeedingPartner?.length || 0} orders needing delivery partners`);

    if (!ordersNeedingPartner || ordersNeedingPartner.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No orders needing retry', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processedCount = 0;
    let rebroadcastCount = 0;

    for (const order of ordersNeedingPartner as Order[]) {
      console.log(`Processing order ${order.order_number}...`);

      // Check delivery requests for this order
      const { data: requests, error: requestsError } = await supabase
        .from('delivery_requests')
        .select('*')
        .eq('order_id', order.id)
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error(`Error fetching requests for order ${order.id}:`, requestsError);
        continue;
      }

      if (!requests || requests.length === 0) {
        console.log(`No requests found for order ${order.id}, skipping`);
        continue;
      }

      // Check if all requests are expired or rejected
      const now = new Date();
      const allExpiredOrRejected = requests.every((req: DeliveryRequest) => {
        const isExpired = new Date(req.expires_at) < now;
        const isRejected = req.status === 'rejected';
        return isExpired || isRejected;
      });

      if (!allExpiredOrRejected) {
        console.log(`Order ${order.id} still has pending requests`);
        continue;
      }

      // Check if enough time has passed (3 minutes) since the last request
      const lastRequest = requests[0] as DeliveryRequest;
      const lastRequestTime = new Date(lastRequest.created_at);
      const timeSinceLastRequest = (now.getTime() - lastRequestTime.getTime()) / 1000 / 60; // in minutes

      if (timeSinceLastRequest < 3) {
        console.log(`Order ${order.id} - only ${timeSinceLastRequest.toFixed(1)} minutes since last request, waiting...`);
        continue;
      }

      // Count how many broadcast rounds we've done
      // Group requests by created_at to determine rounds (requests created within 10 seconds are same round)
      const rounds: DeliveryRequest[][] = [];
      let currentRound: DeliveryRequest[] = [];
      
      for (let i = 0; i < requests.length; i++) {
        const req = requests[i] as DeliveryRequest;
        if (currentRound.length === 0) {
          currentRound.push(req);
        } else {
          const timeDiff = Math.abs(
            new Date(currentRound[0].created_at).getTime() - new Date(req.created_at).getTime()
          ) / 1000;
          
          if (timeDiff < 10) {
            currentRound.push(req);
          } else {
            rounds.push(currentRound);
            currentRound = [req];
          }
        }
      }
      if (currentRound.length > 0) {
        rounds.push(currentRound);
      }

      const broadcastRound = rounds.length;
      console.log(`Order ${order.id} has had ${broadcastRound} broadcast round(s)`);

      // Limit to 3 rounds
      if (broadcastRound >= 3) {
        console.log(`Order ${order.id} has reached maximum retry attempts (3)`);
        continue;
      }

      // Calculate expanded radius based on round
      const baseRadius = 10; // km
      const expandedRadius = baseRadius * (broadcastRound + 1); // 10km, 20km, 30km

      console.log(`Rebroadcasting order ${order.id} with radius ${expandedRadius}km (round ${broadcastRound + 1})`);

      const vendor = Array.isArray(order.vendor) ? order.vendor[0] : order.vendor;

      if (!vendor?.latitude || !vendor?.longitude) {
        console.error(`Order ${order.id} - vendor location missing`);
        continue;
      }

      // Find available delivery partners within expanded radius
      const { data: availablePartners, error: partnersError } = await supabase
        .from('delivery_partners')
        .select('*')
        .eq('is_available', true)
        .eq('is_verified', true)
        .not('current_latitude', 'is', null)
        .not('current_longitude', 'is', null);

      if (partnersError) {
        console.error(`Error fetching partners for order ${order.id}:`, partnersError);
        continue;
      }

      if (!availablePartners || availablePartners.length === 0) {
        console.log(`No available partners found for order ${order.id}`);
        continue;
      }

      // Filter by expanded radius and calculate distances
      const partnersWithDistance = availablePartners
        .map((partner: any) => ({
          ...partner,
          distance: calculateDistance(
            vendor.latitude,
            vendor.longitude,
            partner.current_latitude,
            partner.current_longitude
          )
        }))
        .filter((partner: any) => partner.distance <= expandedRadius)
        .sort((a: any, b: any) => a.distance - b.distance);

      console.log(`Found ${partnersWithDistance.length} partners within ${expandedRadius}km`);

      if (partnersWithDistance.length === 0) {
        console.log(`No partners found within ${expandedRadius}km for order ${order.id}`);
        continue;
      }

      // Take top 5 closest partners
      const selectedPartners = partnersWithDistance.slice(0, 5);

      // Create delivery requests for each partner
      const expiresAt = new Date(now.getTime() + 3 * 60 * 1000); // 3 minutes from now
      const newRequests = selectedPartners.map((partner: any) => ({
        order_id: order.id,
        vendor_id: order.vendor_id,
        delivery_partner_id: partner.id,
        status: 'pending',
        expires_at: expiresAt.toISOString()
      }));

      const { error: insertError } = await supabase
        .from('delivery_requests')
        .insert(newRequests);

      if (insertError) {
        console.error(`Error creating requests for order ${order.id}:`, insertError);
        continue;
      }

      console.log(`✓ Created ${newRequests.length} new delivery requests for order ${order.id} (round ${broadcastRound + 1}, radius ${expandedRadius}km)`);
      
      // Send push notifications to selected partners
      try {
        const partnerIds = selectedPartners.map((p: any) => p.id);
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
          },
          body: JSON.stringify({
            deliveryPartnerIds: partnerIds,
            title: '🚨 New Delivery Request!',
            body: `Order #${order.order_number} from ${vendor.pharmacy_name}. Tap to accept!`,
            data: {
              orderId: order.id,
              orderNumber: order.order_number,
              vendorName: vendor.pharmacy_name,
              broadcastRound: broadcastRound + 1
            }
          })
        });
        console.log(`Push notifications sent to ${partnerIds.length} partners`);
      } catch (notifError) {
        console.error('Error sending push notifications:', notifError);
        // Don't fail the entire operation if notifications fail
      }
      
      rebroadcastCount++;
      processedCount++;
    }

    const result = {
      message: 'Retry delivery broadcast completed',
      ordersChecked: ordersNeedingPartner.length,
      ordersProcessed: processedCount,
      ordersRebroadcast: rebroadcastCount,
      timestamp: new Date().toISOString()
    };

    console.log('Result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in retry-delivery-broadcast:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
