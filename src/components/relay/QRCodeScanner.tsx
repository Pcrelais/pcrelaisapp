import React, { useState, useRef, useEffect } from 'react';
import { QrScanner } from '@yudiel/react-qr-scanner';
import { AlertCircle, Check, X, Camera, KeyboardIcon } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import { qrCodeService } from '../../services/qrCodeService';
import { repairService } from '../../services/repairService';
import { notificationService } from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';

interface QRCodeScannerProps {
  relayPointId: string;
  onSuccess: (repairId: string) => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ relayPointId, onSuccess }) => {
  const [scanning, setScanning] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [repairCode, setRepairCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Vérifier les permissions de la caméra
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(() => setCameraPermission(true))
        .catch(() => setCameraPermission(false));
    } else {
      setCameraPermission(false);
    }
  }, []);
  
  useEffect(() => {
    if (manualEntry && inputRef.current) {
      inputRef.current.focus();
    }
  }, [manualEntry]);
  
  const handleQRCodeScan = async (data: string) => {
    if (status === 'loading') return;
    
    try {
      setStatus('loading');
      setMessage('Vérification du QR code...');
      
      // Valider le QR code
      const result = await qrCodeService.validateQRCode(data, relayPointId);
      
      if (result.valid && result.repairId) {
        // Mettre à jour le statut de la demande de réparation
        await processValidRepair(result.repairId, data);
      } else {
        setStatus('error');
        setMessage(result.message || 'QR code invalide.');
        setTimeout(() => {
          setStatus('idle');
          setMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error('Erreur lors de la validation du QR code:', error);
      setStatus('error');
      setMessage('Une erreur est survenue lors de la validation du QR code.');
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 3000);
    }
  };
  
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repairCode.trim() || status === 'loading') return;
    
    try {
      setStatus('loading');
      setMessage('Vérification du code...');
      
      // Valider le code de réparation
      const result = await qrCodeService.validateRepairCode(repairCode.trim(), relayPointId);
      
      if (result.valid && result.repairId) {
        // Mettre à jour le statut de la demande de réparation
        await processValidRepair(result.repairId, repairCode.trim());
      } else {
        setStatus('error');
        setMessage(result.message || 'Code invalide.');
        setTimeout(() => {
          setStatus('idle');
          setMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error('Erreur lors de la validation du code:', error);
      setStatus('error');
      setMessage('Une erreur est survenue lors de la validation du code.');
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 3000);
    }
  };
  
  const processValidRepair = async (repairId: string, code: string) => {
    try {
      // Récupérer les détails de la réparation
      const repair = await repairService.getRepairById(repairId);
      
      if (!repair) {
        throw new Error('Demande de réparation introuvable.');
      }
      
      // Mettre à jour le statut de la réparation (DEPOSITED)
      await repairService.updateRepair(repairId, {
        statusId: 2, // ID du statut "DEPOSITED"
        notes: `Déposé au point relais le ${new Date().toLocaleDateString('fr-FR')}`
      });
      
      // Marquer le code comme utilisé
      await qrCodeService.markCodeAsUsed(repairId, code);
      
      // Envoyer une notification au client
      if (repair.clientId) {
        await notificationService.createNotification({
          userId: repair.clientId,
          title: 'Appareil déposé',
          message: `Votre appareil a bien été déposé au point relais. Il sera bientôt pris en charge par nos techniciens.`,
          type: 'info',
          isRead: false,
          link: `/repairs/${repairId}`
        });
      }
      
      // Envoyer une notification aux techniciens et admins
      const adminUsers = ['admin_id_1', 'admin_id_2']; // À remplacer par les IDs réels
      for (const adminId of adminUsers) {
        await notificationService.createNotification({
          userId: adminId,
          title: 'Nouvel appareil déposé',
          message: `Un nouvel appareil a été déposé au point relais ${relayPointId}. Référence: ${repairId.substring(0, 8)}`,
          type: 'info',
          isRead: false,
          link: `/admin/repairs/${repairId}`
        });
      }
      
      // Afficher le message de succès
      setStatus('success');
      setMessage('Dépôt validé avec succès !');
      
      // Appeler le callback de succès
      onSuccess(repairId);
      
      // Réinitialiser après 3 secondes
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
        setScanning(false);
        setManualEntry(false);
        setRepairCode('');
      }, 3000);
    } catch (error) {
      console.error('Erreur lors du traitement de la réparation:', error);
      setStatus('error');
      setMessage('Une erreur est survenue lors du traitement de la demande.');
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 3000);
    }
  };
  
  const renderStatusMessage = () => {
    if (status === 'idle') return null;
    
    const statusClasses = {
      loading: 'bg-blue-50 border-blue-200 text-blue-700',
      success: 'bg-green-50 border-green-200 text-green-700',
      error: 'bg-red-50 border-red-200 text-red-700'
    };
    
    const statusIcons = {
      loading: <div className="animate-spin h-5 w-5 border-2 border-current rounded-full border-t-transparent" />,
      success: <Check className="h-5 w-5" />,
      error: <AlertCircle className="h-5 w-5" />
    };
    
    return (
      <div className={`flex items-center p-3 rounded-lg border ${statusClasses[status]}`}>
        <div className="flex-shrink-0 mr-2">
          {statusIcons[status]}
        </div>
        <p>{message}</p>
      </div>
    );
  };
  
  if (!scanning && !manualEntry) {
    return (
      <Card>
        <Card.Header>
          <Card.Title>Scanner un dépôt</Card.Title>
          <Card.Description>
            Scannez le QR code ou saisissez le code de réparation fourni par le client
          </Card.Description>
        </Card.Header>
        <Card.Content className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              size="lg"
              className="flex flex-col items-center justify-center py-6"
              onClick={() => setScanning(true)}
              disabled={cameraPermission === false}
            >
              <Camera className="h-8 w-8 mb-2" />
              <span className="font-medium">Scanner un QR code</span>
              {cameraPermission === false && (
                <span className="text-xs text-red-500 mt-2">Accès à la caméra non autorisé</span>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="flex flex-col items-center justify-center py-6"
              onClick={() => setManualEntry(true)}
            >
              <KeyboardIcon className="h-8 w-8 mb-2" />
              <span className="font-medium">Saisir le code manuellement</span>
            </Button>
          </div>
        </Card.Content>
      </Card>
    );
  }
  
  if (scanning) {
    return (
      <Card>
        <Card.Header className="flex flex-row items-center justify-between">
          <div>
            <Card.Title>Scanner le QR code</Card.Title>
            <Card.Description>
              Placez le QR code du client dans le cadre
            </Card.Description>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setScanning(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </Card.Header>
        <Card.Content className="space-y-4">
          <div className="relative overflow-hidden rounded-lg" style={{ height: '300px' }}>
            <QrScanner
              onDecode={handleQRCodeScan}
              onError={(error) => console.error(error)}
              scanDelay={500}
              constraints={{
                facingMode: 'environment'
              }}
            />
          </div>
          
          {renderStatusMessage()}
          
          <div className="text-center">
            <Button
              variant="link"
              onClick={() => {
                setScanning(false);
                setManualEntry(true);
              }}
            >
              Saisir le code manuellement
            </Button>
          </div>
        </Card.Content>
      </Card>
    );
  }
  
  if (manualEntry) {
    return (
      <Card>
        <Card.Header className="flex flex-row items-center justify-between">
          <div>
            <Card.Title>Saisir le code de réparation</Card.Title>
            <Card.Description>
              Entrez le code à 6 caractères fourni par le client
            </Card.Description>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setManualEntry(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </Card.Header>
        <Card.Content className="space-y-4">
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Ex: ABC123"
              value={repairCode}
              onChange={(e) => setRepairCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="text-center text-xl tracking-wider uppercase"
              autoComplete="off"
              disabled={status === 'loading'}
            />
            
            {renderStatusMessage()}
            
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setManualEntry(false);
                  setScanning(cameraPermission !== false);
                }}
                disabled={status === 'loading'}
              >
                Scanner le QR code
              </Button>
              
              <Button
                type="submit"
                variant="primary"
                disabled={!repairCode.trim() || status === 'loading'}
              >
                Valider
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card>
    );
  }
  
  return null;
};

export default QRCodeScanner;
