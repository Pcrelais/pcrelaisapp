import { supabase } from '../lib/supabaseConfig';

export const relayOperationService = {
  /**
   * Récupère les réparations associées à un point relais
   */
  async getRelayRepairs(relayId: string): Promise<any[]> {
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

      return data.map(item => {
        // Déterminer le nom du client en utilisant les nouvelles colonnes ou les données de la jointure
        let clientName = 'Client inconnu';
        
        // Utiliser d'abord les colonnes directes si elles existent
        if (item.client_first_name && item.client_last_name) {
          clientName = `${item.client_first_name} ${item.client_last_name}`;
        } 
        // Sinon, utiliser les données de la jointure si elles existent
        else if (item.client && item.client.first_name && item.client.last_name) {
          clientName = `${item.client.first_name} ${item.client.last_name}`;
        }
        
        // Vérifier si le statut existe et a des données valides
        const hasValidStatus = item.status && item.status.code;
        const statusCode = hasValidStatus ? item.status.code : '';
        const statusLabel = hasValidStatus ? item.status.label : '';
        
        // Déterminer l'opération (dépôt ou récupération)
        let operation = 'transit';
        if (statusCode === 'SUBMITTED') {
          operation = 'dropOff';
        } else if (['READY_FOR_PICKUP', 'DELIVERED'].includes(statusCode)) {
          operation = 'pickup';
        } else if (statusCode === 'RECEIVED') {
          // Les réparations reçues sont en transit (le point relais a déjà traité le dépôt)
          operation = 'transit';
        }
        
        console.log(`Réparation ${item.id} - Client: ${clientName} - Status: ${statusCode}`);
        
        return {
          id: item.id,
          clientId: item.client_id,
          clientName,
          deviceType: item.device_type || 'Non spécifié',
          brand: item.brand || 'Non spécifiée',
          model: item.model || 'Non spécifié',
          problemDescription: item.problem_description || 'Aucune description',
          statusId: item.status_id,
          statusName: statusCode,
          statusLabel,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          relayPointId: item.relay_point_id,
          appointmentDate: item.drop_off_date || item.created_at,
          operation
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des réparations du point relais:', error);
      throw error;
    }
  },

  /**
   * Récupère les dépôts à venir pour un point relais
   */
  async getPendingDropOffs(relayId: string): Promise<any[]> {
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

      return data.map(item => {
        // Déterminer le nom du client en utilisant les nouvelles colonnes ou les données de la jointure
        let clientName = 'Client inconnu';
        
        // Utiliser d'abord les colonnes directes si elles existent
        if (item.client_first_name && item.client_last_name) {
          clientName = `${item.client_first_name} ${item.client_last_name}`;
        } 
        // Sinon, utiliser les données de la jointure si elles existent
        else if (item.client && item.client.first_name && item.client.last_name) {
          clientName = `${item.client.first_name} ${item.client.last_name}`;
        }
        
        // Vérifier si le statut existe et a des données valides
        const hasValidStatus = item.status && item.status.code;
        const statusCode = hasValidStatus ? item.status.code : '';
        const statusLabel = hasValidStatus ? item.status.label : '';
        
        return {
          id: item.id,
          clientId: item.client_id,
          clientName,
          deviceType: item.device_type || 'Non spécifié',
          brand: item.brand || 'Non spécifiée',
          model: item.model || 'Non spécifié',
          problemDescription: item.problem_description || 'Aucune description',
          statusId: item.status_id,
          statusName: statusCode,
          statusLabel,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          relayPointId: item.relay_point_id,
          appointmentDate: item.drop_off_date || item.created_at,
          operation: 'dropOff',
          expectedArrival: item.drop_off_date || item.created_at
        };
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des dépôts à venir:', error);
      throw error;
    }
  },

  /**
   * Récupère les appareils prêts pour récupération
   */
  async getReadyForPickup(relayId: string): Promise<any[]> {
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

      return data.map(item => {
        // Déterminer le nom du client en utilisant les nouvelles colonnes ou les données de la jointure
        let clientName = 'Client inconnu';
        
        // Utiliser d'abord les colonnes directes si elles existent
        if (item.client_first_name && item.client_last_name) {
          clientName = `${item.client_first_name} ${item.client_last_name}`;
        } 
        // Sinon, utiliser les données de la jointure si elles existent
        else if (item.client && item.client.first_name && item.client.last_name) {
          clientName = `${item.client.first_name} ${item.client.last_name}`;
        }
        
        // Vérifier si le statut existe et a des données valides
        const hasValidStatus = item.status && item.status.code;
        const statusCode = hasValidStatus ? item.status.code : '';
        const statusLabel = hasValidStatus ? item.status.label : '';
        
        return {
          id: item.id,
          clientId: item.client_id,
          clientName,
          deviceType: item.device_type || 'Non spécifié',
          brand: item.brand || 'Non spécifiée',
          model: item.model || 'Non spécifié',
          problemDescription: item.problem_description || 'Aucune description',
          statusId: item.status_id,
          statusName: statusCode,
          statusLabel,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          relayPointId: item.relay_point_id,
          appointmentDate: item.drop_off_date || item.created_at,
          operation: 'pickup'
        };
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des appareils prêts pour récupération:', error);
      throw error;
    }
  },

  /**
   * Récupère les appareils en transit
   */
  async getInTransit(relayId: string): Promise<any[]> {
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

      return data.map(item => {
        // Déterminer le nom du client en utilisant les nouvelles colonnes ou les données de la jointure
        let clientName = 'Client inconnu';
        
        // Utiliser d'abord les colonnes directes si elles existent
        if (item.client_first_name && item.client_last_name) {
          clientName = `${item.client_first_name} ${item.client_last_name}`;
        } 
        // Sinon, utiliser les données de la jointure si elles existent
        else if (item.client && item.client.first_name && item.client.last_name) {
          clientName = `${item.client.first_name} ${item.client.last_name}`;
        }
        
        // Vérifier si le statut existe et a des données valides
        const hasValidStatus = item.status && item.status.code;
        const statusCode = hasValidStatus ? item.status.code : '';
        const statusLabel = hasValidStatus ? item.status.label : '';
        
        return {
          id: item.id,
          clientId: item.client_id,
          clientName,
          deviceType: item.device_type || 'Non spécifié',
          brand: item.brand || 'Non spécifiée',
          model: item.model || 'Non spécifié',
          problemDescription: item.problem_description || 'Aucune description',
          statusId: item.status_id,
          statusName: statusCode,
          statusLabel,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          relayPointId: item.relay_point_id,
          appointmentDate: item.drop_off_date || item.created_at,
          operation: 'transit'
        };
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des appareils en transit:', error);
      throw error;
    }
  },

  /**
   * Récupère les appareils traités ce mois
   */
  async getCompletedThisMonth(relayId: string): Promise<any[]> {
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

      return data.map(item => {
        // Déterminer le nom du client en utilisant les nouvelles colonnes ou les données de la jointure
        let clientName = 'Client inconnu';
        
        // Utiliser d'abord les colonnes directes si elles existent
        if (item.client_first_name && item.client_last_name) {
          clientName = `${item.client_first_name} ${item.client_last_name}`;
        } 
        // Sinon, utiliser les données de la jointure si elles existent
        else if (item.client && item.client.first_name && item.client.last_name) {
          clientName = `${item.client.first_name} ${item.client.last_name}`;
        }
        
        // Vérifier si le statut existe et a des données valides
        const hasValidStatus = item.status && item.status.code;
        const statusCode = hasValidStatus ? item.status.code : '';
        const statusLabel = hasValidStatus ? item.status.label : '';
        
        return {
          id: item.id,
          clientId: item.client_id,
          clientName,
          deviceType: item.device_type || 'Non spécifié',
          brand: item.brand || 'Non spécifiée',
          model: item.model || 'Non spécifié',
          problemDescription: item.problem_description || 'Aucune description',
          statusId: item.status_id,
          statusName: statusCode,
          statusLabel,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          relayPointId: item.relay_point_id,
          operation: 'completed'
        };
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des appareils traités ce mois:', error);
      throw error;
    }
  },

  /**
   * Met à jour le statut d'une réparation lors d'un dépôt
   * @param repairId ID de la réparation
   * @param relayPointId ID du point relais (optionnel)
   */
  async processDropOff(repairId: string, relayPointId?: string): Promise<void> {
    try {
      // Récupérer l'ID du statut RECEIVED
      const { data: statusData, error: statusError } = await supabase
        .from('repair_statuses')
        .select('id')
        .eq('code', 'RECEIVED')
        .single();

      if (statusError) throw statusError;
      
      // Récupérer l'ID du point relais connecté si non fourni
      const actualRelayId = relayPointId || (await supabase.auth.getUser()).data.user?.id;
      
      if (!actualRelayId) {
        throw new Error('ID du point relais non disponible');
      }
      
      console.log(`Traitement du dépôt pour la réparation ${repairId} par le point relais ${actualRelayId}`);
      
      // Vérifier si la réparation existe
      const { data: repairData, error: repairError } = await supabase
        .from('repair_requests')
        .select('*')
        .eq('id', repairId)
        .maybeSingle();
        
      if (repairError) throw repairError;
      
      if (!repairData) {
        console.log(`Réparation ${repairId} non trouvée dans repair_requests, vérification dans repair_codes...`);
        
        // Vérifier si le code de réparation existe
        const { data: repairCodeData, error: repairCodeError } = await supabase
          .from('repair_codes')
          .select('*')
          .eq('id', repairId)
          .maybeSingle();
          
        if (repairCodeError) throw repairCodeError;
        
        if (!repairCodeData) {
          throw new Error(`Aucune réparation trouvée avec l'ID ${repairId}`);
        }
        
        console.log(`Code de réparation trouvé dans repair_codes:`, repairCodeData);
        
        // Récupérer les données du client si un client_id est fourni
        let clientFirstName = null;
        let clientLastName = null;
        
        if (repairCodeData.client_id) {
          try {
            const { data: clientData, error: clientError } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', repairCodeData.client_id)
              .maybeSingle();
              
            if (!clientError && clientData) {
              clientFirstName = clientData.first_name;
              clientLastName = clientData.last_name;
            }
          } catch (err) {
            console.error('Erreur lors de la récupération des données client:', err);
          }
        }
        
        // Créer une nouvelle réparation basée sur le code
        const newRepairData = {
          id: repairId,
          client_id: repairCodeData.client_id || null,
          client_first_name: clientFirstName,
          client_last_name: clientLastName,
          status_id: statusData.id,
          relay_point_id: actualRelayId,
          drop_off_relay_id: actualRelayId,
          drop_off_date: new Date().toISOString(),
          device_type: repairCodeData.device_type || 'Inconnu',
          brand: repairCodeData.brand || 'Inconnue',
          model: repairCodeData.model || 'Inconnu',
          problem_description: repairCodeData.problem_description || 'Aucune description',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Insérer la nouvelle réparation
        const { error: insertError } = await supabase
          .from('repair_requests')
          .insert(newRepairData);
        
        if (insertError) {
          console.error('Erreur lors de la création de la réparation:', insertError);
          throw insertError;
        }
        
        console.log(`Réparation ${repairId} créée avec succès`);
        return; // Sortir de la fonction car la réparation a déjà été créée avec le statut RECEIVED
      }
      
      // Préparer les données de mise à jour
      const updateData: Record<string, any> = { 
        status_id: statusData.id,
        drop_off_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Si un relayPointId est fourni et que le champ drop_off_relay_id est vide, le mettre à jour
      if (actualRelayId && (!repairData.drop_off_relay_id || repairData.drop_off_relay_id === '')) {
        updateData.drop_off_relay_id = actualRelayId;
      }

      const { error } = await supabase
        .from('repair_requests')
        .update(updateData)
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
      console.log(`Récupération des statistiques pour le point relais ${relayId}`);
      
      // Récupérer d'abord les codes de statut pour éviter les erreurs de jointure
      const { data: statusData, error: statusError } = await supabase
        .from('repair_statuses')
        .select('id, code')
        .in('code', ['SUBMITTED', 'READY_FOR_PICKUP', 'RECEIVED', 'DELIVERED']);
        
      if (statusError) throw statusError;
      
      if (!statusData || statusData.length === 0) {
        console.error('Aucun statut trouvé dans la base de données');
        return {
          pendingDropOffs: 0,
          readyForPickup: 0,
          inTransit: 0,
          completedThisMonth: 0
        };
      }
      
      // Créer un mapping des codes de statut vers leurs IDs
      const statusMap = statusData.reduce((acc, status) => {
        acc[status.code] = status.id;
        return acc;
      }, {} as Record<string, string>);
      
      console.log('Mapping des statuts:', statusMap);
      
      // Obtenir le premier jour du mois courant pour le filtre des réparations terminées
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      // Récupérer le nombre de réparations pour chaque statut
      const pendingPromise = supabase
        .from('repair_requests')
        .select('id', { count: 'exact', head: true })
        .eq('relay_point_id', relayId)
        .eq('status_id', statusMap['SUBMITTED']);
        
      const readyPromise = supabase
        .from('repair_requests')
        .select('id', { count: 'exact', head: true })
        .eq('relay_point_id', relayId)
        .eq('status_id', statusMap['READY_FOR_PICKUP']);
        
      const transitPromise = supabase
        .from('repair_requests')
        .select('id', { count: 'exact', head: true })
        .eq('relay_point_id', relayId)
        .eq('status_id', statusMap['RECEIVED']);
        
      const completedPromise = supabase
        .from('repair_requests')
        .select('id', { count: 'exact', head: true })
        .eq('relay_point_id', relayId)
        .eq('status_id', statusMap['DELIVERED'])
        .gte('updated_at', firstDayOfMonth.toISOString());
      
      // Exécuter toutes les requêtes en parallèle
      const [pendingResult, readyResult, transitResult, completedResult] = await Promise.all([
        pendingPromise,
        readyPromise,
        transitPromise,
        completedPromise
      ]);
      
      // Vérifier les erreurs
      if (pendingResult.error) throw pendingResult.error;
      if (readyResult.error) throw readyResult.error;
      if (transitResult.error) throw transitResult.error;
      if (completedResult.error) throw completedResult.error;
      
      // Extraire les compteurs
      const stats = {
        pendingDropOffs: pendingResult.count || 0,
        readyForPickup: readyResult.count || 0,
        inTransit: transitResult.count || 0,
        completedThisMonth: completedResult.count || 0
      };
      
      console.log('Statistiques récupérées:', stats);
      
      return stats;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques du point relais:', error);
      throw error;
    }
  }
};
