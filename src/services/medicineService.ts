import { supabase } from '@/integrations/supabase/client';

export interface Medicine {
  id: string;
  name: string;
  brand: string;
  generic_name?: string;
  manufacturer: string;
  category: string;
  composition?: string;
  dosage: string;
  form: string;
  pack_size: string;
  mrp: number;
  description?: string;
  side_effects?: string;
  contraindications?: string;
  storage_instructions?: string;
  prescription_required: boolean;
  drug_schedule?: string;
  image_url?: string;
}

export interface VendorMedicine extends Medicine {
  vendor_medicine_id: string;
  vendor_id: string;
  selling_price: number;
  stock_quantity: number;
  discount_percentage: number;
  is_available: boolean;
  expiry_date?: string;
  batch_number?: string;
  pharmacy_name: string;
  vendor_address: string;
  vendor_phone: string;
  distance_km?: number;
}

export interface MedicineOrder {
  id?: string;
  vendor_id: string;
  total_amount: number;
  delivery_fee: number;
  discount_amount: number;
  final_amount: number;
  payment_method: string;
  delivery_address: string;
  customer_phone: string;
  prescription_required: boolean;
  prescription_url?: string;
  items: OrderItem[];
}

export interface OrderItem {
  medicine_id: string;
  vendor_medicine_id: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  total_price: number;
}

class MedicineService {
  async searchMedicines(searchTerm: string, category?: string, userLat?: number, userLng?: number) {
    try {
      let query = supabase
        .from('medicines')
        .select('*')
        .order('name');

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,generic_name.ilike.%${searchTerm}%`);
      }

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data: medicines, error } = await query;

      if (error) throw error;

      // If user location is provided, get medicines with vendor availability
      if (userLat && userLng && medicines) {
        const medicineIds = medicines.map(m => m.id);
        const vendorMedicines = await this.getMedicinesWithVendors(medicineIds, userLat, userLng);
        
        return vendorMedicines;
      }

      return medicines || [];
    } catch (error) {
      console.error('Error searching medicines:', error);
      throw error;
    }
  }

  async getMedicinesWithVendors(medicineIds: string[], userLat: number, userLng: number): Promise<VendorMedicine[]> {
    try {
      const { data, error } = await supabase
        .from('vendor_medicines')
        .select(`
          *,
          medicine:medicines(*),
          vendor:medicine_vendors(
            id,
            pharmacy_name,
            address,
            phone,
            latitude,
            longitude,
            is_verified,
            is_available
          )
        `)
        .in('medicine_id', medicineIds)
        .eq('is_available', true)
        .gt('stock_quantity', 0);

      if (error) throw error;

      const vendorMedicines: VendorMedicine[] = (data || []).map((vm: any) => {
        const distance = this.calculateDistance(
          userLat, 
          userLng, 
          vm.vendor.latitude, 
          vm.vendor.longitude
        );

        return {
          ...vm.medicine,
          vendor_medicine_id: vm.id,
          vendor_id: vm.vendor_id,
          selling_price: vm.selling_price,
          stock_quantity: vm.stock_quantity,
          discount_percentage: vm.discount_percentage,
          is_available: vm.is_available,
          expiry_date: vm.expiry_date,
          batch_number: vm.batch_number,
          pharmacy_name: vm.vendor.pharmacy_name,
          vendor_address: vm.vendor.address,
          vendor_phone: vm.vendor.phone,
          distance_km: distance
        };
      });

      // Sort by distance
      return vendorMedicines.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
    } catch (error) {
      console.error('Error getting medicines with vendors:', error);
      throw error;
    }
  }

  async getNearbyVendors(userLat: number, userLng: number, radiusKm = 10) {
    try {
      const { data, error } = await supabase.rpc('find_nearby_medicine_vendors', {
        user_lat: userLat,
        user_lng: userLng,
        radius_km: radiusKm
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error finding nearby vendors:', error);
      throw error;
    }
  }

  async createOrder(orderData: MedicineOrder): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate order number
      const { data: orderNumber, error: orderNumError } = await supabase.rpc('generate_order_number');
      if (orderNumError) throw orderNumError;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('medicine_orders')
        .insert({
          user_id: user.id,
          vendor_id: orderData.vendor_id,
          order_number: orderNumber,
          total_amount: orderData.total_amount,
          delivery_fee: orderData.delivery_fee,
          discount_amount: orderData.discount_amount,
          final_amount: orderData.final_amount,
          payment_method: orderData.payment_method,
          delivery_address: orderData.delivery_address,
          customer_phone: orderData.customer_phone,
          prescription_required: orderData.prescription_required,
          prescription_url: orderData.prescription_url
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        medicine_id: item.medicine_id,
        vendor_medicine_id: item.vendor_medicine_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount,
        total_price: item.total_price
      }));

      const { error: itemsError } = await supabase
        .from('medicine_order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Create vendor notification
      await this.createVendorNotification(orderData.vendor_id, order.id, 'new_order');

      return { success: true, orderId: order.id };
    } catch (error) {
      console.error('Error creating order:', error);
      return { success: false, error: error.message };
    }
  }

  async uploadPrescription(file: File, orderId?: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('prescriptions')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('prescriptions')
        .getPublicUrl(fileName);

      // Save prescription record
      const { error: dbError } = await supabase
        .from('prescription_uploads')
        .insert({
          user_id: user.id,
          order_id: orderId,
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size
        });

      if (dbError) throw dbError;

      return { success: true, url: publicUrl };
    } catch (error) {
      console.error('Error uploading prescription:', error);
      return { success: false, error: error.message };
    }
  }

  private async createVendorNotification(vendorId: string, orderId: string, type: string) {
    try {
      await supabase
        .from('vendor_notifications')
        .insert({
          vendor_id: vendorId,
          order_id: orderId,
          type,
          title: 'New Medicine Order',
          message: 'You have received a new medicine order. Please review and confirm.',
          priority: 'high'
        });
    } catch (error) {
      console.error('Error creating vendor notification:', error);
    }
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export const medicineService = new MedicineService();