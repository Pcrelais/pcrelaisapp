import { supabase } from '../lib/supabaseConfig';

// Définir les interfaces localement pour éviter les problèmes d'importation
interface RepairStatus {
  id: string;
  name: 'pending' | 'received' | 'diagnosed' | 'inRepair' | 'repaired' | 'readyForPickup' | 'completed' | 'cancelled';
  label: string;
  description: string;
  color: string;
  code?: string; // Ajouté pour la compatibilité avec le code existant
}

interface RepairRequest {
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
  relayPointId?: string; // Ajouté pour la compatibilité avec le code existant
}

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
    try {
      console.log(`Tentative de récupération de la réparation ${repairId}`);
      
      const { data, error } = await supabase
        .from('repair_requests')
        .select('*')
        .eq('id', repairId)
        .maybeSingle(); // Utiliser maybeSingle au lieu de single pour éviter l'erreur
      
      if (error) {
        console.error(`Erreur lors de la récupération de la réparation ${repairId}:`, error);
        // Ne pas lancer d'erreur, retourner null
        return null;
      }
      
      if (!data) {
        console.log(`Aucune réparation trouvée avec l'ID ${repairId}`);
        return null;
      }
      
      console.log(`Réparation ${repairId} récupérée avec succès`);
      return mapRepairRequestFromDB(data);
    } catch (error) {
      console.error(`Erreur inattendue lors de la récupération de la réparation ${repairId}:`, error);
      return null; // Retourner null plutôt que de lancer une erreur
    }
  },
  
  // Créer une nouvelle demande de réparation
  async createRepair(repair: Omit<RepairRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<RepairRequest> {
    const now = new Date().toISOString();
    
    // Attribuer automatiquement la réparation au technicien spécifié
    const technicianId = '58644658-16d8-41f8-8aab-23b396987c21';
    console.log('Attribution automatique de la réparation au technicien:', technicianId);
    
    // Récupérer le statut 'WAITING_DIAGNOSTIC'
    let waitingDiagnosticStatusId;
    try {
      const { data: statusData, error: statusError } = await supabase
        .from('repair_statuses')
        .select('id')
        .eq('code', 'WAITING_DIAGNOSTIC')
        .single();
      
      if (statusError || !statusData) {
        console.error('Erreur lors de la récupération du statut WAITING_DIAGNOSTIC:', statusError);
        // Utiliser le statut fourni dans repair si le statut WAITING_DIAGNOSTIC n'est pas trouvé
        waitingDiagnosticStatusId = repair.statusId;
      } else {
        waitingDiagnosticStatusId = statusData.id;
      }
    } catch (err) {
      console.error('Exception lors de la récupération du statut:', err);
      waitingDiagnosticStatusId = repair.statusId;
    }
    
    const newRepair = {
      ...repair,
      technicianId: technicianId, // Attribuer au technicien spécifié
      statusId: waitingDiagnosticStatusId, // Mettre le statut à 'WAITING_DIAGNOSTIC'
      created_at: now,
      updated_at: now,
    };
    
    console.log('Création d\'une nouvelle réparation avec les données:', mapRepairRequestToDB(newRepair));
    
    const { data, error } = await supabase
      .from('repair_requests')
      .insert(mapRepairRequestToDB(newRepair))
      .select()
      .single();
    
    if (error) {
      console.error('Erreur lors de la création de la réparation:', error);
      throw error;
    }
    
    console.log('Réparation créée avec succès:', data);
    return mapRepairRequestFromDB(data);
  },
  
  // Mettre à jour une demande de réparation
  async updateRepair(repairId: string, updates: Partial<RepairRequest>): Promise<RepairRequest> {
    try {
      // Vérifier d'abord si la réparation existe
      const { data: existingRepair, error: checkError } = await supabase
        .from('repair_requests')
        .select('id')
        .eq('id', repairId)
        .maybeSingle();
      
      if (checkError) {
        console.error(`Erreur lors de la vérification de la réparation ${repairId}:`, checkError);
        throw checkError;
      }
      
      if (!existingRepair) {
        console.error(`La réparation avec l'ID ${repairId} n'existe pas`);
        throw new Error(`La réparation avec l'ID ${repairId} n'existe pas`);
      }
      
      const updatedRepair = {
        ...updates,
        updated_at: new Date().toISOString(),
      };
      
      const { data, error } = await supabase
        .from('repair_requests')
        .update(mapRepairRequestToDB(updatedRepair))
        .eq('id', repairId)
        .select()
        .maybeSingle(); // Utiliser maybeSingle au lieu de single pour éviter l'erreur si aucune ligne n'est retournée
      
      if (error) {
        console.error(`Erreur lors de la mise à jour de la réparation ${repairId}:`, error);
        throw error;
      }
      
      if (!data) {
        console.error(`Aucune donnée retournée après la mise à jour de la réparation ${repairId}`);
        throw new Error(`Aucune donnée retournée après la mise à jour de la réparation ${repairId}`);
      }
      
      return mapRepairRequestFromDB(data);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la réparation ${repairId}:`, error);
      throw error;
    }
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
  
  // Mettre à jour le statut d'une réparation par son code de statut
  async updateRepairStatus(repairId: string, statusCode: string): Promise<RepairRequest> {
    try {
      console.log(`Tentative de mise à jour du statut de la réparation ${repairId} vers ${statusCode}`);
      
      // 1. Récupérer l'ID du statut à partir de son code
      let statusId: string | null = null;
      
      // Essayer d'abord avec le champ 'code'
      const { data: statusData, error: statusError } = await supabase
        .from('repair_statuses')
        .select('id')
        .eq('code', statusCode) // Utiliser eq au lieu de ilike pour une correspondance exacte
        .maybeSingle();
      
      if (!statusError && statusData) {
        statusId = statusData.id;
        console.log(`Statut trouvé par code: ${statusId}`);
      } else {
        // Si ça ne fonctionne pas, essayer avec le champ 'label'
        console.log(`Recherche du statut par label: ${statusCode}`);
        const { data: statusByLabel, error: labelError } = await supabase
          .from('repair_statuses')
          .select('id')
          .eq('label', statusCode) // Utiliser eq au lieu de ilike pour une correspondance exacte
          .maybeSingle();
          
        if (!labelError && statusByLabel) {
          statusId = statusByLabel.id;
          console.log(`Statut trouvé par label: ${statusId}`);
        }
      }
      
      if (!statusId) {
        // En dernier recours, essayer avec ilike pour une recherche moins stricte
        const { data: statusByIlike, error: ilikeError } = await supabase
          .from('repair_statuses')
          .select('id')
          .or(`code.ilike.%${statusCode}%,label.ilike.%${statusCode}%`)
          .maybeSingle();
          
        if (!ilikeError && statusByIlike) {
          statusId = statusByIlike.id;
          console.log(`Statut trouvé par recherche approximative: ${statusId}`);
        } else {
          console.error(`Statut de réparation '${statusCode}' introuvable après plusieurs tentatives`);
          throw new Error(`Statut de réparation '${statusCode}' introuvable`);
        }
      }
      
      // 2. Mettre à jour la réparation avec le statut trouvé
      console.log(`Mise à jour de la réparation ${repairId} avec le statut ${statusId}`);
      
      const { error: updateError } = await supabase
        .from('repair_requests')
        .update({ 
          status_id: statusId,
          updated_at: new Date().toISOString()
        })
        .eq('id', repairId);
      
      if (updateError) {
        console.error(`Erreur lors de la mise à jour du statut:`, updateError);
        
        // Si l'erreur indique que la réparation n'existe pas, vérifier son existence
        const { data: checkRepair } = await supabase
          .from('repair_requests')
          .select('id')
          .eq('id', repairId)
          .maybeSingle();
        
        if (!checkRepair) {
          throw new Error(`La réparation avec l'ID ${repairId} n'existe pas dans la base de données`);
        } else {
          throw new Error(`Erreur lors de la mise à jour: ${updateError.message}`);
        }
      }
      
      // 3. Récupérer la réparation mise à jour
      const updatedRepair = await this.getRepairById(repairId);
      
      // Même si nous ne pouvons pas récupérer la réparation, la mise à jour a réussi
      // Créer un objet de réparation minimal pour le retour
      if (!updatedRepair) {
        console.log(`La réparation ${repairId} a été mise à jour mais ne peut pas être récupérée`);
        
        // Créer un objet minimal avec les informations que nous avons
        const minimalRepair = {
          id: repairId,
          statusId: statusId,
          updatedAt: new Date().toISOString()
        } as unknown as RepairRequest;
        
        console.log(`Statut de la réparation ${repairId} mis à jour avec succès vers ${statusCode}`);
        return minimalRepair;
      }
      
      console.log(`Statut de la réparation ${repairId} mis à jour avec succès vers ${statusCode}`);
      return updatedRepair as RepairRequest;
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
      .or(`drop_off_relay_id.eq.${relayId},pickup_relay_id.eq.${relayId},relay_point_id.eq.${relayId}`)
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
