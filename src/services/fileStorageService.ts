import { supabase } from '../lib/supabaseConfig';
import { v4 as uuidv4 } from 'uuid';

/**
 * Types de fichiers acceptés
 */
export type FileType = 'image' | 'document';

/**
 * Interface pour les métadonnées de fichier
 */
export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  thumbnailUrl?: string;
  createdAt: string;
  repairId?: string;
  messageId?: string;
  userId: string;
}

/**
 * Service de gestion du stockage de fichiers avec Supabase
 */
export const fileStorageService = {
  /**
   * Télécharge un fichier vers Supabase Storage
   * @param file Fichier à télécharger
   * @param type Type de fichier (image ou document)
   * @param userId ID de l'utilisateur qui télécharge le fichier
   * @param repairId ID de la réparation associée (optionnel)
   * @param messageId ID du message associé (optionnel)
   * @returns Métadonnées du fichier téléchargé
   */
  async uploadFile(
    file: File,
    type: FileType,
    userId: string,
    repairId?: string,
    messageId?: string
  ): Promise<FileMetadata | null> {
    try {
      // Vérifier le type de fichier
      if (!this.isValidFileType(file, type)) {
        throw new Error(`Type de fichier non autorisé: ${file.type}`);
      }

      // Vérifier la taille du fichier (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Le fichier est trop volumineux (max 10MB)');
      }

      // Générer un nom de fichier unique
      const fileId = uuidv4();
      const fileExt = file.name.split('.').pop();
      const fileName = `${fileId}.${fileExt}`;
      const filePath = `${type === 'image' ? 'images' : 'documents'}/${fileName}`;

      // Télécharger le fichier
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('repair-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Générer l'URL publique
      const { data: urlData } = await supabase.storage
        .from('repair-files')
        .getPublicUrl(filePath);

      // Générer une miniature si c'est une image
      let thumbnailUrl;
      if (type === 'image') {
        const { data: resizeData } = await supabase.storage
          .from('repair-files')
          .getPublicUrl(filePath, {
            transform: {
              width: 200,
              height: 200,
              resize: 'cover',
            },
          });
        thumbnailUrl = resizeData?.publicUrl;
      }

      // Enregistrer les métadonnées du fichier dans la base de données
      const { data: metadataData, error: metadataError } = await supabase
        .from('files')
        .insert({
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          url: urlData?.publicUrl || '',
          thumbnail_url: thumbnailUrl || null,
          created_at: new Date().toISOString(),
          repair_id: repairId || null,
          message_id: messageId || null,
          user_id: userId,
        })
        .select()
        .single();

      if (metadataError) {
        // Si l'enregistrement des métadonnées échoue, supprimer le fichier
        await this.deleteFile(filePath);
        throw metadataError;
      }

      return {
        id: metadataData.id,
        name: metadataData.name,
        size: metadataData.size,
        type: metadataData.type,
        url: metadataData.url,
        thumbnailUrl: metadataData.thumbnail_url,
        createdAt: metadataData.created_at,
        repairId: metadataData.repair_id,
        messageId: metadataData.message_id,
        userId: metadataData.user_id,
      };
    } catch (error) {
      console.error('Erreur lors du téléchargement du fichier:', error);
      return null;
    }
  },

  /**
   * Supprime un fichier du stockage Supabase
   * @param path Chemin du fichier à supprimer
   * @returns true si la suppression a réussi
   */
  async deleteFile(path: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage.from('repair-files').remove([path]);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
      return false;
    }
  },

  /**
   * Supprime un fichier par son ID
   * @param fileId ID du fichier à supprimer
   * @returns true si la suppression a réussi
   */
  async deleteFileById(fileId: string): Promise<boolean> {
    try {
      // Récupérer les métadonnées du fichier
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (fileError || !fileData) {
        throw new Error('Fichier non trouvé');
      }

      // Extraire le chemin du fichier à partir de l'URL
      const url = new URL(fileData.url);
      const path = url.pathname.split('/').slice(2).join('/');

      // Supprimer le fichier du stockage
      const { error: deleteError } = await supabase.storage.from('repair-files').remove([path]);
      if (deleteError) throw deleteError;

      // Supprimer les métadonnées du fichier
      const { error: metadataError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (metadataError) throw metadataError;

      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
      return false;
    }
  },

  /**
   * Récupère les fichiers associés à une réparation
   * @param repairId ID de la réparation
   * @returns Liste des métadonnées des fichiers
   */
  async getRepairFiles(repairId: string): Promise<FileMetadata[]> {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('repair_id', repairId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
        type: file.type,
        url: file.url,
        thumbnailUrl: file.thumbnail_url,
        createdAt: file.created_at,
        repairId: file.repair_id,
        messageId: file.message_id,
        userId: file.user_id,
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des fichiers:', error);
      return [];
    }
  },

  /**
   * Récupère les fichiers associés à un message
   * @param messageId ID du message
   * @returns Liste des métadonnées des fichiers
   */
  async getMessageFiles(messageId: string): Promise<FileMetadata[]> {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('message_id', messageId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
        type: file.type,
        url: file.url,
        thumbnailUrl: file.thumbnail_url,
        createdAt: file.created_at,
        repairId: file.repair_id,
        messageId: file.message_id,
        userId: file.user_id,
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des fichiers:', error);
      return [];
    }
  },

  /**
   * Vérifie si le type de fichier est valide
   * @param file Fichier à vérifier
   * @param type Type de fichier attendu
   * @returns true si le type de fichier est valide
   */
  isValidFileType(file: File, type: FileType): boolean {
    if (type === 'image') {
      return file.type.startsWith('image/');
    } else if (type === 'document') {
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
      ];
      return validTypes.includes(file.type);
    }
    return false;
  },
};
