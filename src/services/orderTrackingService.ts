import { supabase } from '@/integrations/supabase/client';

export interface OrderStatus {
  id: string;
  order_id: string;
  status: string;
  notes?: string;
  updated_by_role: string;
  created_at: string;
  location_latitude?: number;
  location_longitude?: number;
}

export interface OrderWithTracking {
  id: string;
  order_number: string;
  order_status: string;
  payment_status: string;
  payment_method: string;
  total_amount: number;
  final_amount: number;
  delivery_address: string;
  customer_phone: string;
  estimated_delivery_time?: string;
  delivered_at?: string;
  created_at: string;
  vendor: {
    pharmacy_name: string;
    phone: string;
    address: string;
  };
  delivery_partner?: {
    name: string;
    phone: string;
    vehicle_number: string;
  };
  items: Array<{
    medicine_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  status_history: OrderStatus[];
}

class OrderTrackingService {
  async getUserOrders(userId: string): Promise<OrderWithTracking[]> {
    try {
      const { data: orders, error } = await supabase
        .from('medicine_orders')
        .select(`
          *,
          vendor:medicine_vendors!medicine_orders_vendor_id_fkey(pharmacy_name, phone, address),
          items:medicine_order_items(
            quantity,
            unit_price,
            total_price,
            medicine:medicines(name)
          ),
          status_history:medicine_order_status_history(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch delivery partners separately for orders that have them
      const ordersWithPartners = await Promise.all(
        (orders || []).map(async (order) => {
          let delivery_partner = undefined;
          if (order.delivery_partner_id) {
            const { data: partner } = await supabase
              .from('delivery_partners')
              .select('name, phone, vehicle_number')
              .eq('id', order.delivery_partner_id)
              .maybeSingle();
            delivery_partner = partner || undefined;
          }

          return {
            ...order,
            delivery_partner,
            items: order.items?.map((item: any) => ({
              medicine_name: item.medicine?.name || 'Unknown',
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price
            })) || [],
            status_history: order.status_history?.sort((a: any, b: any) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            ) || []
          };
        })
      );

      return ordersWithPartners;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw error;
    }
  }

  async getOrderDetails(orderId: string): Promise<OrderWithTracking | null> {
    try {
      const { data: order, error } = await supabase
        .from('medicine_orders')
        .select(`
          *,
          vendor:medicine_vendors!medicine_orders_vendor_id_fkey(pharmacy_name, phone, address),
          items:medicine_order_items(
            quantity,
            unit_price,
            total_price,
            medicine:medicines(name, brand)
          ),
          status_history:medicine_order_status_history(*)
        `)
        .eq('id', orderId)
        .maybeSingle();

      if (error) throw error;
      if (!order) return null;

      // Fetch delivery partner separately if assigned
      let delivery_partner = undefined;
      if (order.delivery_partner_id) {
        const { data: partner } = await supabase
          .from('delivery_partners')
          .select('name, phone, vehicle_number')
          .eq('id', order.delivery_partner_id)
          .maybeSingle();
        delivery_partner = partner || undefined;
      }

      return {
        ...order,
        delivery_partner,
        items: order.items?.map((item: any) => ({
          medicine_name: item.medicine?.name || 'Unknown',
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        })) || [],
        status_history: order.status_history?.sort((a: any, b: any) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ) || []
      };
    } catch (error) {
      console.error('Error fetching order details:', error);
      return null;
    }
  }

  async cancelOrder(orderId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: order, error: fetchError } = await supabase
        .from('medicine_orders')
        .select('order_status, created_at, user_id')
        .eq('id', orderId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!order) return { success: false, error: 'Order not found' };

      const { data: { user } } = await supabase.auth.getUser();
      if (order.user_id !== user?.id) {
        return { success: false, error: 'Unauthorized' };
      }

      if (!['placed', 'confirmed'].includes(order.order_status)) {
        return { success: false, error: 'Order cannot be cancelled at this stage' };
      }

      const orderTime = new Date(order.created_at).getTime();
      const now = Date.now();
      const timeDiff = (now - orderTime) / 1000 / 60;

      if (timeDiff > 5) {
        return { success: false, error: 'Cancellation time window has passed' };
      }

      const { error: updateError } = await supabase
        .from('medicine_orders')
        .update({
          order_status: 'cancelled',
          rejection_reason: reason
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      return { success: true };
    } catch (error) {
      console.error('Error cancelling order:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  subscribeToOrderUpdates(orderId: string, callback: (order: any) => void) {
    const channel = supabase
      .channel(`order-updates-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'medicine_orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'medicine_order_status_history',
          filter: `order_id=eq.${orderId}`
        },
        () => {
          this.getOrderDetails(orderId).then(callback);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const orderTrackingService = new OrderTrackingService();
