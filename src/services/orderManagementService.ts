import { supabase } from '@/integrations/supabase/client';

export interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  vehicle_type: string;
  vehicle_number: string;
  rating: number;
  is_available: boolean;
  current_latitude?: number;
  current_longitude?: number;
}

export interface PriceUpdate {
  items: Array<{
    medicine_id: string;
    unit_price: number;
  }>;
  handling_charges?: number;
  delivery_fee?: number;
}

class OrderManagementService {
  async updateOrderPrices(orderId: string, priceUpdate: PriceUpdate) {
    try {
      // Calculate total
      const itemsTotal = priceUpdate.items.reduce((sum, item) => sum + item.unit_price, 0);
      const handlingCharges = priceUpdate.handling_charges || 30;
      const deliveryFee = priceUpdate.delivery_fee || 50;
      const totalAmount = itemsTotal;
      const finalAmount = itemsTotal + handlingCharges + deliveryFee;

      // Update order
      const { error: orderError } = await supabase
        .from('medicine_orders')
        .update({
          total_amount: totalAmount,
          final_amount: finalAmount,
          handling_charges: handlingCharges,
          delivery_fee: deliveryFee,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Update order items
      for (const item of priceUpdate.items) {
        const { error: itemError } = await supabase
          .from('medicine_order_items')
          .update({
            unit_price: item.unit_price,
            total_price: item.unit_price // Assuming quantity is 1, adjust if needed
          })
          .eq('order_id', orderId)
          .eq('medicine_id', item.medicine_id);

        if (itemError) throw itemError;
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating order prices:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async assignDeliveryPartner(orderId: string, partnerId: string) {
    try {
      const { error } = await supabase
        .from('medicine_orders')
        .update({
          delivery_partner_id: partnerId,
          order_status: 'out_for_delivery',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error assigning delivery partner:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async updateOrderStatus(orderId: string, status: string, notes?: string) {
    try {
      const { error } = await supabase
        .from('medicine_orders')
        .update({
          order_status: status,
          vendor_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating order status:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async getAvailableDeliveryPartners(vendorLocation?: { latitude: number; longitude: number }, radius = 10): Promise<DeliveryPartner[]> {
    try {
      let query = supabase
        .from('delivery_partners')
        .select('*')
        .eq('is_available', true)
        .eq('is_verified', true);

      const { data, error } = await query;

      if (error) throw error;

      // If location provided, filter by distance
      if (vendorLocation && data) {
        return data.filter(partner => {
          if (!partner.current_latitude || !partner.current_longitude) return false;
          
          const distance = this.calculateDistance(
            vendorLocation.latitude,
            vendorLocation.longitude,
            partner.current_latitude,
            partner.current_longitude
          );
          
          return distance <= radius;
        });
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching delivery partners:', error);
      return [];
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export const orderManagementService = new OrderManagementService();
