export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      appointment_slots: {
        Row: {
          created_at: string
          date: string
          doctor_id: string
          duration: number
          end_time: string
          id: string
          max_patients: number
          patient_name: string | null
          reason: string | null
          start_time: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          date: string
          doctor_id: string
          duration: number
          end_time: string
          id?: string
          max_patients?: number
          patient_name?: string | null
          reason?: string | null
          start_time: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          doctor_id?: string
          duration?: number
          end_time?: string
          id?: string
          max_patients?: number
          patient_name?: string | null
          reason?: string | null
          start_time?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_slots_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_slots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          created_at: string
          date: string
          doctor_id: string
          doctor_name: string
          doctor_specialty: string | null
          id: string
          notes: string | null
          reason: string | null
          status: string | null
          time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          doctor_id: string
          doctor_name: string
          doctor_specialty?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          status?: string | null
          time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          doctor_id?: string
          doctor_name?: string
          doctor_specialty?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          status?: string | null
          time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_discount_amount: number | null
          min_order_amount: number | null
          usage_count: number | null
          usage_limit: number | null
          valid_from: string | null
          valid_until: string
        }
        Insert: {
          code: string
          created_at?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_order_amount?: number | null
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string | null
          valid_until: string
        }
        Update: {
          code?: string
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_order_amount?: number | null
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string
        }
        Relationships: []
      }
      delivery_partners: {
        Row: {
          created_at: string
          current_latitude: number | null
          current_longitude: number | null
          id: string
          is_available: boolean | null
          is_verified: boolean | null
          license_number: string | null
          location_updated_at: string | null
          max_delivery_radius_km: number | null
          name: string
          phone: string
          rating: number | null
          total_deliveries: number | null
          updated_at: string
          user_id: string
          vehicle_number: string
          vehicle_type: string
        }
        Insert: {
          created_at?: string
          current_latitude?: number | null
          current_longitude?: number | null
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          license_number?: string | null
          location_updated_at?: string | null
          max_delivery_radius_km?: number | null
          name: string
          phone: string
          rating?: number | null
          total_deliveries?: number | null
          updated_at?: string
          user_id: string
          vehicle_number: string
          vehicle_type: string
        }
        Update: {
          created_at?: string
          current_latitude?: number | null
          current_longitude?: number | null
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          license_number?: string | null
          location_updated_at?: string | null
          max_delivery_radius_km?: number | null
          name?: string
          phone?: string
          rating?: number | null
          total_deliveries?: number | null
          updated_at?: string
          user_id?: string
          vehicle_number?: string
          vehicle_type?: string
        }
        Relationships: []
      }
      delivery_requests: {
        Row: {
          created_at: string | null
          delivery_partner_id: string
          expires_at: string
          id: string
          order_id: string
          rejection_reason: string | null
          responded_at: string | null
          status: string
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          delivery_partner_id: string
          expires_at: string
          id?: string
          order_id: string
          rejection_reason?: string | null
          responded_at?: string | null
          status?: string
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          delivery_partner_id?: string
          expires_at?: string
          id?: string
          order_id?: string
          rejection_reason?: string | null
          responded_at?: string | null
          status?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_requests_delivery_partner_id_fkey"
            columns: ["delivery_partner_id"]
            isOneToOne: false
            referencedRelation: "delivery_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "medicine_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_requests_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "medicine_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      device_tokens: {
        Row: {
          created_at: string
          delivery_partner_id: string | null
          device_info: Json | null
          id: string
          is_active: boolean
          last_used_at: string | null
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_partner_id?: string | null
          device_info?: Json | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_partner_id?: string | null
          device_info?: Json | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_tokens_delivery_partner_id_fkey"
            columns: ["delivery_partner_id"]
            isOneToOne: false
            referencedRelation: "delivery_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_notifications: {
        Row: {
          appointment_id: string
          created_at: string
          doctor_id: string
          health_check_id: string
          id: string
          patient_id: string
          status: string
          symptoms_data: Json
          updated_at: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          doctor_id: string
          health_check_id: string
          id?: string
          patient_id: string
          status?: string
          symptoms_data: Json
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          doctor_id?: string
          health_check_id?: string
          id?: string
          patient_id?: string
          status?: string
          symptoms_data?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_notifications_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_notifications_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_notifications_health_check_id_fkey"
            columns: ["health_check_id"]
            isOneToOne: false
            referencedRelation: "health_checks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_notifications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          address: string
          available: boolean
          clinic_address: string | null
          clinic_latitude: number | null
          clinic_longitude: number | null
          created_at: string
          degree_verification_photo: string | null
          degrees: string
          email: string | null
          experience: number
          hospital: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          region: string
          registration_number: string
          specialization: string
          verified: boolean | null
        }
        Insert: {
          address: string
          available?: boolean
          clinic_address?: string | null
          clinic_latitude?: number | null
          clinic_longitude?: number | null
          created_at?: string
          degree_verification_photo?: string | null
          degrees: string
          email?: string | null
          experience: number
          hospital: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          region: string
          registration_number: string
          specialization: string
          verified?: boolean | null
        }
        Update: {
          address?: string
          available?: boolean
          clinic_address?: string | null
          clinic_latitude?: number | null
          clinic_longitude?: number | null
          created_at?: string
          degree_verification_photo?: string | null
          degrees?: string
          email?: string | null
          experience?: number
          hospital?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          region?: string
          registration_number?: string
          specialization?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_calls: {
        Row: {
          address: string
          age: number | null
          created_at: string
          doctor_id: string | null
          gender: string | null
          id: string
          patient_name: string
          severity: string | null
          status: string
          symptoms: string[]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address: string
          age?: number | null
          created_at?: string
          doctor_id?: string | null
          gender?: string | null
          id?: string
          patient_name: string
          severity?: string | null
          status?: string
          symptoms: string[]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string
          age?: number | null
          created_at?: string
          doctor_id?: string | null
          gender?: string | null
          id?: string
          patient_name?: string
          severity?: string | null
          status?: string
          symptoms?: string[]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      health_checks: {
        Row: {
          analysis_results: Json | null
          comprehensive_analysis: boolean | null
          created_at: string
          duration: string | null
          id: string
          medications: string[] | null
          notes: string | null
          overall_assessment: string | null
          previous_conditions: string[] | null
          severity: string | null
          symptom_photos: Json | null
          symptoms: string[] | null
          urgency_level: string | null
          user_id: string
        }
        Insert: {
          analysis_results?: Json | null
          comprehensive_analysis?: boolean | null
          created_at?: string
          duration?: string | null
          id?: string
          medications?: string[] | null
          notes?: string | null
          overall_assessment?: string | null
          previous_conditions?: string[] | null
          severity?: string | null
          symptom_photos?: Json | null
          symptoms?: string[] | null
          urgency_level?: string | null
          user_id: string
        }
        Update: {
          analysis_results?: Json | null
          comprehensive_analysis?: boolean | null
          created_at?: string
          duration?: string | null
          id?: string
          medications?: string[] | null
          notes?: string | null
          overall_assessment?: string | null
          previous_conditions?: string[] | null
          severity?: string | null
          symptom_photos?: Json | null
          symptoms?: string[] | null
          urgency_level?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_checks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_alternatives: {
        Row: {
          alternative_medicine_id: string | null
          composition: string
          created_at: string | null
          id: string
          price_difference_percentage: number | null
          primary_medicine_id: string | null
          verification_notes: string | null
          verified_by: string | null
          verified_by_pharmacist: boolean | null
        }
        Insert: {
          alternative_medicine_id?: string | null
          composition: string
          created_at?: string | null
          id?: string
          price_difference_percentage?: number | null
          primary_medicine_id?: string | null
          verification_notes?: string | null
          verified_by?: string | null
          verified_by_pharmacist?: boolean | null
        }
        Update: {
          alternative_medicine_id?: string | null
          composition?: string
          created_at?: string | null
          id?: string
          price_difference_percentage?: number | null
          primary_medicine_id?: string | null
          verification_notes?: string | null
          verified_by?: string | null
          verified_by_pharmacist?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "medicine_alternatives_alternative_medicine_id_fkey"
            columns: ["alternative_medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_alternatives_primary_medicine_id_fkey"
            columns: ["primary_medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_order_items: {
        Row: {
          created_at: string
          discount_amount: number | null
          id: string
          medicine_id: string
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
          vendor_medicine_id: string
        }
        Insert: {
          created_at?: string
          discount_amount?: number | null
          id?: string
          medicine_id: string
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
          vendor_medicine_id: string
        }
        Update: {
          created_at?: string
          discount_amount?: number | null
          id?: string
          medicine_id?: string
          order_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
          vendor_medicine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicine_order_items_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "medicine_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_order_items_vendor_medicine_id_fkey"
            columns: ["vendor_medicine_id"]
            isOneToOne: false
            referencedRelation: "vendor_medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_order_status_history: {
        Row: {
          created_at: string | null
          id: string
          location_latitude: number | null
          location_longitude: number | null
          notes: string | null
          order_id: string
          status: string
          updated_by: string | null
          updated_by_role: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          location_latitude?: number | null
          location_longitude?: number | null
          notes?: string | null
          order_id: string
          status: string
          updated_by?: string | null
          updated_by_role?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          location_latitude?: number | null
          location_longitude?: number | null
          notes?: string | null
          order_id?: string
          status?: string
          updated_by?: string | null
          updated_by_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicine_order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "medicine_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_orders: {
        Row: {
          coupon_code: string | null
          coupon_discount: number | null
          created_at: string
          customer_phone: string
          delivered_at: string | null
          delivery_address: string
          delivery_fee: number | null
          delivery_latitude: number | null
          delivery_longitude: number | null
          delivery_partner_id: string | null
          discount_amount: number | null
          estimated_delivery_time: string | null
          final_amount: number
          handling_charges: number | null
          id: string
          order_number: string
          order_status: string | null
          payment_method: string
          payment_status: string | null
          prescription_approved_at: string | null
          prescription_approved_by: string | null
          prescription_rejection_reason: string | null
          prescription_required: boolean | null
          prescription_status: string | null
          prescription_url: string | null
          rejection_reason: string | null
          tip_amount: number | null
          total_amount: number
          updated_at: string
          user_id: string
          vendor_id: string
          vendor_notes: string | null
        }
        Insert: {
          coupon_code?: string | null
          coupon_discount?: number | null
          created_at?: string
          customer_phone: string
          delivered_at?: string | null
          delivery_address: string
          delivery_fee?: number | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          delivery_partner_id?: string | null
          discount_amount?: number | null
          estimated_delivery_time?: string | null
          final_amount: number
          handling_charges?: number | null
          id?: string
          order_number: string
          order_status?: string | null
          payment_method: string
          payment_status?: string | null
          prescription_approved_at?: string | null
          prescription_approved_by?: string | null
          prescription_rejection_reason?: string | null
          prescription_required?: boolean | null
          prescription_status?: string | null
          prescription_url?: string | null
          rejection_reason?: string | null
          tip_amount?: number | null
          total_amount: number
          updated_at?: string
          user_id: string
          vendor_id: string
          vendor_notes?: string | null
        }
        Update: {
          coupon_code?: string | null
          coupon_discount?: number | null
          created_at?: string
          customer_phone?: string
          delivered_at?: string | null
          delivery_address?: string
          delivery_fee?: number | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          delivery_partner_id?: string | null
          discount_amount?: number | null
          estimated_delivery_time?: string | null
          final_amount?: number
          handling_charges?: number | null
          id?: string
          order_number?: string
          order_status?: string | null
          payment_method?: string
          payment_status?: string | null
          prescription_approved_at?: string | null
          prescription_approved_by?: string | null
          prescription_rejection_reason?: string | null
          prescription_required?: boolean | null
          prescription_status?: string | null
          prescription_url?: string | null
          rejection_reason?: string | null
          tip_amount?: number | null
          total_amount?: number
          updated_at?: string
          user_id?: string
          vendor_id?: string
          vendor_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicine_orders_delivery_partner_id_fkey"
            columns: ["delivery_partner_id"]
            isOneToOne: false
            referencedRelation: "delivery_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_orders_prescription_approved_by_fkey"
            columns: ["prescription_approved_by"]
            isOneToOne: false
            referencedRelation: "medicine_vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "medicine_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_vendors: {
        Row: {
          address: string
          city: string
          created_at: string
          delivery_radius_km: number | null
          email: string | null
          id: string
          is_available: boolean | null
          is_verified: boolean | null
          latitude: number | null
          license_document_url: string | null
          license_number: string
          longitude: number | null
          operating_hours: Json | null
          owner_name: string
          pharmacy_name: string
          phone: string
          region: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          delivery_radius_km?: number | null
          email?: string | null
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          license_document_url?: string | null
          license_number: string
          longitude?: number | null
          operating_hours?: Json | null
          owner_name: string
          pharmacy_name: string
          phone: string
          region: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          delivery_radius_km?: number | null
          email?: string | null
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          license_document_url?: string | null
          license_number?: string
          longitude?: number | null
          operating_hours?: Json | null
          owner_name?: string
          pharmacy_name?: string
          phone?: string
          region?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      medicines: {
        Row: {
          brand: string
          category: string
          composition: string | null
          contraindications: string | null
          created_at: string
          description: string | null
          dosage: string
          drug_schedule: string | null
          form: string
          generic_name: string | null
          id: string
          image_url: string | null
          manufacturer: string
          mrp: number
          name: string
          pack_size: string
          prescription_required: boolean | null
          side_effects: string | null
          storage_instructions: string | null
          updated_at: string
        }
        Insert: {
          brand: string
          category: string
          composition?: string | null
          contraindications?: string | null
          created_at?: string
          description?: string | null
          dosage: string
          drug_schedule?: string | null
          form: string
          generic_name?: string | null
          id?: string
          image_url?: string | null
          manufacturer: string
          mrp: number
          name: string
          pack_size: string
          prescription_required?: boolean | null
          side_effects?: string | null
          storage_instructions?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string
          category?: string
          composition?: string | null
          contraindications?: string | null
          created_at?: string
          description?: string | null
          dosage?: string
          drug_schedule?: string | null
          form?: string
          generic_name?: string | null
          id?: string
          image_url?: string | null
          manufacturer?: string
          mrp?: number
          name?: string
          pack_size?: string
          prescription_required?: boolean | null
          side_effects?: string | null
          storage_instructions?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      order_ratings: {
        Row: {
          created_at: string | null
          delivery_rating: number | null
          id: string
          order_id: string
          pharmacy_rating: number | null
          rating: number
          review: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          delivery_rating?: number | null
          id?: string
          order_id: string
          pharmacy_rating?: number | null
          rating: number
          review?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          delivery_rating?: number | null
          id?: string
          order_id?: string
          pharmacy_rating?: number | null
          rating?: number
          review?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_ratings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "medicine_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_tracking: {
        Row: {
          created_at: string
          id: string
          location_latitude: number | null
          location_longitude: number | null
          notes: string | null
          order_id: string
          status: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          location_latitude?: number | null
          location_longitude?: number | null
          notes?: string | null
          order_id: string
          status: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          location_latitude?: number | null
          location_longitude?: number | null
          notes?: string | null
          order_id?: string
          status?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_tracking_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "medicine_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_notification_queue: {
        Row: {
          broadcast_id: string | null
          id: string
          notification_status: string | null
          notified_at: string | null
          rejection_reason: string | null
          responded_at: string | null
          response_type: string | null
          vendor_id: string | null
        }
        Insert: {
          broadcast_id?: string | null
          id?: string
          notification_status?: string | null
          notified_at?: string | null
          rejection_reason?: string | null
          responded_at?: string | null
          response_type?: string | null
          vendor_id?: string | null
        }
        Update: {
          broadcast_id?: string | null
          id?: string
          notification_status?: string | null
          notified_at?: string | null
          rejection_reason?: string | null
          responded_at?: string | null
          response_type?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_notification_queue_broadcast_id_fkey"
            columns: ["broadcast_id"]
            isOneToOne: false
            referencedRelation: "prescription_broadcasts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_notification_queue_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "medicine_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription_broadcasts: {
        Row: {
          accepted_at: string | null
          accepted_by_vendor_id: string | null
          broadcast_round: number | null
          created_at: string | null
          id: string
          order_id: string | null
          patient_id: string
          patient_latitude: number
          patient_longitude: number
          prescription_id: string | null
          status: string | null
          timeout_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by_vendor_id?: string | null
          broadcast_round?: number | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          patient_id: string
          patient_latitude: number
          patient_longitude: number
          prescription_id?: string | null
          status?: string | null
          timeout_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by_vendor_id?: string | null
          broadcast_round?: number | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          patient_id?: string
          patient_latitude?: number
          patient_longitude?: number
          prescription_id?: string | null
          status?: string | null
          timeout_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescription_broadcasts_accepted_by_vendor_id_fkey"
            columns: ["accepted_by_vendor_id"]
            isOneToOne: false
            referencedRelation: "medicine_vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_broadcasts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "medicine_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_broadcasts_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescription_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription_ocr_logs: {
        Row: {
          api_provider: string | null
          confidence_scores: Json | null
          created_at: string | null
          error_details: string | null
          extracted_medicines: Json | null
          id: string
          prescription_id: string | null
          processing_time_ms: number | null
          raw_text: string | null
        }
        Insert: {
          api_provider?: string | null
          confidence_scores?: Json | null
          created_at?: string | null
          error_details?: string | null
          extracted_medicines?: Json | null
          id?: string
          prescription_id?: string | null
          processing_time_ms?: number | null
          raw_text?: string | null
        }
        Update: {
          api_provider?: string | null
          confidence_scores?: Json | null
          created_at?: string | null
          error_details?: string | null
          extracted_medicines?: Json | null
          id?: string
          prescription_id?: string | null
          processing_time_ms?: number | null
          raw_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescription_ocr_logs_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescription_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription_uploads: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_url: string
          forwarded_at: string | null
          forwarding_status: string | null
          id: string
          medicines_detected: number | null
          ocr_confidence_score: number | null
          ocr_error_message: string | null
          ocr_extracted_data: Json | null
          ocr_processed_at: string | null
          ocr_status: string | null
          order_id: string | null
          response_deadline: string | null
          upload_status: string | null
          user_id: string
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_url: string
          forwarded_at?: string | null
          forwarding_status?: string | null
          id?: string
          medicines_detected?: number | null
          ocr_confidence_score?: number | null
          ocr_error_message?: string | null
          ocr_extracted_data?: Json | null
          ocr_processed_at?: string | null
          ocr_status?: string | null
          order_id?: string | null
          response_deadline?: string | null
          upload_status?: string | null
          user_id: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          forwarded_at?: string | null
          forwarding_status?: string | null
          id?: string
          medicines_detected?: number | null
          ocr_confidence_score?: number | null
          ocr_error_message?: string | null
          ocr_extracted_data?: Json | null
          ocr_processed_at?: string | null
          ocr_status?: string | null
          order_id?: string | null
          response_deadline?: string | null
          upload_status?: string | null
          user_id?: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescription_uploads_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "medicine_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          allergies: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          date_of_birth: string | null
          delivery_address: string | null
          delivery_latitude: number | null
          delivery_longitude: number | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          first_name: string | null
          gender: string | null
          id: string
          is_admin: boolean | null
          is_doctor: boolean | null
          last_name: string | null
          medical_history: string | null
          medications: string | null
          phone: string | null
          region: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          allergies?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          delivery_address?: string | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          first_name?: string | null
          gender?: string | null
          id: string
          is_admin?: boolean | null
          is_doctor?: boolean | null
          last_name?: string | null
          medical_history?: string | null
          medications?: string | null
          phone?: string | null
          region?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          allergies?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          delivery_address?: string | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          is_admin?: boolean | null
          is_doctor?: boolean | null
          last_name?: string | null
          medical_history?: string | null
          medications?: string | null
          phone?: string | null
          region?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_medicines: {
        Row: {
          batch_number: string | null
          created_at: string
          custom_medicine_brand: string | null
          custom_medicine_category: string | null
          custom_medicine_composition: string | null
          custom_medicine_contraindications: string | null
          custom_medicine_description: string | null
          custom_medicine_dosage: string | null
          custom_medicine_drug_schedule: string | null
          custom_medicine_form: string | null
          custom_medicine_generic_name: string | null
          custom_medicine_image_url: string | null
          custom_medicine_manufacturer: string | null
          custom_medicine_mrp: number | null
          custom_medicine_name: string | null
          custom_medicine_pack_size: string | null
          custom_medicine_side_effects: string | null
          custom_medicine_storage_instructions: string | null
          discount_percentage: number | null
          expiry_date: string | null
          id: string
          is_available: boolean | null
          is_custom_medicine: boolean | null
          medicine_id: string
          selling_price: number
          stock_quantity: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          batch_number?: string | null
          created_at?: string
          custom_medicine_brand?: string | null
          custom_medicine_category?: string | null
          custom_medicine_composition?: string | null
          custom_medicine_contraindications?: string | null
          custom_medicine_description?: string | null
          custom_medicine_dosage?: string | null
          custom_medicine_drug_schedule?: string | null
          custom_medicine_form?: string | null
          custom_medicine_generic_name?: string | null
          custom_medicine_image_url?: string | null
          custom_medicine_manufacturer?: string | null
          custom_medicine_mrp?: number | null
          custom_medicine_name?: string | null
          custom_medicine_pack_size?: string | null
          custom_medicine_side_effects?: string | null
          custom_medicine_storage_instructions?: string | null
          discount_percentage?: number | null
          expiry_date?: string | null
          id?: string
          is_available?: boolean | null
          is_custom_medicine?: boolean | null
          medicine_id: string
          selling_price: number
          stock_quantity?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          batch_number?: string | null
          created_at?: string
          custom_medicine_brand?: string | null
          custom_medicine_category?: string | null
          custom_medicine_composition?: string | null
          custom_medicine_contraindications?: string | null
          custom_medicine_description?: string | null
          custom_medicine_dosage?: string | null
          custom_medicine_drug_schedule?: string | null
          custom_medicine_form?: string | null
          custom_medicine_generic_name?: string | null
          custom_medicine_image_url?: string | null
          custom_medicine_manufacturer?: string | null
          custom_medicine_mrp?: number | null
          custom_medicine_name?: string | null
          custom_medicine_pack_size?: string | null
          custom_medicine_side_effects?: string | null
          custom_medicine_storage_instructions?: string | null
          discount_percentage?: number | null
          expiry_date?: string | null
          id?: string
          is_available?: boolean | null
          is_custom_medicine?: boolean | null
          medicine_id?: string
          selling_price?: number
          stock_quantity?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_medicines_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_medicines_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "medicine_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          order_id: string | null
          priority: string | null
          read_at: string | null
          title: string
          type: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          order_id?: string | null
          priority?: string | null
          read_at?: string | null
          title: string
          type: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          order_id?: string | null
          priority?: string | null
          read_at?: string | null
          title?: string
          type?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "medicine_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_notifications_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "medicine_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_prescription_responses: {
        Row: {
          created_at: string | null
          decline_reason: string | null
          id: string
          prescription_id: string | null
          response_status: string | null
          response_time: string | null
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          created_at?: string | null
          decline_reason?: string | null
          id?: string
          prescription_id?: string | null
          response_status?: string | null
          response_time?: string | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          created_at?: string | null
          decline_reason?: string | null
          id?: string
          prescription_id?: string | null
          response_status?: string | null
          response_time?: string | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_prescription_responses_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescription_uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_prescription_responses_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "medicine_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          category: string | null
          created_at: string
          description: string | null
          id: string
          order_id: string | null
          transaction_type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          transaction_type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          transaction_type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "medicine_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          owner_id: string
          owner_type: string
          total_earned: number
          total_withdrawn: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          owner_id: string
          owner_type: string
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          owner_id?: string
          owner_type?: string
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_delivery_partner_accept_order: {
        Args: { _order_id: string; _user_id: string }
        Returns: boolean
      }
      credit_wallet: {
        Args: {
          _amount: number
          _category: string
          _description: string
          _order_id: string
          _wallet_id: string
        }
        Returns: undefined
      }
      find_nearby_medicine_vendors: {
        Args: { radius_km?: number; user_lat: number; user_lng: number }
        Returns: {
          address: string
          delivery_radius_km: number
          distance_km: number
          id: string
          is_available: boolean
          pharmacy_name: string
          phone: string
        }[]
      }
      find_nearest_doctor: {
        Args: { lat: number; long: number; specialization_filter?: string }
        Returns: {
          address: string
          distance: number
          hospital: string
          id: string
          name: string
          specialization: string
        }[]
      }
      generate_order_number: { Args: never; Returns: string }
      get_or_create_wallet: {
        Args: { _owner_id: string; _owner_type: string; _user_id: string }
        Returns: string
      }
      get_patient_display_name: { Args: { user_uuid: string }; Returns: string }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      get_verified_doctors: {
        Args: never
        Returns: {
          address: string
          available: boolean
          clinic_address: string | null
          clinic_latitude: number | null
          clinic_longitude: number | null
          created_at: string
          degree_verification_photo: string | null
          degrees: string
          email: string | null
          experience: number
          hospital: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          region: string
          registration_number: string
          specialization: string
          verified: boolean | null
        }[]
        SetofOptions: {
          from: "*"
          to: "doctors"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_pending_delivery_request: {
        Args: { _order_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_delivery_partner_owner: {
        Args: { _partner_id: string; _user_id: string }
        Returns: boolean
      }
      is_delivery_request_expired: {
        Args: { expires_at: string }
        Returns: boolean
      }
      is_vendor_owner: {
        Args: { _user_id: string; _vendor_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "patient" | "pharmacy" | "admin" | "delivery_partner"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["patient", "pharmacy", "admin", "delivery_partner"],
    },
  },
} as const
