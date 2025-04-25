export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          phone_number: string | null
          first_name: string
          last_name: string
          role: 'client' | 'relayPoint' | 'technician' | 'admin'
          created_at: string
          address: string | null
          business_name: string | null
          opening_hours: string | null
          coordinates: Json | null
          commission: number | null
          specialization: string[] | null
        }
        Insert: {
          id?: string
          email: string
          phone_number?: string | null
          first_name: string
          last_name: string
          role: 'client' | 'relayPoint' | 'technician' | 'admin'
          created_at?: string
          address?: string | null
          business_name?: string | null
          opening_hours?: string | null
          coordinates?: Json | null
          commission?: number | null
          specialization?: string[] | null
        }
        Update: {
          id?: string
          email?: string
          phone_number?: string | null
          first_name?: string
          last_name?: string
          role?: 'client' | 'relayPoint' | 'technician' | 'admin'
          created_at?: string
          address?: string | null
          business_name?: string | null
          opening_hours?: string | null
          coordinates?: Json | null
          commission?: number | null
          specialization?: string[] | null
        }
      }
      repair_requests: {
        Row: {
          id: string
          client_id: string
          device_type: string
          brand: string
          model: string
          problem_description: string
          status_id: string
          pre_diagnosis: string | null
          estimated_cost: number | null
          created_at: string
          updated_at: string
          drop_off_relay_id: string | null
          pickup_relay_id: string | null
          appointment_date: string | null
          technician_id: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          client_id: string
          device_type: string
          brand: string
          model: string
          problem_description: string
          status_id: string
          pre_diagnosis?: string | null
          estimated_cost?: number | null
          created_at?: string
          updated_at?: string
          drop_off_relay_id?: string | null
          pickup_relay_id?: string | null
          appointment_date?: string | null
          technician_id?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          device_type?: string
          brand?: string
          model?: string
          problem_description?: string
          status_id?: string
          pre_diagnosis?: string | null
          estimated_cost?: number | null
          created_at?: string
          updated_at?: string
          drop_off_relay_id?: string | null
          pickup_relay_id?: string | null
          appointment_date?: string | null
          technician_id?: string | null
          notes?: string | null
        }
      }
      repair_statuses: {
        Row: {
          id: string
          name: 'pending' | 'received' | 'diagnosed' | 'inRepair' | 'repaired' | 'readyForPickup' | 'completed' | 'cancelled'
          label: string
          description: string
          color: string
        }
        Insert: {
          id?: string
          name: 'pending' | 'received' | 'diagnosed' | 'inRepair' | 'repaired' | 'readyForPickup' | 'completed' | 'cancelled'
          label: string
          description: string
          color: string
        }
        Update: {
          id?: string
          name?: 'pending' | 'received' | 'diagnosed' | 'inRepair' | 'repaired' | 'readyForPickup' | 'completed' | 'cancelled'
          label?: string
          description?: string
          color?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          request_id: string
          sender_id: string
          sender_role: 'client' | 'relayPoint' | 'technician' | 'admin'
          message: string
          is_ai: boolean
          timestamp: string
        }
        Insert: {
          id?: string
          request_id: string
          sender_id: string
          sender_role: 'client' | 'relayPoint' | 'technician' | 'admin'
          message: string
          is_ai: boolean
          timestamp?: string
        }
        Update: {
          id?: string
          request_id?: string
          sender_id?: string
          sender_role?: 'client' | 'relayPoint' | 'technician' | 'admin'
          message?: string
          is_ai?: boolean
          timestamp?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'info' | 'success' | 'warning' | 'error'
          related_to_request_id: string | null
          is_read: boolean
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'info' | 'success' | 'warning' | 'error'
          related_to_request_id?: string | null
          is_read?: boolean
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'info' | 'success' | 'warning' | 'error'
          related_to_request_id?: string | null
          is_read?: boolean
          timestamp?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
