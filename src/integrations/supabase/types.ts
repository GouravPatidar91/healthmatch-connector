export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string
          date: string
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
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
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
          created_at: string
          hospital: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          region: string
          specialization: string
        }
        Insert: {
          address: string
          available?: boolean
          created_at?: string
          hospital: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          region: string
          specialization: string
        }
        Update: {
          address?: string
          available?: boolean
          created_at?: string
          hospital?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          region?: string
          specialization?: string
        }
        Relationships: []
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
          created_at: string
          duration: string | null
          id: string
          medications: string[] | null
          notes: string | null
          previous_conditions: string[] | null
          severity: string | null
          symptoms: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration?: string | null
          id?: string
          medications?: string[] | null
          notes?: string | null
          previous_conditions?: string[] | null
          severity?: string | null
          symptoms?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration?: string | null
          id?: string
          medications?: string[] | null
          notes?: string | null
          previous_conditions?: string[] | null
          severity?: string | null
          symptoms?: string[] | null
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
          created_at: string
          date_of_birth: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          first_name: string | null
          gender: string | null
          id: string
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
          created_at?: string
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          first_name?: string | null
          gender?: string | null
          id: string
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
          created_at?: string
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
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
          id: string
          name: string
          specialization: string
          hospital: string
          address: string
          distance: number
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
