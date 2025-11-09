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
  is_custom_medicine?: boolean;
}

export interface CustomMedicine {
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
        .rpc('find_nearby_medicine_vendors', {
          user_lat: userLat,
          user_lng: userLng,
          radius_km: 10
        });

      if (error) throw error;

      const vendors = data || [];
      const vendorMedicines: VendorMedicine[] = [];

      for (const vendor of vendors) {
        const { data: medicines, error: medicineError } = await supabase
          .from('vendor_medicines')
          .select(`
            *,
            medicine:medicines(*)
          `)
          .eq('vendor_id', vendor.id)
          .in('medicine_id', medicineIds)
          .eq('is_available', true)
          .gt('stock_quantity', 0);

        if (medicineError) {
          console.error('Error fetching vendor medicines:', medicineError);
          continue;
        }

        if (medicines) {
          medicines.forEach(vm => {
            if (vm.medicine) {
              vendorMedicines.push({
                ...vm.medicine,
                vendor_medicine_id: vm.id,
                vendor_id: vm.vendor_id,
                selling_price: vm.selling_price,
                stock_quantity: vm.stock_quantity,
                discount_percentage: vm.discount_percentage,
                is_available: vm.is_available,
                expiry_date: vm.expiry_date,
                batch_number: vm.batch_number,
                pharmacy_name: vendor.pharmacy_name,
                vendor_address: vendor.address,
                vendor_phone: vendor.phone,
                distance_km: vendor.distance_km,
                is_custom_medicine: vm.is_custom_medicine
              });
            }
          });
        }
      }

      return vendorMedicines.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
    } catch (error) {
      console.error('Error getting medicines with vendors:', error);
      throw error;
    }
  }

  async getNearbyVendors(userLat: number, userLng: number, radiusKm = 10) {
    try {
      const { data, error } = await supabase
        .rpc('find_nearby_medicine_vendors', {
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

  async searchMedicinesWithFallback(
    searchTerm: string,
    category?: string,
    userLocation?: { lat: number; lng: number }
  ): Promise<{
    medicines: VendorMedicine[];
    searchStrategy: 'nearby' | 'city' | 'catalog';
    vendorsCount: number;
  }> {
    try {
      if (!userLocation) {
        // No location - return catalog
        const catalogMedicines = await this.searchMedicines(searchTerm, category);
        return {
          medicines: catalogMedicines as VendorMedicine[],
          searchStrategy: 'catalog',
          vendorsCount: 0
        };
      }

      // Step 1: Try nearby vendors (10km radius)
      const nearbyMedicines = await this.searchMedicines(
        searchTerm,
        category,
        userLocation.lat,
        userLocation.lng
      );

      if (nearbyMedicines.length > 0) {
        return {
          medicines: nearbyMedicines as VendorMedicine[],
          searchStrategy: 'nearby',
          vendorsCount: new Set(nearbyMedicines.map((m: any) => m.vendor_id)).size
        };
      }

      // Step 2: Fallback to city-wide search (50km radius)
      const cityMedicines = await this.searchMedicines(
        searchTerm,
        category,
        userLocation.lat,
        userLocation.lng
      );

      // Get vendors in wider radius
      const cityVendors = await this.getNearbyVendors(userLocation.lat, userLocation.lng, 50);
      
      if (cityVendors.length > 0 && cityMedicines.length > 0) {
        return {
          medicines: cityMedicines as VendorMedicine[],
          searchStrategy: 'city',
          vendorsCount: cityVendors.length
        };
      }

      // Step 3: Final fallback to catalog
      const catalogMedicines = await this.searchMedicines(searchTerm, category);
      return {
        medicines: catalogMedicines as VendorMedicine[],
        searchStrategy: 'catalog',
        vendorsCount: 0
      };

    } catch (error) {
      console.error('Error in searchMedicinesWithFallback:', error);
      // On error, return catalog
      const catalogMedicines = await this.searchMedicines(searchTerm, category);
      return {
        medicines: catalogMedicines as VendorMedicine[],
        searchStrategy: 'catalog',
        vendorsCount: 0
      };
    }
  }

  async createOrder(orderData: MedicineOrder): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      // Generate order number
      const { data: orderNumberData, error: orderNumberError } = await supabase
        .rpc('generate_order_number');

      if (orderNumberError) throw orderNumberError;

      const orderNumber = orderNumberData;

      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('medicine_orders')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
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

      // Create notification for vendor
      const { error: notificationError } = await supabase
        .from('vendor_notifications')
        .insert({
          vendor_id: orderData.vendor_id,
          order_id: order.id,
          title: 'New Order Received',
          message: `You have received a new order #${orderNumber} worth ₹${orderData.final_amount}`,
          type: 'new_order',
          priority: 'normal'
        });

      if (notificationError) {
        console.warn('Failed to create vendor notification:', notificationError);
      }

      return { success: true, orderId: order.id };
    } catch (error) {
      console.error('Error creating order:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async uploadPrescription(
    file: File, 
    orderId?: string,
    userLocation?: { latitude: number; longitude: number }
  ): Promise<{ success: boolean; url?: string; prescription?: any; broadcast_id?: string; error?: string }> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('prescriptions')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('prescriptions')
        .getPublicUrl(filePath);

      // Save prescription record
      const { data: prescriptionData, error: recordError } = await supabase
        .from('prescription_uploads')
        .insert({
          user_id: user.id,
          order_id: orderId,
          file_url: data.publicUrl,
          file_name: file.name,
          file_size: file.size
        })
        .select()
        .single();

      if (recordError) throw recordError;

      // Immediately broadcast to nearby pharmacies (no OCR needed)
      if (userLocation) {
        try {
          const { data: broadcastData, error: broadcastError } = await supabase.functions.invoke(
            'prescription-broadcast',
            {
              body: {
                prescription_id: prescriptionData.id,
                order_id: orderId,
                patient_id: user.id,
                patient_latitude: userLocation.latitude,
                patient_longitude: userLocation.longitude,
                max_distance_km: 5,
                pharmacies_per_round: 5
              }
            }
          );

          if (broadcastError) {
            console.error('Broadcast error:', broadcastError);
          } else if (broadcastData?.success) {
            return { 
              success: true, 
              url: data.publicUrl, 
              prescription: prescriptionData,
              broadcast_id: broadcastData.broadcast_id
            };
          }
        } catch (broadcastError) {
          console.error('Failed to broadcast prescription:', broadcastError);
        }
      }

      return { success: true, url: data.publicUrl, prescription: prescriptionData };
    } catch (error) {
      console.error('Error uploading prescription:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async forwardPrescriptionToVendors(prescriptionId: string, userLat?: number, userLng?: number) {
    try {
      const nearbyVendors = await this.getNearbyVendors(userLat || 0, userLng || 0, 10);
      if (nearbyVendors.length === 0) {
        return { success: false, error: 'No nearby vendors found' };
      }

      const responseDeadline = new Date(Date.now() + 45 * 1000);
      const { error: updateError } = await supabase
        .from('prescription_uploads')
        .update({
          forwarded_at: new Date().toISOString(),
          response_deadline: responseDeadline.toISOString(),
          forwarding_status: 'forwarded'
        })
        .eq('id', prescriptionId);

      if (updateError) throw updateError;

      const vendorResponses = nearbyVendors.slice(0, 5).map(vendor => ({
        prescription_id: prescriptionId,
        vendor_id: vendor.id,
        response_status: 'pending'
      }));

      const { error: responseError } = await supabase
        .from('vendor_prescription_responses')
        .insert(vendorResponses);

      if (responseError) throw responseError;

      return { success: true, vendorsCount: vendorResponses.length, deadline: responseDeadline };
    } catch (error) {
      console.error('Error forwarding prescription:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to forward prescription' };
    }
  }

  async getPrescriptionResponses(prescriptionId: string) {
    try {
      const { data, error } = await supabase
        .from('vendor_prescription_responses')
        .select(`*, medicine_vendors(pharmacy_name, phone, address)`)
        .eq('prescription_id', prescriptionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { success: true, responses: data };
    } catch (error) {
      console.error('Error getting prescription responses:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get responses' };
    }
  }

  async getVendorMedicines(vendorId: string) {
    try {
      const { data, error } = await supabase
        .from('vendor_medicines')
        .select(`
          *,
          medicine:medicines(*)
        `)
        .eq('vendor_id', vendorId);

      if (error) throw error;
      
      // Transform data to handle custom medicines
      const transformedData = data?.map(item => {
        if (item.is_custom_medicine) {
          // For custom medicines, create a medicine object from custom fields
          return {
            ...item,
            medicine: {
              id: null,
              name: item.custom_medicine_name,
              brand: item.custom_medicine_brand,
              generic_name: item.custom_medicine_generic_name,
              manufacturer: item.custom_medicine_manufacturer,
              category: item.custom_medicine_category,
              composition: item.custom_medicine_composition,
              dosage: item.custom_medicine_dosage,
              form: item.custom_medicine_form,
              pack_size: item.custom_medicine_pack_size,
              mrp: item.custom_medicine_mrp,
              description: item.custom_medicine_description,
              side_effects: item.custom_medicine_side_effects,
              contraindications: item.custom_medicine_contraindications,
              storage_instructions: item.custom_medicine_storage_instructions,
              prescription_required: false,
              drug_schedule: item.custom_medicine_drug_schedule,
              image_url: item.custom_medicine_image_url
            }
          };
        }
        return item;
      });
      
      return transformedData || [];
    } catch (error) {
      console.error('Error fetching vendor medicines:', error);
      throw error;
    }
  }

  async addVendorMedicine(data: {
    vendor_id: string;
    medicine_id?: string;
    selling_price: number;
    stock_quantity: number;
    discount_percentage?: number;
    expiry_date?: string;
    batch_number?: string;
    is_custom_medicine?: boolean;
    custom_medicine?: CustomMedicine;
  }) {
    try {
      let insertData: any = {
        vendor_id: data.vendor_id,
        selling_price: data.selling_price,
        stock_quantity: data.stock_quantity,
        discount_percentage: data.discount_percentage || 0,
        expiry_date: data.expiry_date,
        batch_number: data.batch_number,
        is_available: true,
        is_custom_medicine: data.is_custom_medicine || false
      };

      if (data.is_custom_medicine && data.custom_medicine) {
        // Adding custom medicine
        insertData = {
          ...insertData,
          medicine_id: null,
          custom_medicine_name: data.custom_medicine.name,
          custom_medicine_brand: data.custom_medicine.brand,
          custom_medicine_generic_name: data.custom_medicine.generic_name,
          custom_medicine_manufacturer: data.custom_medicine.manufacturer,
          custom_medicine_category: data.custom_medicine.category,
          custom_medicine_composition: data.custom_medicine.composition,
          custom_medicine_dosage: data.custom_medicine.dosage,
          custom_medicine_form: data.custom_medicine.form,
          custom_medicine_pack_size: data.custom_medicine.pack_size,
          custom_medicine_description: data.custom_medicine.description,
          custom_medicine_side_effects: data.custom_medicine.side_effects,
          custom_medicine_contraindications: data.custom_medicine.contraindications,
          custom_medicine_storage_instructions: data.custom_medicine.storage_instructions,
          custom_medicine_drug_schedule: data.custom_medicine.drug_schedule,
          custom_medicine_image_url: data.custom_medicine.image_url,
          custom_medicine_mrp: data.custom_medicine.mrp
        };
      } else {
        // Adding catalog medicine
        insertData.medicine_id = data.medicine_id;
      }

      const { error } = await supabase
        .from('vendor_medicines')
        .insert(insertData);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error adding vendor medicine:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async updateVendorMedicine(vendorMedicineId: string, data: {
    selling_price?: number;
    stock_quantity?: number;
    discount_percentage?: number;
    is_available?: boolean;
    expiry_date?: string;
    batch_number?: string;
  }) {
    try {
      const { error } = await supabase
        .from('vendor_medicines')
        .update(data)
        .eq('id', vendorMedicineId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating vendor medicine:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async deleteVendorMedicine(vendorMedicineId: string) {
    try {
      const { error } = await supabase
        .from('vendor_medicines')
        .delete()
        .eq('id', vendorMedicineId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting vendor medicine:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async getAllMedicines() {
    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all medicines:', error);
      throw error;
    }
  }

  async approvePrescription(orderId: string, vendorId: string, approved: boolean, rejectionReason?: string) {
    try {
      const updateData: any = {
        prescription_status: approved ? 'approved' : 'rejected',
        prescription_approved_by: vendorId
      };

      if (approved) {
        updateData.prescription_approved_at = new Date().toISOString();
      } else if (rejectionReason) {
        updateData.prescription_rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('medicine_orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      // Create notification for customer
      const { data: orderData } = await supabase
        .from('medicine_orders')
        .select('user_id, order_number')
        .eq('id', orderId)
        .single();

      if (orderData) {
        // Here you could create a customer notification if you have that table
        console.log(`Prescription ${approved ? 'approved' : 'rejected'} for order ${orderData.order_number}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating prescription status:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async extractMedicinesFromPrescription(prescriptionId: string, imageUrl: string) {
    try {
      const { data, error } = await supabase.functions.invoke('ocr-prescription', {
        body: {
          prescription_id: prescriptionId,
          image_url: imageUrl
        }
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('OCR extraction error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async getMedicineAlternatives(medicineId: string) {
    try {
      const { data, error } = await supabase
        .from('medicine_alternatives')
        .select(`
          *,
          alternative:medicines!alternative_medicine_id(*)
        `)
        .eq('primary_medicine_id', medicineId);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching alternatives:', error);
      return [];
    }
  }
}

export const medicineService = new MedicineService();