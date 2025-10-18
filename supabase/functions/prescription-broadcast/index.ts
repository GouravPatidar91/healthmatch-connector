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
      prescription_id, 
      order_id,
      patient_id,
      patient_latitude, 
      patient_longitude,
      max_distance_km = 5,
      pharmacies_per_round = 5
    } = await req.json();

    console.log(`Broadcasting prescription ${prescription_id} from location: ${patient_latitude}, ${patient_longitude}`);

    // Step 1: Find nearby pharmacies using existing function
    const { data: nearbyPharmacies, error: geoError } = await supabase.rpc(
      'find_nearby_medicine_vendors',
      {
        user_lat: patient_latitude,
        user_lng: patient_longitude,
        radius_km: max_distance_km
      }
    );

    if (geoError) {
      console.error('Geo query error:', geoError);
      throw geoError;
    }

    if (!nearbyPharmacies || nearbyPharmacies.length === 0) {
      console.log('No nearby pharmacies found');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No pharmacies found within radius',
          pharmacies_count: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    console.log(`Found ${nearbyPharmacies.length} nearby pharmacies`);

    // Step 2: Create broadcast record
    const { data: broadcast, error: broadcastError } = await supabase
      .from('prescription_broadcasts')
      .insert({
        prescription_id,
        order_id,
        patient_id,
        patient_latitude,
        patient_longitude,
        broadcast_round: 1,
        status: 'searching'
      })
      .select()
      .single();

    if (broadcastError) {
      console.error('Broadcast creation error:', broadcastError);
      throw broadcastError;
    }

    // Step 3: Get prescription URL
    const { data: prescriptionData } = await supabase
      .from('prescription_uploads')
      .select('file_url')
      .eq('id', prescription_id)
      .single();

    const prescription_url = prescriptionData?.file_url || '';

    // Step 4: Notify first batch of pharmacies (closest ones)
    const firstBatch = nearbyPharmacies.slice(0, pharmacies_per_round);
    
    const notificationPromises = firstBatch.map(async (pharmacy) => {
      // Insert into notification queue
      await supabase.from('pharmacy_notification_queue').insert({
        broadcast_id: broadcast.id,
        vendor_id: pharmacy.id,
        notification_status: 'sent'
      });

      // Insert into vendor_notifications for UI
      await supabase.from('vendor_notifications').insert({
        vendor_id: pharmacy.id,
        order_id,
        type: 'prescription_upload',
        title: 'New Prescription Order',
        message: `A customer ${pharmacy.distance_km.toFixed(1)}km away needs medicines. Accept within 3 minutes!`,
        priority: 'high',
        metadata: {
          broadcast_id: broadcast.id,
          prescription_id,
          patient_latitude,
          patient_longitude,
          distance_km: pharmacy.distance_km,
          timeout_at: broadcast.timeout_at,
          prescription_url
        }
      });
    });

    await Promise.all(notificationPromises);

    console.log(`Notified ${firstBatch.length} pharmacies for broadcast ${broadcast.id}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        broadcast_id: broadcast.id,
        pharmacies_notified: firstBatch.length,
        total_pharmacies_available: nearbyPharmacies.length,
        timeout_at: broadcast.timeout_at
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in prescription-broadcast:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
