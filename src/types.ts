// Types pour l'application PC Relais

// Type de notification
export type NotificationType = 'info' | 'warning' | 'success' | 'error' | 'message' | 'repair' | 'chat';

// Interface de base pour une notification
export interface Notification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
}

// Types pour les réparations
export interface Repair {
  id: string;
  userId: string;
  brand: string;
  model: string;
  description: string;
  statusId: number;
  statusName?: string;
  createdAt: string;
  updatedAt: string;
  relayPointId?: string;
  technicianId?: string;
}

// Types pour les messages de chat
export interface ChatMessage {
  id?: string;
  requestId: string;
  senderId: string;
  senderRole: 'client' | 'technician' | 'admin' | 'relayPoint';
  message: string;
  timestamp?: string;
  isRead?: boolean;
  isAi?: boolean;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
}

// Types pour les utilisateurs
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  relayPointId?: string;
}

// Types pour les points relais
export interface RelayPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  managerId?: string;
}

// Types pour les abonnements aux notifications push
export interface PushSubscription {
  id?: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt?: string;
}

// Type pour la base de données Supabase
export interface Database {
  public: {
    Tables: {
      repairs: {
        Row: Repair;
        Insert: Omit<Repair, 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Omit<Repair, 'id' | 'createdAt' | 'updatedAt'>>;
      };
      chat_messages: {
        Row: ChatMessage;
        Insert: Omit<ChatMessage, 'id' | 'timestamp'>;
        Update: Partial<Omit<ChatMessage, 'id' | 'timestamp'>>;
      };
      notifications: {
        Row: Notification & { isRead: boolean; timestamp: string; relatedId?: string; };
        Insert: Omit<Notification & { isRead: boolean; relatedId?: string; }, 'id' | 'timestamp'>;
        Update: Partial<Omit<Notification & { isRead: boolean; }, 'id' | 'timestamp'>>;
      };
      push_subscriptions: {
        Row: PushSubscription;
        Insert: Omit<PushSubscription, 'id' | 'createdAt'>;
        Update: Partial<Omit<PushSubscription, 'id' | 'createdAt'>>;
      };
      relay_points: {
        Row: RelayPoint;
        Insert: Omit<RelayPoint, 'id'>;
        Update: Partial<Omit<RelayPoint, 'id'>>;
      };
    };
    Views: {
      [key: string]: {
        Row: Record<string, unknown>;
      };
    };
    Functions: {
      [key: string]: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
    };
  };
}
