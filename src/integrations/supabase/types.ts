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
      profiles: {
        Row: {
          address: string | null
          allergies: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          date_of_birth: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      get_patient_display_name: {
        Args: { user_uuid: string }
        Returns: string
      }
      get_verified_doctors: {
        Args: Record<PropertyKey, never>
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
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
