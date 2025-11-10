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

    const { orderId, vendorId, vendorLocation, radiusKm = 10 } = await req.json();

    console.log('Broadcasting delivery request:', { orderId, vendorId, vendorLocation, radiusKm });

    // Validate input
    if (!orderId || !vendorId || !vendorLocation?.latitude || !vendorLocation?.longitude) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters: orderId, vendorId, and vendorLocation are required' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
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
      console.error('Error fetching partners:', partnersError);
      throw partnersError;
    }

    console.log(`Found ${partners?.length || 0} total available partners`);

    if (!partners || partners.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No available delivery partners found',
          requestIds: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate distances and filter by radius
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
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5); // Top 5 closest partners

    console.log(`Found ${partnersWithDistance.length} partners within ${radiusKm}km radius`);

    if (partnersWithDistance.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `No delivery partners found within ${radiusKm}km radius`,
          requestIds: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create delivery requests for each partner
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes from now
    const requests = partnersWithDistance.map(partner => ({
      order_id: orderId,
      vendor_id: vendorId,
      delivery_partner_id: partner.id,
      status: 'pending',
      expires_at: expiresAt.toISOString()
    }));

    const { data: createdRequests, error: requestsError } = await supabase
      .from('delivery_requests')
      .insert(requests)
      .select();

    if (requestsError) {
      console.error('Error creating delivery requests:', requestsError);
      throw requestsError;
    }

    console.log(`Successfully created ${createdRequests?.length || 0} delivery requests`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        requestIds: createdRequests?.map(r => r.id) || [],
        partnersNotified: createdRequests?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in broadcast-delivery-request:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        requestIds: []
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
