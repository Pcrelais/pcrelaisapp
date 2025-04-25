import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import QRScanner from '../../components/QRScanner';
import Button from '../../components/ui/Button';
import { AlertCircle, CheckCircle, QrCode } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { qrCodeService } from '../../services/qrCodeService';
import { repairService } from '../../services/repairService';
import Input from '../../components/ui/Input';

const ScanQRCodePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ repairId: string, message: string } | null>(null);
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera');

  // Vérifier que l'utilisateur est un point relais
  if (!user || user.role !== 'relayPoint') {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <Card>
            <Card.Content>
              <div className="p-4 text-center">
                <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès non autorisé</h2>
                <p className="text-gray-600 mb-4">
                  Vous devez être connecté en tant que point relais pour accéder à cette page.
                </p>
                <Button variant="primary" onClick={() => navigate('/login')}>
                  Se connecter
                </Button>
              </div>
            </Card.Content>
          </Card>
        </div>
      </Layout>
    );
  }

  const handleScanSuccess = async (decodedText: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Valider le QR code
      const result = await qrCodeService.validateQRCode(decodedText, user.id);
      
      if (result.valid && result.repairId) {
        // Marquer le code comme utilisé
        // Récupérer le code depuis le QR code déchiffré
        const decryptedData = JSON.parse(decodedText);
        const repairCode = decryptedData?.code || '';
        await qrCodeService.markCodeAsUsed(result.repairId, repairCode);
        
        // Mettre à jour le statut de la réparation
        await repairService.updateRepairStatus(result.repairId, 'received');
        
        setSuccess({
          repairId: result.repairId,
          message: 'Appareil reçu avec succès! La demande de réparation a été mise à jour.'
        });
      } else {
        setError(result.message || 'QR code invalide');
      }
    } catch (error) {
      console.error('Erreur lors de la validation du QR code:', error);
      setError('Une erreur est survenue lors de la validation du QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleManualCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Valider le code saisi manuellement
      const result = await qrCodeService.validateRepairCode(manualCode.trim(), user.id);
      
      if (result.valid && result.repairId) {
        // Marquer le code comme utilisé
        await qrCodeService.markCodeAsUsed(result.repairId, manualCode.trim());
        
        // Mettre à jour le statut de la réparation
        await repairService.updateRepairStatus(result.repairId, 'received');
        
        setSuccess({
          repairId: result.repairId,
          message: 'Appareil reçu avec succès! La demande de réparation a été mise à jour.'
        });
      } else {
        setError(result.message || 'Code invalide');
      }
    } catch (error) {
      console.error('Erreur lors de la validation du code:', error);
      setError('Une erreur est survenue lors de la validation du code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <Card>
          <Card.Header>
            <h1 className="text-2xl font-bold text-gray-900">Scanner un QR code</h1>
            <p className="text-gray-600">
              Scannez le QR code du client ou saisissez le code manuellement pour enregistrer le dépôt d'un appareil.
            </p>
          </Card.Header>
          
          <Card.Content>
            <div className="mb-6">
              <div className="flex justify-center space-x-4 mb-6">
                <Button
                  variant={scanMode === 'camera' ? 'primary' : 'outline'}
                  onClick={() => setScanMode('camera')}
                  icon={<QrCode className="h-5 w-5 mr-2" />}
                >
                  Scanner
                </Button>
                <Button
                  variant={scanMode === 'manual' ? 'primary' : 'outline'}
                  onClick={() => setScanMode('manual')}
                  icon={<QrCode className="h-5 w-5 mr-2" />}
                >
                  Code manuel
                </Button>
              </div>
              
              {scanMode === 'camera' ? (
                <QRScanner 
                  onScanSuccess={handleScanSuccess}
                  onScanError={(errorMsg) => setError(errorMsg)}
                />
              ) : (
                <form onSubmit={handleManualCodeSubmit} className="space-y-4">
                  <Input
                    label="Code de réparation"
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Saisissez le code à 6 caractères"
                    required
                    fullWidth
                  />
                  <div className="flex justify-center">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={loading || !manualCode.trim()}
                    >
                      {loading ? 'Vérification...' : 'Valider le code'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
            
            {error && (
              <div className="p-4 mb-4 bg-error/10 border border-error/20 rounded-lg flex items-start">
                <AlertCircle className="h-5 w-5 text-error mr-2 mt-0.5" />
                <div className="text-error">{error}</div>
              </div>
            )}
            
            {success && (
              <div className="p-4 mb-4 bg-success/10 border border-success/20 rounded-lg flex items-start">
                <CheckCircle className="h-5 w-5 text-success mr-2 mt-0.5" />
                <div>
                  <p className="text-success font-medium">{success.message}</p>
                  <p className="text-gray-600 text-sm mt-1">
                    ID de réparation: {success.repairId}
                  </p>
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/relay/repairs/${success.repairId}`)}
                    >
                      Voir les détails
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card.Content>
        </Card>
      </div>
    </Layout>
  );
};

export default ScanQRCodePage;
