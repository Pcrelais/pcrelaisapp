import { createClient } from '@supabase/supabase-js';

// Définition inline du type Database pour éviter les problèmes d'importation
type Database = {
  public: {
    Tables: {
      repair_requests: {
        Row: {
          id: string;
          client_id: string;
          device_type: string;
          brand: string;
          model: string;
          problem_description: string;
          status_id: string;
          created_at: string;
          updated_at: string;
          technician_id?: string;
          drop_off_relay_id?: string;
          pickup_relay_id?: string;
        };
      };
      repair_statuses: {
        Row: {
          id: string;
          code: string;
          label: string;
          description: string;
          color: string;
          order_index: number;
        };
      };
      profiles: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string;
          address?: string;
          city?: string;
          postal_code?: string;
          role: string;
          avatar_url?: string;
          created_at: string;
          updated_at: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          is_read: boolean;
          timestamp: string;
          related_id?: string;
          related_type?: string;
          link?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          request_id: string;
          sender_id: string;
          message: string;
          timestamp: string;
          is_read: boolean;
          is_ai: boolean;
          attachment_url?: string;
          attachment_type?: string;
          sender_role: string;
        };
      };
      repair_files: {
        Row: {
          id: string;
          repair_id: string;
          file_url: string;
          file_name: string;
          file_type: string;
          uploaded_by: string;
          uploaded_at: string;
          description?: string;
          is_public: boolean;
        };
      };
      relay_points: {
        Row: {
          id: string;
          name: string;
          address: string;
          city: string;
          postal_code: string;
          phone: string;
          email: string;
          opening_hours: any;
        };
      };
      device_types: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon: string;
        };
      };
      problem_categories: {
        Row: {
          id: string;
          name: string;
          description: string;
          device_type_id: string;
        };
      };
      spare_parts: {
        Row: {
          id: string;
          name: string;
          reference: string;
          price: number;
          stock: number;
          description: string;
        };
      };
    };
  };
};

// Utiliser directement les valeurs de connexion Supabase
const supabaseUrl = 'https://bijodgezlhkpdaimijpe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpam9kZ2V6bGhrcGRhaW1panBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MDE3NjUsImV4cCI6MjA2MDk3Nzc2NX0.gnZqsq_AePCmVoDmNVyQzRv7n8jhmzdAQ7ZdFhyyfoE';

// Créer le client Supabase
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
