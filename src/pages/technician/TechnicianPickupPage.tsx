import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import QRScanner from '../../components/QRScanner';
import { AlertCircle, CheckCircle, QrCode, Truck, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { technicianService } from '../../services/technicianService';

const TechnicianPickupPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [scanMode, setScanMode] = useState<'camera' | 'list'>('list');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ message: string } | null>(null);
  const [pendingDevices, setPendingDevices] = useState<any[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [relayPoints, setRelayPoints] = useState<Map<string, { name: string, address: string, devices: any[] }>>(new Map());

  // Vérifier que l'utilisateur est un technicien
  if (!user || user.role !== 'technician') {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <Card>
            <Card.Content>
              <div className="p-4 text-center">
                <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès non autorisé</h2>
                <p className="text-gray-600 mb-4">
                  Vous devez être connecté en tant que technicien pour accéder à cette page.
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

  // Charger les appareils en attente de récupération
  useEffect(() => {
    const loadPendingDevices = async () => {
      try {
        setLoading(true);
        const devices = await technicianService.getDevicesReadyForPickup(user.id);
        setPendingDevices(devices);

        // Regrouper les appareils par point relais
        const relayMap = new Map<string, { name: string, address: string, devices: any[] }>();
        
        devices.forEach(device => {
          const relayId = device.dropOffRelayId || '';
          if (!relayMap.has(relayId)) {
            relayMap.set(relayId, {
              name: device.relayName || 'Point relais inconnu',
              address: device.relayAddress || 'Adresse inconnue',
              devices: []
            });
          }
          relayMap.get(relayId)?.devices.push(device);
        });
        
        setRelayPoints(relayMap);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des appareils:', error);
        setError('Impossible de charger les appareils en attente de récupération.');
        setLoading(false);
      }
    };

    loadPendingDevices();
  }, [user.id]);

  // Gérer le scan d'un QR code
  const handleScanSuccess = async (decodedText: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Décoder le QR code pour obtenir l'ID du point relais
      let relayPointId = '';
      try {
        const decodedData = JSON.parse(decodedText);
        relayPointId = decodedData.relayPointId || '';
      } catch (err) {
        setError('QR code invalide. Format incorrect.');
        setLoading(false);
        return;
      }

      if (!relayPointId) {
        setError('QR code invalide. ID du point relais manquant.');
        setLoading(false);
        return;
      }

      // Récupérer les appareils de ce point relais
      const devicesToPickup = pendingDevices.filter(device => device.dropOffRelayId === relayPointId);
      
      if (devicesToPickup.length === 0) {
        setError('Aucun appareil à récupérer dans ce point relais.');
        setLoading(false);
        return;
      }

      // Récupérer les appareils
      const deviceIds = devicesToPickup.map(device => device.id);
      const success = await technicianService.pickupDevicesFromRelay(deviceIds, user.id);
      
      if (success) {
        setSuccess({
          message: `${deviceIds.length} appareil(s) récupéré(s) avec succès du point relais.`
        });
        
        // Mettre à jour la liste des appareils
        setPendingDevices(prevDevices => 
          prevDevices.filter(device => !deviceIds.includes(device.id))
        );
        
        // Mettre à jour la map des points relais
        const updatedRelayMap = new Map(relayPoints);
        updatedRelayMap.delete(relayPointId);
        setRelayPoints(updatedRelayMap);
      } else {
        setError('Erreur lors de la récupération des appareils. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Erreur lors du scan du QR code:', error);
      setError('Une erreur est survenue lors du scan du QR code.');
    } finally {
      setLoading(false);
    }
  };

  // Gérer la sélection d'appareils dans la liste
  const handleDeviceSelection = (deviceId: string) => {
    setSelectedDevices(prevSelected => {
      if (prevSelected.includes(deviceId)) {
        return prevSelected.filter(id => id !== deviceId);
      } else {
        return [...prevSelected, deviceId];
      }
    });
  };

  // Gérer la sélection de tous les appareils d'un point relais
  const handleSelectAllFromRelay = (relayId: string) => {
    const relayDevices = relayPoints.get(relayId)?.devices || [];
    const relayDeviceIds = relayDevices.map(device => device.id);
    
    setSelectedDevices(prevSelected => {
      // Vérifier si tous les appareils du point relais sont déjà sélectionnés
      const allSelected = relayDeviceIds.every(id => prevSelected.includes(id));
      
      if (allSelected) {
        // Désélectionner tous les appareils du point relais
        return prevSelected.filter(id => !relayDeviceIds.includes(id));
      } else {
        // Sélectionner tous les appareils du point relais
        const newSelection = [...prevSelected];
        relayDeviceIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      }
    });
  };

  // Récupérer les appareils sélectionnés
  const handlePickupSelectedDevices = async () => {
    if (selectedDevices.length === 0) {
      setError('Veuillez sélectionner au moins un appareil à récupérer.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const success = await technicianService.pickupDevicesFromRelay(selectedDevices, user.id);
      
      if (success) {
        setSuccess({
          message: `${selectedDevices.length} appareil(s) récupéré(s) avec succès.`
        });
        
        // Mettre à jour la liste des appareils
        setPendingDevices(prevDevices => 
          prevDevices.filter(device => !selectedDevices.includes(device.id))
        );
        
        // Mettre à jour la map des points relais
        const updatedRelayMap = new Map<string, { name: string, address: string, devices: any[] }>();
        
        for (const [relayId, relayData] of relayPoints.entries()) {
          const remainingDevices = relayData.devices.filter(device => !selectedDevices.includes(device.id));
          
          if (remainingDevices.length > 0) {
            updatedRelayMap.set(relayId, {
              ...relayData,
              devices: remainingDevices
            });
          }
        }
        
        setRelayPoints(updatedRelayMap);
        setSelectedDevices([]);
      } else {
        setError('Erreur lors de la récupération des appareils. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des appareils:', error);
      setError('Une erreur est survenue lors de la récupération des appareils.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <Card>
          <Card.Header>
            <h1 className="text-2xl font-bold text-gray-900">Récupération des appareils</h1>
            <p className="text-gray-600">
              Récupérez les appareils déposés dans les points relais en scannant leur QR code ou en les sélectionnant dans la liste.
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
                  Scanner QR code
                </Button>
                <Button
                  variant={scanMode === 'list' ? 'primary' : 'outline'}
                  onClick={() => setScanMode('list')}
                  icon={<Package className="h-5 w-5 mr-2" />}
                >
                  Liste des appareils
                </Button>
              </div>
              
              {scanMode === 'camera' ? (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg mb-4">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-blue-800">
                          Scannez le QR code du point relais pour récupérer tous les appareils qui y sont déposés.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <QRScanner 
                    onScanSuccess={handleScanSuccess}
                    onScanError={(errorMsg) => setError(errorMsg)}
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  {relayPoints.size === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun appareil à récupérer</h3>
                      <p className="text-gray-500">Tous les appareils ont été récupérés ou aucun n'est prêt pour la récupération.</p>
                    </div>
                  ) : (
                    <>
                      {selectedDevices.length > 0 && (
                        <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
                          <span className="text-blue-800 font-medium">{selectedDevices.length} appareil(s) sélectionné(s)</span>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handlePickupSelectedDevices}
                            disabled={loading}
                            icon={<Truck className="h-4 w-4 mr-1" />}
                          >
                            Récupérer la sélection
                          </Button>
                        </div>
                      )}
                      
                      {Array.from(relayPoints.entries()).map(([relayId, relayData]) => (
                        <div key={relayId} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 p-4 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="font-semibold text-gray-900">{relayData.name}</h3>
                                <p className="text-sm text-gray-500">{relayData.address}</p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSelectAllFromRelay(relayId)}
                              >
                                {relayData.devices.every(device => selectedDevices.includes(device.id))
                                  ? 'Tout désélectionner'
                                  : 'Tout sélectionner'}
                              </Button>
                            </div>
                          </div>
                          
                          <div className="divide-y divide-gray-100">
                            {relayData.devices.map(device => (
                              <div 
                                key={device.id} 
                                className={`p-4 flex items-center hover:bg-gray-50 cursor-pointer ${
                                  selectedDevices.includes(device.id) ? 'bg-blue-50' : ''
                                }`}
                                onClick={() => handleDeviceSelection(device.id)}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedDevices.includes(device.id)}
                                  onChange={() => {}} // Géré par le onClick du parent
                                  className="h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary mr-3"
                                />
                                <div className="flex-1">
                                  <div className="flex justify-between">
                                    <span className="font-medium text-gray-900">
                                      {device.brand} {device.model}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      {new Date(device.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-500">
                                    {device.deviceType} - {device.clientName}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
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
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/technician/dashboard')}
                    >
                      Retour au tableau de bord
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

export default TechnicianPickupPage;
