import { supabase } from '@/integrations/supabase/client';
import { deliveryPartnerLocationService } from './deliveryPartnerLocationService';

interface DeliveryRequest {
  id: string;
  order_id: string;
  vendor_id: string;
  delivery_partner_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  expires_at: string;
  responded_at?: string;
  rejection_reason?: string;
  created_at: string;
}

interface BroadcastResult {
  success: boolean;
  requestIds?: string[];
  error?: string;
}

class DeliveryRequestService {
  async broadcastToNearbyPartners(
    orderId: string,
    vendorId: string,
    vendorLocation: { latitude: number; longitude: number },
    radiusKm: number = 10
  ): Promise<BroadcastResult> {
    try {
      // Find available delivery partners within radius
      const { data: partners, error: partnersError } = await supabase
        .from('delivery_partners')
        .select('id, current_latitude, current_longitude, name, phone')
        .eq('is_verified', true)
        .eq('is_available', true)
        .not('current_latitude', 'is', null)
        .not('current_longitude', 'is', null);

      if (partnersError) throw partnersError;
      if (!partners || partners.length === 0) {
        return { success: false, error: 'No available delivery partners found' };
      }

      // Calculate distances and filter by radius
      const partnersWithDistance = partners
        .map((partner) => ({
          ...partner,
          distance: deliveryPartnerLocationService.calculateDistance(
            vendorLocation.latitude,
            vendorLocation.longitude,
            partner.current_latitude!,
            partner.current_longitude!
          ),
        }))
        .filter((p) => p.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5); // Take top 5 closest partners

      if (partnersWithDistance.length === 0) {
        return { success: false, error: 'No delivery partners within radius' };
      }

      // Create delivery requests (expire in 5 minutes)
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      const requests = partnersWithDistance.map((partner) => ({
        order_id: orderId,
        vendor_id: vendorId,
        delivery_partner_id: partner.id,
        status: 'pending' as const,
        expires_at: expiresAt,
      }));

      const { data: createdRequests, error: createError } = await supabase
        .from('delivery_requests')
        .insert(requests)
        .select('id');

      if (createError) throw createError;

      return {
        success: true,
        requestIds: createdRequests?.map((r) => r.id) || [],
      };
    } catch (error: any) {
      console.error('Error broadcasting to partners:', error);
      return { success: false, error: error.message };
    }
  }

  async acceptRequest(
    requestId: string,
    partnerId: string
  ): Promise<{ success: boolean; error?: string }> {
    console.log('[DeliveryRequestService] Accepting request:', { requestId, partnerId });
    
    try {
      // Get the request details
      const { data: request, error: requestError } = await supabase
        .from('delivery_requests')
        .select('order_id, status, expires_at')
        .eq('id', requestId)
        .eq('delivery_partner_id', partnerId)
        .single();

      if (requestError) {
        console.error('[DeliveryRequestService] Error fetching request:', requestError);
        throw requestError;
      }
      
      if (!request) {
        console.error('[DeliveryRequestService] Request not found');
        return { success: false, error: 'Request not found' };
      }

      if (request.status !== 'pending') {
        console.warn('[DeliveryRequestService] Request already processed:', request.status);
        return { success: false, error: 'Request already processed' };
      }

      if (new Date(request.expires_at) < new Date()) {
        console.warn('[DeliveryRequestService] Request has expired');
        return { success: false, error: 'Request has expired' };
      }

      // Check if order is already assigned to another partner
      const { data: orderCheck, error: orderCheckError } = await supabase
        .from('medicine_orders')
        .select('delivery_partner_id')
        .eq('id', request.order_id)
        .single();

      if (orderCheckError) {
        console.error('[DeliveryRequestService] Error checking order status:', orderCheckError);
        return { success: false, error: 'Failed to verify order status' };
      }

      if (orderCheck?.delivery_partner_id) {
        console.warn('[DeliveryRequestService] Order already assigned to another partner');
        return { success: false, error: 'This order has already been assigned to another partner' };
      }

      console.log('[DeliveryRequestService] Request validated, fetching partner...');

      // 1. Get delivery partner record FIRST
      const { data: partner, error: partnerError } = await supabase
        .from('delivery_partners')
        .select('id')
        .eq('id', partnerId)
        .single();

      if (partnerError || !partner) {
        console.error('[DeliveryRequestService] Error fetching partner:', partnerError);
        return { success: false, error: 'Partner not found' };
      }

      console.log('[DeliveryRequestService] Partner fetched:', partner.id);
      console.log('[DeliveryRequestService] Assigning to order while request is still pending:', request.order_id);

      // 2. Assign partner to order and update status WHILE request is still pending
      // This must happen before we mark the delivery_request as accepted so that
      // RLS policy can_delivery_partner_accept_order() still sees a pending request.
      // Assign partner and keep order in pickup phase.
      // IMPORTANT: Do NOT move to 'out_for_delivery' here; that happens only after the partner clicks "Order Picked".
      const { data: updatedOrder, error: orderError } = await supabase
        .from('medicine_orders')
        .update({
          delivery_partner_id: partner.id,
          order_status: 'ready_for_pickup',
        })
        .eq('id', request.order_id)
        .select('id, delivery_partner_id, order_status')
        .single();

      if (orderError || !updatedOrder) {
        console.error('[DeliveryRequestService] Failed to assign partner:', orderError);
        console.error('[DeliveryRequestService] Update returned no data - likely RLS blocked update');
        return {
          success: false,
          error:
            'Failed to assign delivery partner. The order may have already been assigned or RLS policies prevented the update.',
        };
      }

      console.log('[DeliveryRequestService] Partner assigned successfully:', updatedOrder);
      console.log('[DeliveryRequestService] Now updating request status to accepted...');

      // 3. NOW update the request to accepted
      // The database trigger will automatically reject other pending requests
      const { error: updateRequestError } = await supabase
        .from('delivery_requests')
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateRequestError) {
        console.error('[DeliveryRequestService] Error updating request after order assignment:', updateRequestError);

        // Best-effort rollback: reset order assignment if we can't mark request as accepted
        await supabase
          .from('medicine_orders')
          .update({
            delivery_partner_id: null,
          })
          .eq('id', request.order_id);

        return { success: false, error: 'Failed to confirm acceptance of delivery request' };
      }

      console.log('[DeliveryRequestService] Request accepted, trigger will auto-reject others');

      // 4. Start location tracking for the partner
      try {
        await deliveryPartnerLocationService.startLocationTracking(partnerId);
        console.log('[DeliveryRequestService] Location tracking started');
      } catch (locationError) {
        console.error('[DeliveryRequestService] Error starting location tracking:', locationError);
        // Don't fail the whole operation for this
      }

      console.log('[DeliveryRequestService] Accept request completed successfully');
      return { success: true };
    } catch (error: any) {
      console.error('[DeliveryRequestService] Unexpected error accepting request:', error);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  }

  async rejectRequest(
    requestId: string,
    partnerId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('delivery_requests')
        .update({
          status: 'rejected',
          responded_at: new Date().toISOString(),
          rejection_reason: reason || 'Declined by partner',
        })
        .eq('id', requestId)
        .eq('delivery_partner_id', partnerId)
        .eq('status', 'pending');

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      return { success: false, error: error.message };
    }
  }

  subscribeToRequestUpdates(partnerId: string, callback: (request: any) => void) {
    const channel = supabase
      .channel(`delivery-requests-${partnerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'delivery_requests',
          filter: `delivery_partner_id=eq.${partnerId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return channel;
  }

  async getPendingRequests(partnerId: string): Promise<any[]> {
    try {
      // Use current time - no buffer (strict expiry)
      const bufferTime = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('delivery_requests')
        .select(`
          *,
          medicine_orders (
            order_number,
            delivery_address,
            delivery_latitude,
            delivery_longitude,
            final_amount,
            delivery_partner_id,
            customer_phone,
            medicine_vendors!vendor_id (
              pharmacy_name,
              address,
              latitude,
              longitude
            )
          )
        `)
        .eq('delivery_partner_id', partnerId)
        .eq('status', 'pending')
        .gte('expires_at', bufferTime)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Additional client-side filters to ensure validity
      const now = Date.now();
      const validRequests = (data || []).filter(request => {
        const order = request.medicine_orders;
        
        // Skip if order is already assigned to another partner
        if (order?.delivery_partner_id) {
          console.log(`Request ${request.id}: order already assigned, skipping`);
          return false;
        }
        
        // Check expiry
        const expiresAt = new Date(request.expires_at).getTime();
        const timeLeft = Math.floor((expiresAt - now) / 1000);
        console.log(`Request ${request.id}: expires at ${request.expires_at}, time left: ${timeLeft}s`);
        return expiresAt > now;
      });
      
      console.log(`Found ${validRequests.length} valid pending requests`);
      return validRequests;
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      return [];
    }
  }

  async getRequestsForOrder(orderId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('delivery_requests')
        .select(`
          *,
          delivery_partners (
            name,
            phone,
            vehicle_type
          )
        `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching order requests:', error);
      return [];
    }
  }
}

export const deliveryRequestService = new DeliveryRequestService();
