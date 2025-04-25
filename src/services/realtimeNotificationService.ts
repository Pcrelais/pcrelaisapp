import { supabase } from '../lib/supabaseConfig';
import { Notification as AppNotification } from '../types';

export interface RepairInfo {
  id: string;
  brand: string;
  model: string;
  statusId: string | number;
  statusName?: string;
  statusLabel?: string;
}

export interface RealtimeNotification extends AppNotification {
  isRead: boolean;
  timestamp: string;
  relatedId?: string;
  repairInfo?: RepairInfo;
}

export const realtimeNotificationService = {
  /**
   * Obtient le nombre de notifications non lues pour un utilisateur
   * @param userId ID de l'utilisateur
   * @returns Nombre de notifications non lues
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_read', false);
      
      if (error) {
        console.error('Erreur lors du comptage des notifications non lues:', error);
        return 0;
      }
      
      return count || 0;
    } catch (error) {
      console.error('Erreur lors du comptage des notifications non lues:', error);
      return 0;
    }
  },
  
  /**
   * S'abonne aux notifications en temps réel pour un utilisateur
   * @param userId ID de l'utilisateur
   * @param callback Fonction à appeler lorsqu'une nouvelle notification est reçue
   * @returns Fonction pour se désabonner
   */
  subscribeToNotifications(userId: string, callback: (notification: RealtimeNotification) => void) {
    const channel = supabase
      .channel(`user-notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, async (payload) => {
        try {
          // Récupérer les détails complets de la notification
          const { data, error } = await supabase
            .from('notifications')
            .select(`
              *,
              repair:repair_requests(id, brand, model, status_id, status:repair_statuses(name, label))
            `)
            .eq('id', payload.new.id)
            .single();

          if (error) throw error;
          
          // Formater la notification
          const notification: RealtimeNotification = {
            id: data.id,
            userId: data.user_id,
            title: data.title,
            message: data.message,
            type: data.type,
            relatedId: data.related_id,
            isRead: data.is_read,
            timestamp: data.created_at,
            repairInfo: data.repair ? {
              id: data.repair.id,
              brand: data.repair.brand,
              model: data.repair.model,
              statusId: data.repair.status_id,
              statusName: data.repair.status?.name,
              statusLabel: data.repair.status?.label
            } : undefined
          };
          
          callback(notification);
          
          // Jouer un son de notification (optionnel)
          this.playNotificationSound();
          
          // Afficher une notification de bureau si l'application n'est pas active
          if (document.visibilityState !== 'visible') {
            this.showDesktopNotification(notification);
          }
        } catch (error) {
          console.error('Erreur lors du traitement de la notification:', error);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  },
  
  /**
   * Marque une notification comme lue
   * @param notificationId ID de la notification
   * @returns true si la mise à jour a réussi
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
        
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Erreur lors du marquage de la notification comme lue:', error);
      return false;
    }
  },
  
  /**
   * Marque toutes les notifications d'un utilisateur comme lues
   * @param userId ID de l'utilisateur
   * @returns true si la mise à jour a réussi
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
        
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
      return false;
    }
  },
  
  /**
   * Supprime une notification
   * @param notificationId ID de la notification
   * @returns true si la suppression a réussi
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
        
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
      return false;
    }
  },
  
  /**
   * Récupère les notifications non lues d'un utilisateur
   * @param userId ID de l'utilisateur
   * @returns Liste des notifications non lues
   */
  async getUnreadNotifications(userId: string): Promise<RealtimeNotification[]> {
    try {
      // Simplifier la requête pour éviter les problèmes de relation
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Erreur lors de la récupération des notifications non lues:', error);
        return [];
      }
      
      // Formater les notifications sans essayer de récupérer les informations de réparation pour l'instant
      return (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        title: item.title,
        message: item.message,
        type: item.type,
        relatedId: item.related_id,
        isRead: item.is_read,
        timestamp: item.created_at
      }));
      
      // Note: Si les informations de réparation sont nécessaires, nous pouvons les récupérer
      // séparément une fois que les problèmes de relation seront résolus
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications non lues:', error);
      return [];
    }
  },
  
  /**
   * Récupère toutes les notifications d'un utilisateur
   * @param userId ID de l'utilisateur
   * @param limit Nombre maximum de notifications à récupérer
   * @returns Liste des notifications
   */
  async getAllNotifications(userId: string, limit: number = 50): Promise<RealtimeNotification[]> {
    try {
      // Simplifier la requête pour éviter les problèmes de relation
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
        
      if (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
        return [];
      }
      
      // Formater les notifications sans essayer de récupérer les informations de réparation
      return (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        title: item.title,
        message: item.message,
        type: item.type,
        relatedId: item.related_id,
        isRead: item.is_read,
        timestamp: item.created_at
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      return [];
    }
  },
  
  /**
   * Crée une nouvelle notification
   * @param notification Données de la notification
   * @returns La notification créée
   */
  async createNotification(notification: Omit<RealtimeNotification, 'id' | 'timestamp'>): Promise<RealtimeNotification | null> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: notification.userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          related_id: notification.relatedId,
          is_read: notification.isRead,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) throw error;
      
      return {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        message: data.message,
        type: data.type,
        relatedId: data.related_id,
        isRead: data.is_read,
        timestamp: data.created_at,
        repairInfo: notification.repairInfo
      };
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error);
      return null;
    }
  },
  
  /**
   * Joue un son de notification
   */
  playNotificationSound() {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => {
        // Ignorer les erreurs liées à l'autoplay
        console.log('Impossible de jouer le son de notification:', err);
      });
    } catch (error) {
      console.error('Erreur lors de la lecture du son de notification:', error);
    }
  },
  
  /**
   * Affiche une notification de bureau
   * @param notification Données de la notification
   */
  showDesktopNotification(notification: RealtimeNotification) {
    // Vérifier si les notifications de bureau sont supportées et autorisées
    if (!('Notification' in window)) {
      return;
    }
    
    if (Notification.permission === 'granted') {
      const title = notification.title || 'PC Relais';
      const options = {
        body: notification.message,
        icon: '/logo192.png',
        tag: `notification-${notification.id}`,
        data: {
          url: notification.repairInfo ? `/repair/${notification.repairInfo.id}` : '/',
          notificationId: notification.id
        }
      };
      
      const notif = new Notification(title, options);
      
      notif.onclick = function() {
        window.focus();
        if (this.data && this.data.url) {
          window.location.href = this.data.url;
        }
        this.close();
      };
    }
  }
};
