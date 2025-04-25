import { supabase } from '../lib/supabaseConfig';

export interface ChatMessage {
  id: string;
  requestId: string;
  senderId: string;
  senderRole: 'client' | 'relayPoint' | 'technician' | 'admin';
  message: string;
  isAi: boolean;
  timestamp: string;
  senderName?: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'document' | 'other';
}

export interface TypingStatus {
  requestId: string;
  userId: string;
  isTyping: boolean;
  timestamp: string;
}

export const chatService = {
  /**
   * Met à jour le statut de frappe d'un utilisateur
   * @param requestId ID de la demande de réparation
   * @param userId ID de l'utilisateur
   * @param isTyping Indique si l'utilisateur est en train de taper
   * @returns Statut mis à jour
   */
  async updateTypingStatus(requestId: string, userId: string, isTyping: boolean): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      
      // Mettre à jour le statut de frappe dans la base de données
      const { error } = await supabase
        .from('chat_typing_status')
        .upsert({
          request_id: requestId,
          user_id: userId,
          is_typing: isTyping,
          timestamp
        });

      if (error) throw error;
      
      // Publier l'événement de frappe sur le canal
      await supabase
        .channel(`chat:${requestId}`)
        .send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId, isTyping, timestamp }
        });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de frappe:', error);
    }
  },
  
  /**
   * S'abonne aux événements de frappe pour une demande de réparation
   * @param requestId ID de la demande de réparation
   * @param callback Fonction à appeler lorsqu'un événement de frappe est reçu
   * @returns Fonction pour se désabonner
   */
  subscribeToTypingEvents(requestId: string, callback: (status: TypingStatus) => void) {
    const channel = supabase.channel(`chat:${requestId}`);
    
    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        callback({
          requestId,
          userId: payload.payload.userId,
          isTyping: payload.payload.isTyping,
          timestamp: payload.payload.timestamp
        });
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  },
  /**
   * Récupère les messages de chat pour une demande de réparation spécifique
   * @param requestId ID de la demande de réparation
   * @returns Liste des messages de chat
   */
  async getChatMessages(requestId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:profiles!sender_id(id, first_name, last_name)
        `)
        .eq('request_id', requestId)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      // Formater les données pour l'affichage
      return (data || []).map(msg => ({
        id: msg.id,
        requestId: msg.request_id,
        senderId: msg.sender_id,
        senderRole: msg.sender_role,
        message: msg.message,
        isAi: msg.is_ai,
        timestamp: msg.timestamp,
        senderName: msg.sender ? `${msg.sender.first_name} ${msg.sender.last_name}` : undefined
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des messages de chat:', error);
      throw error;
    }
  },

  /**
   * Envoie un nouveau message de chat
   * @param message Données du message à envoyer
   * @param file Fichier optionnel à joindre au message
   * @returns Le message créé
   */
  async sendMessage(
    message: Omit<ChatMessage, 'id' | 'timestamp' | 'senderName' | 'attachmentUrl' | 'attachmentType'>, 
    file?: File
  ): Promise<ChatMessage> {
    try {
      let attachmentUrl = undefined;
      let attachmentType = undefined;
      
      // Si un fichier est fourni, le télécharger d'abord
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${message.requestId}/${message.senderId}_${Date.now()}.${fileExt}`;
        const filePath = `chat-attachments/${fileName}`;
        
        // Déterminer le type de pièce jointe
        if (file.type.startsWith('image/')) {
          attachmentType = 'image';
        } else if (
          file.type === 'application/pdf' || 
          file.type.includes('document') || 
          file.type.includes('sheet')
        ) {
          attachmentType = 'document';
        } else {
          attachmentType = 'other';
        }
        
        // Télécharger le fichier
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (uploadError) throw uploadError;
        
        // Récupérer l'URL publique du fichier
        const { data: urlData } = supabase.storage
          .from('attachments')
          .getPublicUrl(filePath);
          
        attachmentUrl = urlData.publicUrl;
      }
      
      // Insérer le message avec les informations de pièce jointe si disponibles
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          request_id: message.requestId,
          sender_id: message.senderId,
          sender_role: message.senderRole,
          message: message.message,
          is_ai: message.isAi,
          attachment_url: attachmentUrl,
          attachment_type: attachmentType,
          timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        requestId: data.request_id,
        senderId: data.sender_id,
        senderRole: data.sender_role,
        message: data.message,
        isAi: data.is_ai,
        timestamp: data.timestamp,
        attachmentUrl: data.attachment_url,
        attachmentType: data.attachment_type as 'image' | 'document' | 'other' | undefined
      };
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      throw error;
    }
  },

  /**
   * Configure un abonnement en temps réel aux nouveaux messages
   * @param requestId ID de la demande de réparation
   * @param callback Fonction à appeler lorsqu'un nouveau message est reçu
   * @returns Fonction pour se désabonner
   */
  subscribeToMessages(requestId: string, callback: (message: ChatMessage) => void) {
    const subscription = supabase
      .channel(`chat:${requestId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `request_id=eq.${requestId}`
      }, async (payload) => {
        // Récupérer les informations de l'expéditeur
        const { data: senderData } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', payload.new.sender_id)
          .single();

        const message: ChatMessage = {
          id: payload.new.id,
          requestId: payload.new.request_id,
          senderId: payload.new.sender_id,
          senderRole: payload.new.sender_role,
          message: payload.new.message,
          isAi: payload.new.is_ai,
          timestamp: payload.new.timestamp,
          senderName: senderData ? `${senderData.first_name} ${senderData.last_name}` : undefined,
          attachmentUrl: payload.new.attachment_url,
          attachmentType: payload.new.attachment_type
        };

        callback(message);
      })
      .subscribe();

    // Retourner une fonction pour se désabonner
    return () => {
      supabase.removeChannel(subscription);
    };
  },

  /**
   * Marque tous les messages comme lus pour un utilisateur
   * @param requestId ID de la demande de réparation
   * @param userId ID de l'utilisateur
   */
  async markMessagesAsRead(requestId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_messages_read_status')
        .upsert([
          {
            request_id: requestId,
            user_id: userId,
            last_read: new Date().toISOString()
          }
        ]);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors du marquage des messages comme lus:', error);
      throw error;
    }
  },

  /**
   * Vérifie si un utilisateur a des messages non lus
   * @param userId ID de l'utilisateur
   * @returns Nombre de demandes de réparation avec des messages non lus
   */
  async getUnreadMessagesCount(userId: string): Promise<number> {
    try {
      // Vérifier si userId est défini
      if (!userId) {
        console.warn('getUnreadMessagesCount appelé sans userId valide');
        return 0;
      }

      // Utiliser la fonction RPC pour compter les messages non lus
      const { data, error } = await supabase.rpc('get_unread_messages_count', {
        user_id: userId
      });

      if (error) {
        console.error('Erreur RPC get_unread_messages_count:', error.message, error.details, error.hint);
        throw error;
      }

      return data || 0;
    } catch (error) {
      console.error('Erreur lors de la vérification des messages non lus:', error);
      // Retourner 0 pour ne pas bloquer l'interface utilisateur
      return 0;
    }
  },
  
  /**
   * Exporte l'historique de conversation au format PDF
   * @param requestId ID de la demande de réparation
   * @returns URL du fichier PDF généré
   */
  async exportChatHistory(requestId: string): Promise<string> {
    try {
      // Appeler une fonction RPC Supabase pour générer le PDF côté serveur
      const { data, error } = await supabase.rpc('export_chat_history_pdf', {
        request_id: requestId
      });
      
      if (error) throw error;
      
      return data; // URL du PDF généré
    } catch (error) {
      console.error('Erreur lors de l\'exportation de l\'historique de chat:', error);
      throw error;
    }
  }
};
