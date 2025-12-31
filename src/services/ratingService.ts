import { supabase } from '@/integrations/supabase/client';

export interface OrderRating {
  id: string;
  order_id: string;
  user_id: string;
  rating: number;
  review?: string;
  delivery_rating?: number;
  pharmacy_rating?: number;
  created_at: string;
}

export interface RatingSubmission {
  order_id: string;
  rating: number;
  review?: string;
  delivery_rating?: number;
  pharmacy_rating?: number;
}

class RatingService {
  async submitRating(ratingData: RatingSubmission): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check if order is delivered
      const { data: order, error: orderError } = await supabase
        .from('medicine_orders')
        .select('order_status, user_id')
        .eq('id', ratingData.order_id)
        .single();

      if (orderError || !order) {
        return { success: false, error: 'Order not found' };
      }

      if (order.user_id !== user.id) {
        return { success: false, error: 'Unauthorized' };
      }

      if (order.order_status !== 'delivered') {
        return { success: false, error: 'Order must be delivered before rating' };
      }

      // Check if already rated
      const { data: existingRating } = await supabase
        .from('order_ratings')
        .select('id')
        .eq('order_id', ratingData.order_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingRating) {
        // Update existing rating
        const { error } = await supabase
          .from('order_ratings')
          .update({
            rating: ratingData.rating,
            review: ratingData.review,
            delivery_rating: ratingData.delivery_rating,
            pharmacy_rating: ratingData.pharmacy_rating
          })
          .eq('id', existingRating.id);

        if (error) throw error;
      } else {
        // Insert new rating
        const { error } = await supabase
          .from('order_ratings')
          .insert({
            order_id: ratingData.order_id,
            user_id: user.id,
            rating: ratingData.rating,
            review: ratingData.review,
            delivery_rating: ratingData.delivery_rating,
            pharmacy_rating: ratingData.pharmacy_rating
          });

        if (error) throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error submitting rating:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async getOrderRating(orderId: string): Promise<OrderRating | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('order_ratings')
        .select('*')
        .eq('order_id', orderId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching order rating:', error);
      return null;
    }
  }

  async getVendorRatings(vendorId: string): Promise<{ averageRating: number; totalRatings: number }> {
    try {
      const { data, error } = await supabase
        .from('order_ratings')
        .select(`
          pharmacy_rating,
          medicine_orders!inner(vendor_id)
        `)
        .eq('medicine_orders.vendor_id', vendorId);

      if (error) throw error;

      if (!data || data.length === 0) {
        return { averageRating: 0, totalRatings: 0 };
      }

      const validRatings = data.filter(r => r.pharmacy_rating !== null);
      const sum = validRatings.reduce((acc, r) => acc + (r.pharmacy_rating || 0), 0);
      const average = validRatings.length > 0 ? sum / validRatings.length : 0;

      return {
        averageRating: Math.round(average * 10) / 10,
        totalRatings: validRatings.length
      };
    } catch (error) {
      console.error('Error fetching vendor ratings:', error);
      return { averageRating: 0, totalRatings: 0 };
    }
  }

  async getDeliveryPartnerRating(partnerId: string): Promise<{ averageRating: number; totalRatings: number }> {
    try {
      const { data, error } = await supabase
        .from('order_ratings')
        .select(`
          delivery_rating,
          medicine_orders!inner(delivery_partner_id)
        `)
        .eq('medicine_orders.delivery_partner_id', partnerId);

      if (error) throw error;

      if (!data || data.length === 0) {
        return { averageRating: 0, totalRatings: 0 };
      }

      const validRatings = data.filter(r => r.delivery_rating !== null);
      const sum = validRatings.reduce((acc, r) => acc + (r.delivery_rating || 0), 0);
      const average = validRatings.length > 0 ? sum / validRatings.length : 0;

      return {
        averageRating: Math.round(average * 10) / 10,
        totalRatings: validRatings.length
      };
    } catch (error) {
      console.error('Error fetching delivery partner ratings:', error);
      return { averageRating: 0, totalRatings: 0 };
    }
  }
}

export const ratingService = new RatingService();
