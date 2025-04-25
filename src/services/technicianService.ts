import { supabase } from '../lib/supabaseConfig';
import { notificationService } from './notificationService';

// Définir les interfaces localement pour éviter les problèmes d'importation
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
  relayPointId?: string;
  statusName?: string;
  statusLabel?: string;
  statusCode?: string;
  relayName?: string;
  relayAddress?: string;
  technicianAssigned?: boolean;
}

export const technicianService = {
  /**
   * Récupère les réparations assignées à un technicien
   */
  async getTechnicianRepairs(technicianId: string): Promise<RepairRequest[]> {
    try {
      console.log('Recherche des réparations pour le technicien ID:', technicianId);
      
      // Vérifier si la table repair_requests existe et contient des données
      const { data: allRepairs, error: allRepairsError } = await supabase
        .from('repair_requests')
        .select('*');
      
      console.log('Toutes les réparations dans la base (sans filtre):', allRepairs);
      
      if (allRepairsError) {
        console.error('Erreur lors de la récupération de toutes les réparations:', allRepairsError);
      }
      
      // Récupérer les réparations pour ce technicien
      const { data, error } = await supabase
        .from('repair_requests')
        .select('*')
        .eq('technician_id', technicianId);
      
      console.log('Réparations pour ce technicien:', data);
      
      // Filtrer par technicien ID après avoir récupéré toutes les réparations
      const technicianRepairs = data?.filter(item => item.technician_id === technicianId) || [];
      console.log('Réparations filtrées pour ce technicien:', technicianRepairs);

      if (error) throw error;

      // Si aucune réparation trouvée, retourner un tableau vide
      if (!technicianRepairs.length) {
        console.log('Aucune réparation trouvée pour ce technicien');
        return [];
      }

      // Récupérer les statuts pour les réparations
      const statusIds = technicianRepairs.map(item => item.status_id);
      console.log('Status IDs à récupérer:', statusIds);
      
      const { data: statusData, error: statusError } = await supabase
        .from('repair_statuses')
        .select('id, code, label')
        .in('id', statusIds);

      console.log('Statuts récupérés:', statusData);
      
      if (statusError) throw statusError;

      // Récupérer les clients pour les réparations
      const clientIds = technicianRepairs.map(item => item.client_id);
      console.log('Client IDs à récupérer:', clientIds);
      
      const { data: clientData, error: clientError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone')
        .in('id', clientIds);

      console.log('Clients récupérés:', clientData);
      
      if (clientError) throw clientError;

      // Mapper les données
      return technicianRepairs.map(item => {
        const status = statusData.find(s => s.id === item.status_id) || { code: 'UNKNOWN', label: 'Inconnu' };
        const client = clientData.find(c => c.id === item.client_id) || { first_name: '', last_name: '' };
        
        return {
          id: item.id,
          clientId: item.client_id,
          clientName: `${client.first_name} ${client.last_name}`,
          deviceType: item.device_type || '',
          brand: item.brand,
          model: item.model,
          problemDescription: item.problem_description,
          statusId: item.status_id,
          statusName: status.code,
          statusLabel: status.label,
          statusCode: status.code,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          estimatedCost: item.estimated_cost,
          priority: item.priority || 'medium',
          relayName: '',
          relayAddress: '',
          technicianId: item.technician_id,
          technicianAssigned: !!item.technician_id,
          dropOffRelayId: item.drop_off_relay_id,
          pickupRelayId: item.pickup_relay_id,
          preDiagnosis: item.diagnostic || '',
          technicianNotes: item.notes || '',
          appointmentDate: item.estimated_completion_date
        };
      });
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
      
      // Récupérer les réparations sans jointure complexe
      const { data, error } = await supabase
        .from('repair_requests')
        .select('*')
        .eq('technician_id', technicianId)
        .gte('updated_at', today.toISOString())
        .order('priority', { ascending: false });

      if (error) throw error;

      // Récupérer les statuts pour les réparations
      const statusIds = data.map(item => item.status_id);
      const { data: statusData, error: statusError } = await supabase
        .from('repair_statuses')
        .select('id, code, label')
        .in('id', statusIds);

      if (statusError) throw statusError;

      // Récupérer les clients pour les réparations
      const clientIds = data.map(item => item.client_id);
      const { data: clientData, error: clientError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone')
        .in('id', clientIds);

      if (clientError) throw clientError;

      // Récupérer les points relais pour les réparations
      const relayIds = data.map(item => item.drop_off_relay_id).filter(Boolean);
      const { data: relayData, error: relayError } = await supabase
        .from('relay_points')
        .select('id, name, address')
        .in('id', relayIds.length > 0 ? relayIds : ['no-id']);

      if (relayError) throw relayError;

      // Mapper les données
      return data.map(item => {
        const status = statusData.find(s => s.id === item.status_id) || { code: 'UNKNOWN', label: 'Inconnu' };
        const client = clientData.find(c => c.id === item.client_id) || { first_name: '', last_name: '' };
        const relay = relayData?.find(r => r.id === item.drop_off_relay_id) || null;
        
        return {
          id: item.id,
          clientId: item.client_id,
          clientName: `${client.first_name} ${client.last_name}`,
          deviceType: item.device_type || '',
          brand: item.brand,
          model: item.model,
          problemDescription: item.problem_description,
          statusId: item.status_id,
          statusName: status.code,
          statusLabel: status.label,
          statusCode: status.code,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          estimatedCost: item.estimated_cost,
          priority: item.priority || 'medium',
          relayName: relay?.name || '',
          relayAddress: relay?.address || '',
          technicianId: item.technician_id,
          technicianAssigned: !!item.technician_id,
          dropOffRelayId: item.drop_off_relay_id,
          pickupRelayId: item.pickup_relay_id,
          preDiagnosis: item.diagnostic || '',
          technicianNotes: item.notes || '',
          appointmentDate: item.estimated_completion_date
        };
      });
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
      // Récupérer d'abord le code du statut RETURNED_TO_RELAY
      const { data: statusCodeData, error: statusCodeError } = await supabase
        .from('repair_statuses')
        .select('id')
        .eq('code', 'RETURNED_TO_RELAY')
        .single();

      if (statusCodeError) throw statusCodeError;

      // Récupérer les réparations sans jointure complexe
      const { data, error } = await supabase
        .from('repair_requests')
        .select('*')
        .eq('technician_id', technicianId)
        .eq('status_id', statusCodeData.id)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Récupérer les statuts pour les réparations
      const statusIds = data.map(item => item.status_id);
      const { data: statusData, error: statusError } = await supabase
        .from('repair_statuses')
        .select('id, code, label')
        .in('id', statusIds);

      if (statusError) throw statusError;

      // Récupérer les clients pour les réparations
      const clientIds = data.map(item => item.client_id);
      const { data: clientData, error: clientError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone')
        .in('id', clientIds);

      if (clientError) throw clientError;

      // Récupérer les points relais pour les réparations
      const relayIds = data.map(item => item.drop_off_relay_id).filter(Boolean);
      const { data: relayData, error: relayError } = await supabase
        .from('relay_points')
        .select('id, name, address')
        .in('id', relayIds.length > 0 ? relayIds : ['no-id']);

      if (relayError) throw relayError;

      // Mapper les données
      return data.map(item => {
        const status = statusData.find(s => s.id === item.status_id) || { code: 'UNKNOWN', label: 'Inconnu' };
        const client = clientData.find(c => c.id === item.client_id) || { first_name: '', last_name: '' };
        const relay = relayData?.find(r => r.id === item.drop_off_relay_id) || null;
        
        return {
          id: item.id,
          clientId: item.client_id,
          clientName: `${client.first_name} ${client.last_name}`,
          deviceType: item.device_type || '',
          brand: item.brand,
          model: item.model,
          problemDescription: item.problem_description,
          statusId: item.status_id,
          statusName: status.code,
          statusLabel: status.label,
          statusCode: status.code,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          estimatedCost: item.estimated_cost,
          priority: item.priority || 'medium',
          relayName: relay?.name || '',
          relayAddress: relay?.address || '',
          technicianId: item.technician_id,
          technicianAssigned: !!item.technician_id,
          dropOffRelayId: item.drop_off_relay_id,
          pickupRelayId: item.pickup_relay_id,
          preDiagnosis: item.diagnostic || '',
          technicianNotes: item.notes || '',
          appointmentDate: item.estimated_completion_date
        };
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des réparations terminées:', error);
      throw error;
    }
  },

  /**
   * Met à jour le statut d'une réparation
   */
  async updateRepairStatus(repairId: string, statusCode: string): Promise<boolean> {
    try {
      // Récupérer l'ID du statut à partir du code
      const { data: statusData, error: statusError } = await supabase
        .from('repair_statuses')
        .select('id')
        .eq('code', statusCode)
        .single();

      if (statusError || !statusData) {
        console.error('Erreur lors de la récupération du statut:', statusError);
        return false;
      }

      // Mettre à jour le statut de la réparation
      const { error: updateError } = await supabase
        .from('repair_requests')
        .update({
          status_id: statusData.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', repairId);

      if (updateError) {
        console.error('Erreur lors de la mise à jour du statut de la réparation:', updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      return false;
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
      preDiagnosis?: string;
    }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('repair_requests')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', repairId);

      if (error) {
        console.error('Erreur lors de la mise à jour du diagnostic:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du diagnostic:', error);
      return false;
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
      // Récupérer les statuts
      const { data: statuses, error: statusError } = await supabase
        .from('repair_statuses')
        .select('id, code');

      if (statusError) throw statusError;

      // Mapper les codes de statut à leurs IDs
      const statusMap = new Map();
      statuses.forEach(status => {
        statusMap.set(status.code, status.id);
      });

      // Compter les réparations à diagnostiquer
      const { count: todiagnoseCount, error: todiagnoseError } = await supabase
        .from('repair_requests')
        .select('id', { count: 'exact' })
        .eq('technician_id', technicianId)
        .eq('status_id', statusMap.get('PICKED_UP_BY_TECHNICIAN'));

      // Compter les réparations en cours
      const { count: inrepairCount, error: inrepairError } = await supabase
        .from('repair_requests')
        .select('id', { count: 'exact' })
        .eq('technician_id', technicianId)
        .eq('status_id', statusMap.get('IN_REPAIR'));

      // Compter les réparations terminées
      const { count: repairedCount, error: repairedError } = await supabase
        .from('repair_requests')
        .select('id', { count: 'exact' })
        .eq('technician_id', technicianId)
        .in('status_id', [
          statusMap.get('RETURNED_TO_RELAY'),
          statusMap.get('COMPLETED')
        ]);

      // Calculer le taux de réussite (réparations terminées / total des réparations)
      const total = (todiagnoseCount || 0) + (inrepairCount || 0) + (repairedCount || 0);
      const successRate = total > 0 ? ((repairedCount || 0) / total) * 100 : 0;

      return {
        todiagnose: todiagnoseCount || 0,
        inrepair: inrepairCount || 0,
        repaired: repairedCount || 0,
        successRate
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques du technicien:', error);
      throw error;
    }
  },

  /**
   * Récupère les appareils prêts à être récupérés par le technicien
   */
  async getDevicesReadyForPickup(technicianId: string): Promise<RepairRequest[]> {
    try {
      // Récupérer l'ID du statut WAITING_FOR_TECHNICIAN
      const { data: statusData, error: statusError } = await supabase
        .from('repair_statuses')
        .select('id')
        .eq('code', 'WAITING_FOR_TECHNICIAN')
        .single();

      if (statusError || !statusData) {
        console.error('Erreur lors de la récupération du statut:', statusError);
        return [];
      }

      // Récupérer les appareils en attente de récupération
      const { data, error } = await supabase
        .from('repair_requests')
        .select(`
          *,
          status:repair_statuses(id, name, label, code),
          client:profiles!client_id(id, first_name, last_name, email, phone_number),
          relay_point:relay_points!drop_off_relay_id(id, name, address)
        `)
        .eq('status_id', statusData.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erreur lors de la récupération des appareils:', error);
        return [];
      }

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
        statusCode: item.status.code,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        dropOffRelayId: item.drop_off_relay_id,
        pickupRelayId: item.pickup_relay_id,
        relayName: item.relay_point?.name || '',
        relayAddress: item.relay_point?.address || '',
        technicianId: item.technician_id,
        technicianAssigned: !!item.technician_id
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des appareils prêts pour la récupération:', error);
      return [];
    }
  },

  /**
   * Marquer plusieurs appareils comme récupérés par le technicien
   */
  async pickupDevicesFromRelay(repairIds: string[], technicianId: string): Promise<boolean> {
    try {
      // Récupérer l'ID du statut PICKED_UP_BY_TECHNICIAN
      const { data: statusData, error: statusError } = await supabase
        .from('repair_statuses')
        .select('id')
        .eq('code', 'PICKED_UP_BY_TECHNICIAN')
        .single();

      if (statusError || !statusData) {
        console.error('Erreur lors de la récupération du statut:', statusError);
        return false;
      }

      // Mettre à jour le statut des réparations
      const { error: updateError } = await supabase
        .from('repair_requests')
        .update({
          status_id: statusData.id,
          technician_id: technicianId,
          updated_at: new Date().toISOString(),
          pickup_date: new Date().toISOString()
        })
        .in('id', repairIds);

      if (updateError) {
        console.error('Erreur lors de la mise à jour des réparations:', updateError);
        return false;
      }

      // Récupérer les informations des réparations pour les notifications
      const { data: devicesData, error: devicesError } = await supabase
        .from('repair_requests')
        .select('id, client_id, device_type, brand, model')
        .in('id', repairIds);

      if (devicesError) {
        console.error('Erreur lors de la récupération des informations des appareils:', devicesError);
        return false;
      }

      // Envoyer des notifications aux clients concernés
      for (const repair of devicesData) {
        await notificationService.createNotification({
          userId: repair.client_id,
          title: 'Appareil récupéré par le technicien',
          message: `Votre ${repair.device_type} ${repair.brand} ${repair.model} a été récupéré par le technicien et est en cours de diagnostic.`,
          type: 'info',
          relatedToRequestId: repair.id,
          link: `/repair/${repair.id}`
        });
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la récupération des appareils:', error);
      return false;
    }
  },

  /**
   * Envoyer des notifications pour les tournées des techniciens (mardi et vendredi)
   */
  async sendTechnicianRouteNotifications(): Promise<boolean> {
    try {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = dimanche, 1 = lundi, 2 = mardi, ..., 6 = samedi
      
      // Vérifier si c'est mardi (2) ou vendredi (5)
      if (dayOfWeek !== 2 && dayOfWeek !== 5) {
        console.log('Pas de tournée aujourd\'hui. Les tournées sont le mardi et le vendredi.');
        return false;
      }

      // Récupérer les techniciens disponibles
      const { data: technicians, error: techError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'technician');

      if (techError) {
        console.error('Erreur lors de la récupération des techniciens:', techError);
        return false;
      }

      if (!technicians || technicians.length === 0) {
        console.warn('Aucun technicien disponible pour les tournées');
        return false;
      }

      // Pour chaque technicien, récupérer les appareils à collecter
      for (const technician of technicians) {
        const devices = await this.getDevicesReadyForPickup(technician.id);
        
        if (devices.length > 0) {
          // Regrouper les appareils par point relais
          const relayGroups = new Map<string, { name: string, address: string, devices: any[] }>();
          
          devices.forEach(device => {
            const relayId = device.dropOffRelayId || '';
            if (!relayGroups.has(relayId)) {
              relayGroups.set(relayId, {
                name: device.relayName || 'Point relais inconnu',
                address: device.relayAddress || 'Adresse inconnue',
                devices: []
              });
            }
            relayGroups.get(relayId)?.devices.push(device);
          });

          // Créer un message pour chaque groupe de points relais
          let notificationMessage = 'Appareils à récupérer:\n';
          
          for (const [relayId, relayData] of relayGroups.entries()) {
            notificationMessage += `\n📍 ${relayData.name} (${relayData.address}):\n`;
            relayData.devices.forEach(device => {
              notificationMessage += `- ${device.deviceType} ${device.brand} ${device.model}\n`;
            });
          }

          // Envoyer la notification au technicien
          await notificationService.createNotification({
            userId: technician.id,
            title: 'Tournée de récupération d\'appareils',
            message: notificationMessage,
            type: 'info',
            link: '/technician/pickup'
          });
        }
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi des notifications de tournée:', error);
      return false;
    }
  },

  /**
   * Mettre à jour le statut de diagnostic d'une réparation et envoyer un devis au client
   */
  async updateDiagnosticAndSendQuote(
    repairId: string,
    diagnosticData: {
      preDiagnosis: string;
      estimatedCost: number;
      estimatedTime: string; // Format: "2 jours", "1 semaine", etc.
      notes?: string;
    }
  ): Promise<boolean> {
    try {
      // Récupérer l'ID du statut QUOTE_PROVIDED
      const { data: statusData, error: statusError } = await supabase
        .from('repair_statuses')
        .select('id')
        .eq('code', 'QUOTE_PROVIDED')
        .single();

      if (statusError || !statusData) {
        console.error('Erreur lors de la récupération du statut:', statusError);
        return false;
      }

      // Mettre à jour la réparation avec le diagnostic et le devis
      const { error: updateError } = await supabase
        .from('repair_requests')
        .update({
          pre_diagnosis: diagnosticData.preDiagnosis,
          estimated_cost: diagnosticData.estimatedCost,
          estimated_time: diagnosticData.estimatedTime,
          technician_notes: diagnosticData.notes,
          status_id: statusData.id,
          updated_at: new Date().toISOString(),
          quote_provided_at: new Date().toISOString()
        })
        .eq('id', repairId);

      if (updateError) {
        console.error('Erreur lors de la mise à jour du diagnostic:', updateError);
        return false;
      }

      // Récupérer les informations de la réparation pour la notification
      const { data: repairData, error: repairError } = await supabase
        .from('repair_requests')
        .select(`
          client_id,
          technician_id,
          device_type,
          brand,
          model,
          estimated_cost
        `)
        .eq('id', repairId)
        .single();

      if (repairError || !repairData) {
        console.error('Erreur lors de la récupération des informations de la réparation:', repairError);
        return false;
      }

      // Envoyer une notification au client
      await notificationService.createNotification({
        userId: repairData.client_id,
        title: 'Devis de réparation disponible',
        message: `Un devis de ${repairData.estimated_cost}€ est disponible pour la réparation de votre ${repairData.device_type} ${repairData.brand} ${repairData.model}. Délai estimé: ${diagnosticData.estimatedTime}.`,
        type: 'info',
        relatedToRequestId: repairId,
        link: `/repair/${repairId}/quote`
      });

      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi du devis:', error);
      return false;
    }
  },

  /**
   * Accepter ou refuser un devis par le client
   */
  async processQuoteResponse(repairId: string, accepted: boolean): Promise<boolean> {
    try {
      // Récupérer l'ID du statut approprié
      const statusCode = accepted ? 'QUOTE_ACCEPTED' : 'QUOTE_REJECTED';
      
      const { data: statusData, error: statusError } = await supabase
        .from('repair_statuses')
        .select('id')
        .eq('code', statusCode)
        .single();

      if (statusError || !statusData) {
        console.error('Erreur lors de la récupération du statut:', statusError);
        return false;
      }

      // Mettre à jour le statut de la réparation
      const { error: updateError } = await supabase
        .from('repair_requests')
        .update({
          status_id: statusData.id,
          updated_at: new Date().toISOString(),
          quote_response_at: new Date().toISOString()
        })
        .eq('id', repairId);

      if (updateError) {
        console.error('Erreur lors de la mise à jour du statut de la réparation:', updateError);
        return false;
      }

      // Si le devis est accepté, mettre à jour le statut à IN_REPAIR
      if (accepted) {
        // Attendre un peu pour permettre au client de voir le statut "Devis accepté"
        setTimeout(async () => {
          await this.updateRepairStatus(repairId, 'IN_REPAIR');
        }, 5000);
      }

      // Récupérer les informations de la réparation pour les notifications
      const { data: repairData, error: repairError } = await supabase
        .from('repair_requests')
        .select(`
          client_id,
          technician_id,
          device_type,
          brand,
          model,
          estimated_cost
        `)
        .eq('id', repairId)
        .single();

      if (repairError || !repairData) {
        console.error('Erreur lors de la récupération des informations de la réparation:', repairError);
        return false;
      }

      // Envoyer une notification au technicien
      if (repairData.technician_id) {
        await notificationService.createNotification({
          userId: repairData.technician_id,
          title: accepted ? 'Devis accepté' : 'Devis refusé',
          message: accepted 
            ? `Le devis de ${repairData.estimated_cost}€ pour la réparation du ${repairData.device_type} ${repairData.brand} ${repairData.model} a été accepté par le client.` 
            : `Le devis de ${repairData.estimated_cost}€ pour la réparation du ${repairData.device_type} ${repairData.brand} ${repairData.model} a été refusé par le client.`,
          type: accepted ? 'success' : 'warning',
          relatedToRequestId: repairId,
          link: `/technician/repair/${repairId}`
        });
      }

      return true;
    } catch (error) {
      console.error('Erreur lors du traitement de la réponse au devis:', error);
      return false;
    }
  },

  /**
   * Marquer une réparation comme terminée et prête à être retournée au point relais
   */
  async markRepairAsCompleted(repairId: string): Promise<boolean> {
    try {
      // Récupérer l'ID du statut RETURNED_TO_RELAY
      const { data: statusData, error: statusError } = await supabase
        .from('repair_statuses')
        .select('id')
        .eq('code', 'RETURNED_TO_RELAY')
        .single();

      if (statusError || !statusData) {
        console.error('Erreur lors de la récupération du statut:', statusError);
        return false;
      }

      // Mettre à jour le statut de la réparation
      const { error: updateError } = await supabase
        .from('repair_requests')
        .update({
          status_id: statusData.id,
          updated_at: new Date().toISOString(),
          repair_completed_at: new Date().toISOString()
        })
        .eq('id', repairId);

      if (updateError) {
        console.error('Erreur lors de la mise à jour du statut de la réparation:', updateError);
        return false;
      }

      // Récupérer les informations de la réparation pour les notifications
      const { data: repairData, error: repairError } = await supabase
        .from('repair_requests')
        .select(`
          client_id,
          drop_off_relay_id,
          device_type,
          brand,
          model,
          relay_point:relay_points(id, name, business_name)
        `)
        .eq('id', repairId)
        .single();

      if (repairError || !repairData) {
        console.error('Erreur lors de la récupération des informations de la réparation:', repairError);
        return false;
      }

      // Envoyer une notification au client
      await notificationService.createNotification({
        userId: repairData.client_id,
        title: 'Appareil réparé',
        message: `Votre ${repairData.device_type} ${repairData.brand} ${repairData.model} a été réparé et sera bientôt disponible au point relais ${repairData.relay_point && repairData.relay_point[0] ? (repairData.relay_point[0].business_name || repairData.relay_point[0].name) : 'inconnu'}.`,
        type: 'success',
        relatedToRequestId: repairId,
        link: `/repair/${repairId}`
      });

      // Envoyer une notification au point relais
      if (repairData.drop_off_relay_id) {
        await notificationService.createNotification({
          userId: repairData.drop_off_relay_id,
          title: 'Appareil réparé à réceptionner',
          message: `Un ${repairData.device_type} ${repairData.brand} ${repairData.model} réparé sera bientôt livré à votre point relais.`,
          type: 'info',
          relatedToRequestId: repairId,
          link: `/relay/repair/${repairId}`
        });
      }

      return true;
    } catch (error) {
      console.error('Erreur lors du marquage de la réparation comme terminée:', error);
      return false;
    }
  }
};