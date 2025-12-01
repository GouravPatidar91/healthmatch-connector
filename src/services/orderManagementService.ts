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
}

export interface OrderUpdateWithItems {
  existingItems: Array<{
    medicine_id: string;
    unit_price: number;
  }>;
  newItems: Array<{
    name: string;
    quantity: number;
    unit_price: number;
  }>;
  handlingCharges: number;
  deliveryFee: number;
}

class OrderManagementService {
  async updateOrderPrices(orderId: string, priceUpdate: PriceUpdate): Promise<{ success: boolean; error?: string }> {
    try {
      // Get existing order to preserve system-calculated charges and get user_id
      const { data: existingOrder, error: fetchError } = await supabase
        .from('medicine_orders')
        .select('handling_charges, delivery_fee, discount_amount, coupon_discount, tip_amount, user_id, order_number')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      // Update individual item prices and calculate new medicine total
      let medicineTotal = 0;
      for (const item of priceUpdate.items) {
        // Get quantity for this item
        const { data: orderItem, error: itemFetchError } = await supabase
          .from('medicine_order_items')
          .select('quantity')
          .eq('order_id', orderId)
          .eq('medicine_id', item.medicine_id)
          .single();

        if (itemFetchError) throw itemFetchError;

        const totalPrice = item.unit_price * orderItem.quantity;
        medicineTotal += totalPrice;

        const { error: itemError } = await supabase
          .from('medicine_order_items')
          .update({
            unit_price: item.unit_price,
            total_price: totalPrice
          })
          .eq('order_id', orderId)
          .eq('medicine_id', item.medicine_id);

        if (itemError) throw itemError;
      }

      // Calculate final amount: medicine total + system charges
      const finalAmount = medicineTotal + 
        existingOrder.handling_charges + 
        existingOrder.delivery_fee + 
        (existingOrder.tip_amount || 0) -
        (existingOrder.discount_amount || 0) -
        (existingOrder.coupon_discount || 0);

      // Update order totals (preserve system-calculated charges)
      const { error: orderError } = await supabase
        .from('medicine_orders')
        .update({
          total_amount: medicineTotal,
          final_amount: finalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Create notification for customer
      const { error: notificationError } = await supabase
        .from('customer_notifications')
        .insert({
          user_id: existingOrder.user_id,
          order_id: orderId,
          type: 'price_update',
          title: 'Order Prices Updated',
          message: `The pharmacy has updated the prices for your order #${existingOrder.order_number}. New total: ₹${finalAmount.toFixed(2)}`,
          metadata: {
            old_total: existingOrder.handling_charges + existingOrder.delivery_fee + (existingOrder.tip_amount || 0),
            new_total: finalAmount,
            medicine_total: medicineTotal
          }
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Don't fail the entire operation if notification fails
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

  async updateOrderPricesWithItems(
    orderId: string, 
    update: OrderUpdateWithItems
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get existing order info
      const { data: existingOrder, error: fetchError } = await supabase
        .from('medicine_orders')
        .select('user_id, order_number, vendor_id, discount_amount, coupon_discount, tip_amount')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      let medicineTotal = 0;

      // Update existing items
      for (const item of update.existingItems) {
        const { data: orderItem, error: itemFetchError } = await supabase
          .from('medicine_order_items')
          .select('quantity')
          .eq('order_id', orderId)
          .eq('medicine_id', item.medicine_id)
          .single();

        if (itemFetchError) throw itemFetchError;

        const totalPrice = item.unit_price * orderItem.quantity;
        medicineTotal += totalPrice;

        const { error: itemError } = await supabase
          .from('medicine_order_items')
          .update({
            unit_price: item.unit_price,
            total_price: totalPrice
          })
          .eq('order_id', orderId)
          .eq('medicine_id', item.medicine_id);

        if (itemError) throw itemError;
      }

      // Insert new medicine items
      for (const newItem of update.newItems) {
        // First, get or create a medicine record with a placeholder ID
        // For prescription orders, we'll create custom medicine entries
        const { data: medicine, error: medicineError } = await supabase
          .from('medicines')
          .select('id')
          .eq('name', newItem.name)
          .maybeSingle();

        let medicineId: string;

        if (medicine) {
          medicineId = medicine.id;
        } else {
          // Create a basic medicine entry
          const { data: newMedicine, error: createError } = await supabase
            .from('medicines')
            .insert({
              name: newItem.name,
              brand: 'Generic',
              category: 'Other',
              form: 'Tablet',
              dosage: 'As prescribed',
              pack_size: '1',
              manufacturer: 'Various',
              mrp: newItem.unit_price,
              prescription_required: true
            })
            .select('id')
            .single();

          if (createError) throw createError;
          medicineId = newMedicine.id;
        }

        // Get vendor_medicine or create one
        const { data: vendorMedicine, error: vendorMedError } = await supabase
          .from('vendor_medicines')
          .select('id')
          .eq('vendor_id', existingOrder.vendor_id)
          .eq('medicine_id', medicineId)
          .maybeSingle();

        let vendorMedicineId: string;

        if (vendorMedicine) {
          vendorMedicineId = vendorMedicine.id;
        } else {
          const { data: newVendorMed, error: createVendorMedError } = await supabase
            .from('vendor_medicines')
            .insert({
              vendor_id: existingOrder.vendor_id,
              medicine_id: medicineId,
              selling_price: newItem.unit_price,
              stock_quantity: 100,
              is_available: true
            })
            .select('id')
            .single();

          if (createVendorMedError) throw createVendorMedError;
          vendorMedicineId = newVendorMed.id;
        }

        // Insert order item
        const totalPrice = newItem.unit_price * newItem.quantity;
        medicineTotal += totalPrice;

        const { error: insertError } = await supabase
          .from('medicine_order_items')
          .insert({
            order_id: orderId,
            medicine_id: medicineId,
            vendor_medicine_id: vendorMedicineId,
            quantity: newItem.quantity,
            unit_price: newItem.unit_price,
            total_price: totalPrice
          });

        if (insertError) throw insertError;
      }

      // Calculate final amount
      const finalAmount = medicineTotal + 
        update.handlingCharges + 
        update.deliveryFee + 
        (existingOrder.tip_amount || 0) -
        (existingOrder.discount_amount || 0) -
        (existingOrder.coupon_discount || 0);

      // Update order totals with new charges
      const { error: orderError } = await supabase
        .from('medicine_orders')
        .update({
          total_amount: medicineTotal,
          handling_charges: update.handlingCharges,
          delivery_fee: update.deliveryFee,
          final_amount: finalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Create notification
      const { error: notificationError } = await supabase
        .from('customer_notifications')
        .insert({
          user_id: existingOrder.user_id,
          order_id: orderId,
          type: 'price_update',
          title: 'Order Details Updated',
          message: `Your order #${existingOrder.order_number} has been updated. Total amount: ₹${finalAmount.toFixed(2)}`,
          metadata: {
            medicine_total: medicineTotal,
            handling_charges: update.handlingCharges,
            delivery_fee: update.deliveryFee,
            final_amount: finalAmount
          }
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating order with items:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async updateOrderStatusWithHistory(
    orderId: string, 
    status: string, 
    notes?: string,
    userId?: string,
    userRole?: string
  ) {
    try {
      // Update order status
      const { error: orderError } = await supabase
        .from('medicine_orders')
        .update({
          order_status: status,
          updated_at: new Date().toISOString(),
          ...(status === 'delivered' && { delivered_at: new Date().toISOString() })
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Insert status history
      const { error: historyError } = await supabase
        .from('medicine_order_status_history')
        .insert({
          order_id: orderId,
          status,
          notes,
          updated_by: userId,
          updated_by_role: userRole,
          created_at: new Date().toISOString()
        });

      if (historyError) throw historyError;

      return { success: true };
    } catch (error) {
      console.error('Error updating order status with history:', error);
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
