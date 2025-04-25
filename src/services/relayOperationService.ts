import { supabase } from '../lib/supabaseConfig';
import { RepairRequest } from '../types';

export const relayOperationService = {
  /**
   * Récupère les réparations associées à un point relais
   */
  async getRelayRepairs(relayId: string): Promise<RepairRequest[]> {
    try {
      const { data, error } = await supabase
        .from('repair_requests')
        .select(`
          *,
          status:repair_statuses(id, code, label),
          client:profiles!client_id(id, first_name, last_name, email, phone)
        `)
        .eq('relay_point_id', relayId)
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
        statusName: item.status.code,
        statusLabel: item.status.label,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        relayPointId: item.relay_point_id,
        appointmentDate: item.drop_off_date || item.created_at,
        // Déterminer l'opération (dépôt ou récupération)
        operation: ['SUBMITTED', 'RECEIVED'].includes(item.status.code) 
                    ? 'dropOff' 
                    : ['READY_FOR_PICKUP', 'DELIVERED'].includes(item.status.code)
                        ? 'pickup'
                        : 'transit'
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des réparations du point relais:', error);
      throw error;
    }
  },

  /**
   * Récupère les dépôts à venir pour un point relais
   */
  async getPendingDropOffs(relayId: string): Promise<RepairRequest[]> {
    try {
      const { data, error } = await supabase
        .from('repair_requests')
        .select(`
          *,
          status:repair_statuses(id, code, label),
          client:profiles!client_id(id, first_name, last_name, email, phone)
        `)
        .eq('relay_point_id', relayId)
        .eq('status.code', 'SUBMITTED') // Statut 'soumise'
        .order('created_at', { ascending: true });

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
        statusName: item.status.code,
        statusLabel: item.status.label,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        relayPointId: item.relay_point_id,
        appointmentDate: item.drop_off_date || item.created_at,
        operation: 'dropOff',
        expectedArrival: item.drop_off_date || item.created_at
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des dépôts à venir:', error);
      throw error;
    }
  },

  /**
   * Récupère les appareils prêts pour récupération
   */
  async getReadyForPickup(relayId: string): Promise<RepairRequest[]> {
    try {
      const { data, error } = await supabase
        .from('repair_requests')
        .select(`
          *,
          status:repair_statuses(id, code, label),
          client:profiles!client_id(id, first_name, last_name, email, phone)
        `)
        .eq('relay_point_id', relayId)
        .eq('status.code', 'READY_FOR_PICKUP') // Statut 'prêt pour récupération'
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
        statusName: item.status.code,
        statusLabel: item.status.label,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        relayPointId: item.relay_point_id,
        appointmentDate: item.drop_off_date || item.created_at,
        operation: 'pickup'
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des appareils prêts pour récupération:', error);
      throw error;
    }
  },

  /**
   * Récupère les appareils en transit
   */
  async getInTransit(relayId: string): Promise<RepairRequest[]> {
    try {
      const { data, error } = await supabase
        .from('repair_requests')
        .select(`
          *,
          status:repair_statuses(id, code, label),
          client:profiles!client_id(id, first_name, last_name, email, phone)
        `)
        .eq('relay_point_id', relayId)
        .eq('status.code', 'RECEIVED') // Statut 'reçue'
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
        statusName: item.status.code,
        statusLabel: item.status.label,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        relayPointId: item.relay_point_id,
        appointmentDate: item.drop_off_date || item.created_at,
        operation: 'transit'
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des appareils en transit:', error);
      throw error;
    }
  },

  /**
   * Récupère les appareils traités ce mois
   */
  async getCompletedThisMonth(relayId: string): Promise<RepairRequest[]> {
    try {
      // Obtenir le premier jour du mois courant
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const { data, error } = await supabase
        .from('repair_requests')
        .select(`
          *,
          status:repair_statuses(id, code, label),
          client:profiles!client_id(id, first_name, last_name, email, phone)
        `)
        .eq('relay_point_id', relayId)
        .eq('status.code', 'DELIVERED') // Statut 'livré'
        .gte('updated_at', firstDayOfMonth.toISOString())
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        clientId: item.client_id,
        clientName: item.client ? `${item.client.first_name} ${item.client.last_name}` : '',
        deviceType: item.device_type,
        brand: item.brand,
        model: item.model,
        problemDescription: item.problem_description,
        statusId: item.status_id,
        statusName: item.status.code,
        statusLabel: item.status.label,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        relayPointId: item.relay_point_id,
        operation: 'completed'
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des appareils traités ce mois:', error);
      throw error;
    }
  },

  /**
   * Met à jour le statut d'une réparation lors d'un dépôt
   */
  async processDropOff(repairId: string): Promise<void> {
    try {
      // Récupérer l'ID du statut RECEIVED
      const { data: statusData, error: statusError } = await supabase
        .from('repair_statuses')
        .select('id')
        .eq('code', 'RECEIVED')
        .single();

      if (statusError) throw statusError;

      const { error } = await supabase
        .from('repair_requests')
        .update({ 
          status_id: statusData.id,
          drop_off_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', repairId);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors du traitement du dépôt:', error);
      throw error;
    }
  },

  /**
   * Met à jour le statut d'une réparation lors d'une récupération
   */
  async processPickup(repairId: string): Promise<void> {
    try {
      // Récupérer l'ID du statut DELIVERED
      const { data: statusData, error: statusError } = await supabase
        .from('repair_statuses')
        .select('id')
        .eq('code', 'DELIVERED')
        .single();

      if (statusError) throw statusError;

      const { error } = await supabase
        .from('repair_requests')
        .update({ 
          status_id: statusData.id,
          pickup_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', repairId);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors du traitement de la récupération:', error);
      throw error;
    }
  },

  /**
   * Récupère les statistiques du point relais
   */
  async getRelayStats(relayId: string): Promise<{
    pendingDropOffs: number;
    readyForPickup: number;
    inTransit: number;
    completedThisMonth: number;
  }> {
    try {
      const pendingDropOffs = await this.getPendingDropOffs(relayId);
      const readyForPickup = await this.getReadyForPickup(relayId);
      const inTransit = await this.getInTransit(relayId);
      const completedThisMonth = await this.getCompletedThisMonth(relayId);

      return {
        pendingDropOffs: pendingDropOffs.length,
        readyForPickup: readyForPickup.length,
        inTransit: inTransit.length,
        completedThisMonth: completedThisMonth.length
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques du point relais:', error);
      throw error;
    }
  }
};
