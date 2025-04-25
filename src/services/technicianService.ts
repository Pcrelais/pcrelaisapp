import { supabase } from '../lib/supabaseConfig';
import { RepairRequest, RepairStatus } from '../types';

export const technicianService = {
  /**
   * Récupère les réparations assignées à un technicien
   */
  async getTechnicianRepairs(technicianId: string): Promise<RepairRequest[]> {
    try {
      const { data, error } = await supabase
        .from('repair_requests')
        .select(`
          *,
          status:repair_statuses(id, name, label),
          client:profiles!client_id(id, first_name, last_name, email, phone_number),
          relay_point:relay_points!drop_off_relay_id(id, name, address)
        `)
        .eq('technician_id', technicianId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        clientId: item.client_id,
        clientName: `${item.client.first_name} ${item.client.last_name}`,
        deviceType: item.device_type,
        brand: item.brand,
        model: item.model,
        problemDescription: item.problem_description,
        statusId: item.status_id,
        statusName: item.status.name,
        statusLabel: item.status.label,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        estimatedCost: item.estimated_cost,
        priority: item.priority || 'medium',
        relayName: item.relay_point?.name || '',
        technicianId: item.technician_id,
        technicianAssigned: !!item.technician_id,
        dropOffRelayId: item.drop_off_relay_id,
        pickupRelayId: item.pickup_relay_id,
        preDiagnosis: item.pre_diagnosis,
        technicianNotes: item.technician_notes,
        appointmentDate: item.appointment_date
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des réparations du technicien:', error);
      throw error;
    }
  },

  /**
   * Récupère les réparations à traiter aujourd'hui
   */
  async getTodaysRepairs(technicianId: string): Promise<RepairRequest[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('repair_requests')
        .select(`
          *,
          status:repair_statuses(id, name, label),
          client:profiles!client_id(id, first_name, last_name, email, phone_number),
          relay_point:relay_points!drop_off_relay_id(id, name, address)
        `)
        .eq('technician_id', technicianId)
        .gte('updated_at', today.toISOString())
        .in('status_id', [
          // Récupérer les IDs des statuts pertinents (reçu, diagnostiqué, en réparation)
          // Ces IDs doivent correspondre à ceux dans votre base de données
          '2', '3', '4'
        ])
        .order('priority', { ascending: false });

      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        clientId: item.client_id,
        clientName: `${item.client.first_name} ${item.client.last_name}`,
        deviceType: item.device_type,
        brand: item.brand,
        model: item.model,
        problemDescription: item.problem_description,
        statusId: item.status_id,
        statusName: item.status.name,
        statusLabel: item.status.label,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        estimatedCost: item.estimated_cost,
        priority: item.priority || 'medium',
        relayName: item.relay_point?.name || '',
        technicianId: item.technician_id,
        technicianAssigned: !!item.technician_id,
        dropOffRelayId: item.drop_off_relay_id,
        pickupRelayId: item.pickup_relay_id,
        preDiagnosis: item.pre_diagnosis,
        technicianNotes: item.technician_notes,
        appointmentDate: item.appointment_date
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des réparations du jour:', error);
      throw error;
    }
  },

  /**
   * Récupère les réparations récemment terminées
   */
  async getCompletedRepairs(technicianId: string): Promise<RepairRequest[]> {
    try {
      const { data, error } = await supabase
        .from('repair_requests')
        .select(`
          *,
          status:repair_statuses(id, name, label),
          client:profiles!client_id(id, first_name, last_name, email, phone_number)
        `)
        .eq('technician_id', technicianId)
        .in('status_id', [
          // Récupérer les IDs des statuts pertinents (réparé, prêt pour récupération)
          // Ces IDs doivent correspondre à ceux dans votre base de données
          '5', '6'
        ])
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        clientId: item.client_id,
        clientName: `${item.client.first_name} ${item.client.last_name}`,
        deviceType: item.device_type,
        brand: item.brand,
        model: item.model,
        problemDescription: item.problem_description,
        statusId: item.status_id,
        statusName: item.status.name,
        statusLabel: item.status.label,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        estimatedCost: item.estimated_cost,
        priority: item.priority || 'medium',
        technicianId: item.technician_id,
        technicianAssigned: !!item.technician_id,
        dropOffRelayId: item.drop_off_relay_id,
        pickupRelayId: item.pickup_relay_id,
        preDiagnosis: item.pre_diagnosis,
        technicianNotes: item.technician_notes,
        appointmentDate: item.appointment_date
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des réparations terminées:', error);
      throw error;
    }
  },

  /**
   * Met à jour le statut d'une réparation
   */
  async updateRepairStatus(repairId: string, statusId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('repair_requests')
        .update({ 
          status_id: statusId,
          updated_at: new Date().toISOString()
        })
        .eq('id', repairId);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de la réparation:', error);
      throw error;
    }
  },

  /**
   * Met à jour les informations de diagnostic et de réparation
   */
  async updateRepairDiagnostic(
    repairId: string, 
    data: { 
      estimatedCost?: number; 
      technicianNotes?: string; 
      statusId?: string;
      priority?: string;
    }
  ): Promise<void> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (data.estimatedCost !== undefined) updateData.estimated_cost = data.estimatedCost;
      if (data.technicianNotes !== undefined) updateData.technician_notes = data.technicianNotes;
      if (data.statusId !== undefined) updateData.status_id = data.statusId;
      if (data.priority !== undefined) updateData.priority = data.priority;

      const { error } = await supabase
        .from('repair_requests')
        .update(updateData)
        .eq('id', repairId);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du diagnostic:', error);
      throw error;
    }
  },

  /**
   * Récupère les statistiques du technicien
   */
  async getTechnicianStats(technicianId: string): Promise<{ 
    todiagnose: number; 
    inrepair: number; 
    repaired: number; 
    successRate: number;
  }> {
    try {
      // Récupérer toutes les réparations du technicien
      const { data, error } = await supabase
        .from('repair_requests')
        .select('id, status_id, status:repair_statuses(name)')
        .eq('technician_id', technicianId);

      if (error) throw error;

      // Compter les différents statuts
      const todiagnose = data.filter(r => r.status.name === 'received').length;
      const inrepair = data.filter(r => r.status.name === 'inRepair').length;
      const repaired = data.filter(r => ['repaired', 'readyForPickup', 'completed'].includes(r.status.name)).length;
      
      // Calculer le taux de réussite (réparations terminées / total des réparations)
      const total = data.length;
      const successRate = total > 0 ? Math.round((repaired / total) * 100) : 0;

      return {
        todiagnose,
        inrepair,
        repaired,
        successRate
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques du technicien:', error);
      throw error;
    }
  }
};
