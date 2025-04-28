import { supabase } from '../lib/supabaseConfig';
import * as CryptoJS from 'crypto-js';

interface QRCodeData {
  repairId: string;
  relayPointId: string;
  clientId: string;
  timestamp: number;
  code: string;
}

export const qrCodeService = {
  // Générer un code de réparation unique (6 caractères alphanumériques)
  generateRepairCode(): string {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Caractères sans ambiguïté (pas de 0, O, 1, I)
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  },

  // Générer les données pour le QR code
  generateQRCodeData(repairId: string, relayPointId: string, clientId: string): { qrData: string, repairCode: string } {
    const repairCode = this.generateRepairCode();
    
    // Créer l'objet de données
    const data: QRCodeData = {
      repairId,
      relayPointId,
      clientId,
      timestamp: Date.now(),
      code: repairCode
    };
    
    // Chiffrer les données avec une clé secrète
    const secretKey = import.meta.env.VITE_QR_SECRET_KEY || 'PCRelais-SecretKey-2025';
    const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
    
    // Sauvegarder le code dans la base de données
    this.saveRepairCode(repairId, repairCode, relayPointId);
    
    return {
      qrData: encryptedData,
      repairCode
    };
  },
  
  // Sauvegarder le code de réparation dans la base de données
  async saveRepairCode(repairId: string, repairCode: string, relayPointId: string): Promise<void> {
    const { error } = await supabase
      .from('repair_codes')
      .insert({
        repair_id: repairId,
        code: repairCode,
        relay_point_id: relayPointId,
        created_at: new Date().toISOString(),
        is_used: false
      });
    
    if (error) {
      console.error('Erreur lors de la sauvegarde du code de réparation:', error);
      throw error;
    }
  },
  
  // Valider un QR code scanné
  async validateQRCode(encryptedData: string, relayPointId: string): Promise<{ valid: boolean, repairId?: string, clientId?: string, repairCode?: string, message?: string }> {
    try {
      // Déchiffrer les données
      const secretKey = import.meta.env.VITE_QR_SECRET_KEY || 'PCRelais-SecretKey-2025';
      const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
      const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8)) as QRCodeData;
      
      // Vérifier que le point relais correspond
      if (decryptedData.relayPointId !== relayPointId) {
        return { 
          valid: false, 
          message: "Ce QR code n'est pas destiné à ce point relais." 
        };
      }
      
      // Vérifier que le code n'a pas expiré (24 heures)
      const expirationTime = 24 * 60 * 60 * 1000; // 24 heures en millisecondes
      if (Date.now() - decryptedData.timestamp > expirationTime) {
        return { 
          valid: false, 
          message: "Ce QR code a expiré." 
        };
      }
      
      // Vérifier que le code n'a pas déjà été utilisé
      const { data, error } = await supabase
        .from('repair_codes')
        .select('is_used')
        .eq('repair_id', decryptedData.repairId)
        .eq('code', decryptedData.code)
        .single();
      
      if (error || !data) {
        return { 
          valid: false, 
          message: "Code de réparation invalide ou inexistant." 
        };
      }
      
      if (data.is_used) {
        return { 
          valid: false, 
          message: "Ce code a déjà été utilisé." 
        };
      }
      
      return { 
        valid: true, 
        repairId: decryptedData.repairId,
        clientId: decryptedData.clientId,
        repairCode: decryptedData.code
      };
    } catch (error) {
      console.error('Erreur lors de la validation du QR code:', error);
      return { 
        valid: false, 
        message: "QR code invalide ou corrompu." 
      };
    }
  },
  
  // Valider un code de réparation saisi manuellement
  async validateRepairCode(repairCode: string, relayPointId: string): Promise<{ valid: boolean, repairId?: string, message?: string }> {
    try {
      // Vérifier que le code existe et correspond au point relais
      const { data, error } = await supabase
        .from('repair_codes')
        .select('repair_id, is_used, created_at')
        .eq('code', repairCode)
        .eq('relay_point_id', relayPointId)
        .single();
      
      if (error || !data) {
        return { 
          valid: false, 
          message: "Code de réparation invalide ou inexistant pour ce point relais." 
        };
      }
      
      if (data.is_used) {
        return { 
          valid: false, 
          message: "Ce code a déjà été utilisé." 
        };
      }
      
      // Vérifier que le code n'a pas expiré (24 heures)
      const createdAt = new Date(data.created_at).getTime();
      const expirationTime = 24 * 60 * 60 * 1000; // 24 heures en millisecondes
      if (Date.now() - createdAt > expirationTime) {
        return { 
          valid: false, 
          message: "Ce code a expiré." 
        };
      }
      
      return { 
        valid: true, 
        repairId: data.repair_id 
      };
    } catch (error) {
      console.error('Erreur lors de la validation du code de réparation:', error);
      return { 
        valid: false, 
        message: "Une erreur est survenue lors de la validation du code." 
      };
    }
  },
  
  // Marquer un code comme utilisé
  async markCodeAsUsed(repairId: string, repairCode: string): Promise<void> {
    try {
      // Vérifier si la colonne used_at existe
      const { error } = await supabase
        .from('repair_codes')
        .update({ is_used: true }) // Supprimer used_at car la colonne n'existe pas
        .eq('repair_id', repairId)
        .eq('code', repairCode);
      
      if (error) {
        console.error('Erreur lors du marquage du code comme utilisé:', error);
        throw error;
      }
      
      console.log('Code de réparation marqué comme utilisé avec succès');
    } catch (error) {
      console.error('Erreur lors du marquage du code comme utilisé:', error);
      throw error;
    }
  }
};
