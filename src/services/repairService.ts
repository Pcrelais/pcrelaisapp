import { supabase } from '../lib/supabaseConfig';
import { RepairRequest, RepairStatus } from '../types';

// Convertir les noms de champs de snake_case (DB) vers camelCase (Frontend)
const mapRepairRequestFromDB = (dbRepair: any): RepairRequest => {
  return {
    id: dbRepair.id,
    clientId: dbRepair.client_id,
    deviceType: dbRepair.device_type,
    brand: dbRepair.brand,
    model: dbRepair.model,
    problemDescription: dbRepair.problem_description,
    statusId: dbRepair.status_id,
    preDiagnosis: dbRepair.pre_diagnosis,
    estimatedCost: dbRepair.estimated_cost,
    createdAt: dbRepair.created_at,
    updatedAt: dbRepair.updated_at,
    dropOffRelayId: dbRepair.drop_off_relay_id,
    pickupRelayId: dbRepair.pickup_relay_id,
    appointmentDate: dbRepair.appointment_date,
    technicianId: dbRepair.technician_id,
    notes: dbRepair.notes,
  };
};

// Convertir les noms de champs de camelCase (Frontend) vers snake_case (DB)
const mapRepairRequestToDB = (repair: Partial<RepairRequest>) => {
  const dbRepair: Record<string, any> = {};
  
  if (repair.id !== undefined) dbRepair.id = repair.id;
  if (repair.clientId !== undefined) dbRepair.client_id = repair.clientId;
  if (repair.deviceType !== undefined) dbRepair.device_type = repair.deviceType;
  if (repair.brand !== undefined) dbRepair.brand = repair.brand;
  if (repair.model !== undefined) dbRepair.model = repair.model;
  if (repair.problemDescription !== undefined) dbRepair.problem_description = repair.problemDescription;
  if (repair.statusId !== undefined) dbRepair.status_id = repair.statusId;
  if (repair.preDiagnosis !== undefined) dbRepair.pre_diagnosis = repair.preDiagnosis;
  if (repair.estimatedCost !== undefined) dbRepair.estimated_cost = repair.estimatedCost;
  if (repair.createdAt !== undefined) dbRepair.created_at = repair.createdAt;
  if (repair.updatedAt !== undefined) dbRepair.updated_at = repair.updatedAt;
  if (repair.dropOffRelayId !== undefined) dbRepair.drop_off_relay_id = repair.dropOffRelayId;
  if (repair.pickupRelayId !== undefined) dbRepair.pickup_relay_id = repair.pickupRelayId;
  if (repair.appointmentDate !== undefined) dbRepair.appointment_date = repair.appointmentDate;
  if (repair.technicianId !== undefined) dbRepair.technician_id = repair.technicianId;
  if (repair.notes !== undefined) dbRepair.notes = repair.notes;
  
  return dbRepair;
};

// Convertir les statuts de réparation
const mapRepairStatusFromDB = (dbStatus: any): RepairStatus => {
  return {
    id: dbStatus.id,
    name: dbStatus.name,
    label: dbStatus.label,
    description: dbStatus.description,
    color: dbStatus.color,
  };
};

// Service pour les demandes de réparation
export const repairService = {
  // Récupérer toutes les demandes de réparation d'un client
  async getClientRepairs(clientId: string): Promise<RepairRequest[]> {
    const { data, error } = await supabase
      .from('repair_requests')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erreur lors de la récupération des réparations:', error);
      throw error;
    }
    
    return (data || []).map(mapRepairRequestFromDB);
  },
  
  // Récupérer une demande de réparation par son ID
  async getRepairById(repairId: string): Promise<RepairRequest | null> {
    const { data, error } = await supabase
      .from('repair_requests')
      .select('*')
      .eq('id', repairId)
      .single();
    
    if (error) {
      console.error(`Erreur lors de la récupération de la réparation ${repairId}:`, error);
      throw error;
    }
    
    return data ? mapRepairRequestFromDB(data) : null;
  },
  
  // Créer une nouvelle demande de réparation
  async createRepair(repair: Omit<RepairRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<RepairRequest> {
    const now = new Date().toISOString();
    const newRepair = {
      ...repair,
      created_at: now,
      updated_at: now,
    };
    
    const { data, error } = await supabase
      .from('repair_requests')
      .insert(mapRepairRequestToDB(newRepair))
      .select()
      .single();
    
    if (error) {
      console.error('Erreur lors de la création de la réparation:', error);
      throw error;
    }
    
    return mapRepairRequestFromDB(data);
  },
  
  // Mettre à jour une demande de réparation
  async updateRepair(repairId: string, updates: Partial<RepairRequest>): Promise<RepairRequest> {
    const updatedRepair = {
      ...updates,
      updated_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('repair_requests')
      .update(mapRepairRequestToDB(updatedRepair))
      .eq('id', repairId)
      .select()
      .single();
    
    if (error) {
      console.error(`Erreur lors de la mise à jour de la réparation ${repairId}:`, error);
      throw error;
    }
    
    return mapRepairRequestFromDB(data);
  },
  
  // Récupérer tous les statuts de réparation
  async getRepairStatuses(): Promise<RepairStatus[]> {
    const { data, error } = await supabase
      .from('repair_statuses')
      .select('*')
      .order('id');
    
    if (error) {
      console.error('Erreur lors de la récupération des statuts de réparation:', error);
      throw error;
    }
    
    return (data || []).map(mapRepairStatusFromDB);
  },
  
  // Mettre à jour le statut d'une réparation par son nom de statut
  async updateRepairStatus(repairId: string, statusName: string): Promise<RepairRequest> {
    try {
      // D'abord, récupérer l'ID du statut à partir de son nom
      const { data: statusData, error: statusError } = await supabase
        .from('repair_statuses')
        .select('id')
        .ilike('name', statusName)
        .single();
      
      if (statusError || !statusData) {
        console.error(`Erreur lors de la récupération du statut ${statusName}:`, statusError);
        throw new Error(`Statut de réparation '${statusName}' introuvable`);
      }
      
      // Ensuite, mettre à jour la réparation avec le nouvel ID de statut
      return await this.updateRepair(repairId, {
        statusId: statusData.id,
      });
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du statut de la réparation ${repairId}:`, error);
      throw error;
    }
  },
  
  // Récupérer les réparations pour un point relais
  async getRelayRepairs(relayId: string): Promise<RepairRequest[]> {
    const { data, error } = await supabase
      .from('repair_requests')
      .select('*')
      .or(`drop_off_relay_id.eq.${relayId},pickup_relay_id.eq.${relayId}`)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error(`Erreur lors de la récupération des réparations pour le point relais ${relayId}:`, error);
      throw error;
    }
    
    return (data || []).map(mapRepairRequestFromDB);
  },
  
  // Récupérer les réparations pour un technicien
  async getTechnicianRepairs(technicianId: string): Promise<RepairRequest[]> {
    const { data, error } = await supabase
      .from('repair_requests')
      .select('*')
      .eq('technician_id', technicianId)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error(`Erreur lors de la récupération des réparations pour le technicien ${technicianId}:`, error);
      throw error;
    }
    
    return (data || []).map(mapRepairRequestFromDB);
  },
};
