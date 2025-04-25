export type UserRole = 'client' | 'relayPoint' | 'technician' | 'admin';

export interface User {
  id: string;
  email: string;
  phoneNumber?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string;
}

export interface Client extends User {
  role: 'client';
  address?: string;
}

export interface RelayPoint {
  id: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  role: 'relayPoint';
  createdAt: string;
  businessName: string;
  address: string;
  openingHours: any; // Peut être une chaîne ou un objet selon le contexte
  coordinates: {
    latitude: number;
    longitude: number;
  };
  commission: number;
}

export interface Technician extends User {
  role: 'technician';
  specialization: string[];
}

export interface RepairStatus {
  id: string;
  name: 'pending' | 'received' | 'diagnosed' | 'inRepair' | 'repaired' | 'readyForPickup' | 'completed' | 'cancelled';
  label: string;
  description: string;
  color: string;
}

export interface RepairRequest {
  id: string;
  clientId: string;
  deviceType: string;
  brand: string;
  model: string;
  problemDescription: string;
  statusId: string;
  preDiagnosis?: string;
  estimatedCost?: number;
  createdAt: string;
  updatedAt: string;
  dropOffRelayId?: string;
  pickupRelayId?: string;
  appointmentDate?: string;
  technicianId?: string;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  requestId: string;
  senderId: string;
  senderRole: UserRole;
  message: string;
  isAI: boolean;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  relatedToRequestId?: string;
  isRead: boolean;
  timestamp: string;
  link?: string; // Lien pour la navigation vers une page spécifique
}