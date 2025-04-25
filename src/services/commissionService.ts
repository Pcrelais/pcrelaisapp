import { supabase } from '../lib/supabaseConfig';

// Définir l'interface Commission localement pour éviter les problèmes d'importation
interface Commission {
  id: string;
  relayPointId: string;
  repairId?: string;
  productId?: string;
  amount: number;
  type: 'service' | 'product';
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: string;
  paidAt?: string;
}

export const commissionService = {
  /**
   * Calculer et créer une commission pour un service (réparation)
   * @param relayPointId ID du point relais
   * @param repairId ID de la réparation
   * @param repairAmount Montant total de la réparation
   * @param commissionRate Taux de commission (si non fourni, sera récupéré depuis les données du point relais)
   */
  async createServiceCommission(
    relayPointId: string,
    repairId: string,
    repairAmount: number,
    commissionRate?: number
  ): Promise<Commission | null> {
    try {
      // Si le taux de commission n'est pas fourni, le récupérer depuis les données du point relais
      if (commissionRate === undefined) {
        const { data: relayPoint, error: relayError } = await supabase
          .from('relay_points')
          .select('service_commission_rate')
          .eq('id', relayPointId)
          .single();

        if (relayError || !relayPoint) {
          console.error('Erreur lors de la récupération du taux de commission:', relayError);
          return null;
        }

        commissionRate = relayPoint.service_commission_rate || 0;
      }

      // Calculer le montant de la commission
      const commissionAmount = (repairAmount * (commissionRate || 0)) / 100;

      // Créer la commission dans la base de données
      const { data, error } = await supabase
        .from('commissions')
        .insert({
          relay_point_id: relayPointId,
          repair_id: repairId,
          amount: commissionAmount,
          type: 'service',
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (error) {
        console.error('Erreur lors de la création de la commission:', error);
        return null;
      }

      // Mapper les données de la base de données vers l'interface Commission
      return {
        id: data.id,
        relayPointId: data.relay_point_id,
        repairId: data.repair_id,
        amount: data.amount,
        type: data.type,
        status: data.status,
        createdAt: data.created_at,
        paidAt: data.paid_at
      };
    } catch (error) {
      console.error('Erreur lors de la création de la commission:', error);
      return null;
    }
  },

  /**
   * Calculer et créer une commission pour un produit
   * @param relayPointId ID du point relais
   * @param productId ID du produit
   * @param productAmount Montant total du produit
   * @param commissionRate Taux de commission (si non fourni, sera récupéré depuis les données du point relais)
   */
  async createProductCommission(
    relayPointId: string,
    productId: string,
    productAmount: number,
    commissionRate?: number
  ): Promise<Commission | null> {
    try {
      // Si le taux de commission n'est pas fourni, le récupérer depuis les données du point relais
      if (commissionRate === undefined) {
        const { data: relayPoint, error: relayError } = await supabase
          .from('relay_points')
          .select('product_commission_rate')
          .eq('id', relayPointId)
          .single();

        if (relayError || !relayPoint) {
          console.error('Erreur lors de la récupération du taux de commission:', relayError);
          return null;
        }

        commissionRate = relayPoint.product_commission_rate || 0;
      }

      // Calculer le montant de la commission
      const commissionAmount = (productAmount * (commissionRate || 0)) / 100;

      // Créer la commission dans la base de données
      const { data, error } = await supabase
        .from('commissions')
        .insert({
          relay_point_id: relayPointId,
          product_id: productId,
          amount: commissionAmount,
          type: 'product',
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (error) {
        console.error('Erreur lors de la création de la commission:', error);
        return null;
      }

      // Mapper les données de la base de données vers l'interface Commission
      return {
        id: data.id,
        relayPointId: data.relay_point_id,
        productId: data.product_id,
        amount: data.amount,
        type: data.type,
        status: data.status,
        createdAt: data.created_at,
        paidAt: data.paid_at
      };
    } catch (error) {
      console.error('Erreur lors de la création de la commission:', error);
      return null;
    }
  },

  /**
   * Mettre à jour le statut d'une commission
   * @param commissionId ID de la commission
   * @param status Nouveau statut de la commission
   */
  async updateCommissionStatus(
    commissionId: string,
    status: 'pending' | 'paid' | 'cancelled'
  ): Promise<Commission | null> {
    try {
      const updateData: Record<string, any> = {
        status
      };

      // Si le statut est "paid", ajouter la date de paiement
      if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('commissions')
        .update(updateData)
        .eq('id', commissionId)
        .select('*')
        .single();

      if (error) {
        console.error('Erreur lors de la mise à jour du statut de la commission:', error);
        return null;
      }

      // Mapper les données de la base de données vers l'interface Commission
      return {
        id: data.id,
        relayPointId: data.relay_point_id,
        repairId: data.repair_id,
        productId: data.product_id,
        amount: data.amount,
        type: data.type,
        status: data.status,
        createdAt: data.created_at,
        paidAt: data.paid_at
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de la commission:', error);
      return null;
    }
  },

  /**
   * Récupérer toutes les commissions d'un point relais
   * @param relayPointId ID du point relais
   * @param status Statut des commissions à récupérer (optionnel)
   */
  async getRelayPointCommissions(
    relayPointId: string,
    status?: 'pending' | 'paid' | 'cancelled'
  ): Promise<Commission[]> {
    try {
      let query = supabase
        .from('commissions')
        .select('*')
        .eq('relay_point_id', relayPointId);

      // Si un statut est spécifié, filtrer par ce statut
      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des commissions:', error);
        return [];
      }

      // Mapper les données de la base de données vers l'interface Commission
      return data.map(item => ({
        id: item.id,
        relayPointId: item.relay_point_id,
        repairId: item.repair_id,
        productId: item.product_id,
        amount: item.amount,
        type: item.type,
        status: item.status,
        createdAt: item.created_at,
        paidAt: item.paid_at
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des commissions:', error);
      return [];
    }
  },

  /**
   * Calculer le total des commissions d'un point relais
   * @param relayPointId ID du point relais
   * @param status Statut des commissions à inclure dans le calcul (optionnel)
   * @param type Type de commissions à inclure dans le calcul (optionnel)
   */
  async calculateTotalCommissions(
    relayPointId: string,
    status?: 'pending' | 'paid' | 'cancelled',
    type?: 'service' | 'product'
  ): Promise<number> {
    try {
      let query = supabase
        .from('commissions')
        .select('amount')
        .eq('relay_point_id', relayPointId);

      // Si un statut est spécifié, filtrer par ce statut
      if (status) {
        query = query.eq('status', status);
      }

      // Si un type est spécifié, filtrer par ce type
      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur lors du calcul des commissions:', error);
        return 0;
      }

      // Calculer la somme des montants
      return data.reduce((total, item) => total + (item.amount || 0), 0);
    } catch (error) {
      console.error('Erreur lors du calcul des commissions:', error);
      return 0;
    }
  }
};
