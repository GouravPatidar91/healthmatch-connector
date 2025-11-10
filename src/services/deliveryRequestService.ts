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

      // Create delivery requests (expire in 3 minutes)
      const expiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString();
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
    try {
      // Get the request details
      const { data: request, error: requestError } = await supabase
        .from('delivery_requests')
        .select('order_id, status, expires_at')
        .eq('id', requestId)
        .eq('delivery_partner_id', partnerId)
        .single();

      if (requestError) throw requestError;
      if (!request) {
        return { success: false, error: 'Request not found' };
      }

      if (request.status !== 'pending') {
        return { success: false, error: 'Request already processed' };
      }

      if (new Date(request.expires_at) < new Date()) {
        return { success: false, error: 'Request has expired' };
      }

      // Start a transaction-like operation
      // 1. Update the request to accepted
      const { error: updateRequestError } = await supabase
        .from('delivery_requests')
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateRequestError) throw updateRequestError;

      // 2. Get delivery partner record
      const { data: partner, error: partnerError } = await supabase
        .from('delivery_partners')
        .select('id')
        .eq('id', partnerId)
        .single();

      if (partnerError) throw partnerError;

      // 3. Assign partner to order and update status
      const { error: orderError } = await supabase
        .from('medicine_orders')
        .update({
          delivery_partner_id: partner.id,
          order_status: 'out_for_delivery',
        })
        .eq('id', request.order_id);

      if (orderError) throw orderError;

      // 4. Reject all other pending requests for this order
      const { error: rejectError } = await supabase
        .from('delivery_requests')
        .update({
          status: 'rejected',
          responded_at: new Date().toISOString(),
          rejection_reason: 'Another partner accepted',
        })
        .eq('order_id', request.order_id)
        .eq('status', 'pending')
        .neq('id', requestId);

      if (rejectError) console.error('Error rejecting other requests:', rejectError);

      // 5. Start location tracking for the partner
      await deliveryPartnerLocationService.startLocationTracking(partnerId);

      return { success: true };
    } catch (error: any) {
      console.error('Error accepting request:', error);
      return { success: false, error: error.message };
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
      const { data, error } = await supabase
        .from('delivery_requests')
        .select(`
          *,
          medicine_orders (
            order_number,
            delivery_address,
            total_amount,
            medicine_vendors (
              pharmacy_name,
              address,
              latitude,
              longitude
            )
          )
        `)
        .eq('delivery_partner_id', partnerId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
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
