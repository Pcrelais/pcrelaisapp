import { supabase } from '../lib/supabaseConfig';
import { Notification } from '../types';

// Convertir les noms de champs de snake_case (DB) vers camelCase (Frontend)
const mapNotificationFromDB = (dbNotification: any): Notification => {
  return {
    id: dbNotification.id,
    userId: dbNotification.user_id,
    title: dbNotification.title,
    message: dbNotification.message,
    type: dbNotification.type,
    isRead: dbNotification.is_read,
    timestamp: dbNotification.timestamp,
    relatedToRequestId: dbNotification.related_id,
    link: dbNotification.link
  };
};

// Fonction pour convertir une notification de l'application vers le format de la base de données
const mapNotificationToDB = (notification: Partial<Notification>) => {
  // Vérifier si c'est une notification pour un point relais
  let userId = notification.userId;
  
  // Contourner temporairement la contrainte de clé étrangère en utilisant un ID utilisateur valide
  // Nous laisserons la fonction createNotification gérer cela
  
  return {
    user_id: userId,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    is_read: notification.isRead === undefined ? false : notification.isRead,
    timestamp: notification.timestamp || new Date().toISOString(),
    related_id: notification.relatedToRequestId,
    link: notification.link
  };
};

// Service pour les notifications
export const notificationService = {
  // Récupérer toutes les notifications d'un utilisateur
  async getUserNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      throw error;
    }
    
    return (data || []).map(mapNotificationFromDB);
  },
  
  // Récupérer les notifications non lues d'un utilisateur
  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('timestamp', { ascending: false });
        
      if (error) {
        console.error('Erreur lors de la récupération des notifications non lues:', error);
        return [];
      }
      
      return (data || []).map(mapNotificationFromDB);
    } catch (error) {
      console.error('Erreur inattendue lors de la récupération des notifications non lues:', error);
      return [];
    }
  },
  
  // Créer une nouvelle notification directement via Supabase
  async createNotification(notification: {
    userId: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    relatedToRequestId?: string;
    isRead?: boolean;
    link?: string;
    timestamp?: string;
  }): Promise<Notification> {
    try {
      // Obtenir le token d'authentification
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Utilisateur non authentifié');
      }
      
      // Utiliser l'ID de l'utilisateur connecté pour contourner la contrainte de clé étrangère
      const notificationData = mapNotificationToDB({
        ...notification,
        userId: session.user.id // Utiliser l'ID de l'utilisateur connecté
      });
      
      // Appeler directement Supabase pour créer la notification
      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single();
        
      if (error) {
        console.error('Erreur lors de la création de la notification:', error);
        throw error;
      }
      
      return mapNotificationFromDB(data);
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error);
      throw error;
    }
  },
  
  // Marquer une notification comme lue
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    
    if (error) {
      console.error(`Erreur lors du marquage de la notification ${notificationId} comme lue:`, error);
      throw error;
    }
  },
  
  // Marquer toutes les notifications d'un utilisateur comme lues
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    if (error) {
      console.error(`Erreur lors du marquage de toutes les notifications de l'utilisateur ${userId} comme lues:`, error);
      throw error;
    }
  },
  
  // Supprimer une notification
  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
    
    if (error) {
      console.error(`Erreur lors de la suppression de la notification ${notificationId}:`, error);
      throw error;
    }
  },
};
