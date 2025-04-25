import { supabase } from '../lib/supabaseConfig';

export interface PushSubscription {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: string;
}

export const pushNotificationService = {
  /**
   * Vérifie si les notifications push sont supportées par le navigateur
   * @returns true si les notifications push sont supportées
   */
  isPushSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  },

  /**
   * Demande la permission pour les notifications
   * @returns Statut de la permission ('granted', 'denied', ou 'default')
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isPushSupported()) {
      throw new Error('Les notifications push ne sont pas supportées par ce navigateur');
    }

    return await Notification.requestPermission();
  },

  /**
   * Enregistre le service worker pour les notifications push
   * @returns L'enregistrement du service worker
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    if (!this.isPushSupported()) {
      throw new Error('Les notifications push ne sont pas supportées par ce navigateur');
    }

    return await navigator.serviceWorker.register('/service-worker.js');
  },

  /**
   * S'abonne aux notifications push
   * @param userId ID de l'utilisateur
   * @returns L'abonnement push
   */
  async subscribe(userId: string): Promise<PushSubscription | null> {
    try {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.log('Permission de notification refusée');
        return null;
      }

      const registration = await this.registerServiceWorker();
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.REACT_APP_VAPID_PUBLIC_KEY || ''
        ),
      });

      const subscriptionJson = subscription.toJSON();
      const { endpoint, keys } = subscriptionJson;

      if (!endpoint || !keys) {
        throw new Error('Échec de l\'abonnement aux notifications push');
      }

      // Enregistrer l'abonnement dans la base de données
      const { data, error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return {
        userId: data.user_id,
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
        createdAt: data.created_at,
      };
    } catch (error) {
      console.error('Erreur lors de l\'abonnement aux notifications push:', error);
      return null;
    }
  },

  /**
   * Se désabonne des notifications push
   * @param userId ID de l'utilisateur
   * @returns true si le désabonnement a réussi
   */
  async unsubscribe(userId: string): Promise<boolean> {
    try {
      if (!this.isPushSupported()) {
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      // Supprimer l'abonnement de la base de données
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Erreur lors du désabonnement aux notifications push:', error);
      return false;
    }
  },

  /**
   * Convertit une chaîne base64 en tableau Uint8Array (pour la clé VAPID)
   * @param base64String Chaîne en base64
   * @returns Tableau Uint8Array
   */
  urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }
};
