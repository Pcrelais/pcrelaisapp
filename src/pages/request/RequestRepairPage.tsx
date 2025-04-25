import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, HelpCircle, MessageSquare, Info } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
import GooglePlacesAutocomplete from '../../components/ui/GooglePlacesAutocomplete';
import { useAuth } from '../../context/AuthContext';
import { repairService } from '../../services/repairService';
import { relayPointService } from '../../services/relayPointService';
import { qrCodeService } from '../../services/qrCodeService';
import { notificationService } from '../../services/notificationService';
// Nous définissons notre propre interface RelayPointWithDistance, donc nous n'avons plus besoin d'importer RelayPoint
import RepairQRCode from '../../components/repair/RepairQRCode';

const deviceTypes = [
  { value: 'laptop', label: 'Ordinateur portable' },
  { value: 'desktop', label: 'Ordinateur de bureau' },
  { value: 'smartphone', label: 'Smartphone' },
  { value: 'tablet', label: 'Tablette' },
  { value: 'printer', label: 'Imprimante' },
  { value: 'other', label: 'Autre' },
];

const commonBrands = [
  { value: 'apple', label: 'Apple' },
  { value: 'samsung', label: 'Samsung' },
  { value: 'dell', label: 'Dell' },
  { value: 'hp', label: 'HP' },
  { value: 'lenovo', label: 'Lenovo' },
  { value: 'asus', label: 'Asus' },
  { value: 'acer', label: 'Acer' },
  { value: 'microsoft', label: 'Microsoft' },
  { value: 'sony', label: 'Sony' },
  { value: 'other', label: 'Autre' },
];

// Interface pour les points relais avec distance
interface RelayPointWithDistance {
  id: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  role: 'relayPoint';
  createdAt: string;
  businessName: string;
  address: string;
  openingHours: any;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  commission: number;
  distance: number; // Propriété spécifique à RelayPointWithDistance
}

const RequestRepairPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [deviceType, setDeviceType] = useState('laptop'); // Valeur par défaut: Ordinateur portable
  const [brand, setBrand] = useState('dell'); // Valeur par défaut: Dell
  const [submittedStatusId, setSubmittedStatusId] = useState<string | null>(null);
  const [model, setModel] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [address, setAddress] = useState('');
  // Définir un type pour les coordonnées avec toutes les propriétés nécessaires
  // Ce type doit correspondre à celui utilisé dans GooglePlacesAutocomplete
  type Coordinates = {
    lat: number, 
    lng: number, 
    address?: string,
    streetAddress?: string,
    city?: string,
    postalCode?: string
  };
  
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [aiDiagnosis, setAiDiagnosis] = useState('');
  const [selectedRelayPoint, setSelectedRelayPoint] = useState('');
  // Définir le type avec les propriétés explicites pour éviter les erreurs TypeScript
  const [selectedRelayPointDetails, setSelectedRelayPointDetails] = useState<{
    id: string;
    businessName: string;
    address: string;
    openingHours: any;
    coordinates: { latitude: number; longitude: number };
    email: string;
    phoneNumber: string;
    firstName: string;
    lastName: string;
    role: 'relayPoint';
    createdAt: string;
    commission: number;
  } | null>(null);
  const [preferredDate, setPreferredDate] = useState('');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [relayPoints, setRelayPoints] = useState<RelayPointWithDistance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // États pour le QR code
  const [qrData, setQrData] = useState('');
  const [repairCode, setRepairCode] = useState('');
  const [repairId, setRepairId] = useState('');
  
  const handleNext = async () => {
    // Log pour débogage
    console.log('handleNext appelé avec les valeurs suivantes:', {
      deviceType,
      brand,
      model,
      problemDescription,
      step
    });
    
    if (step === 1) {
      // Analyse IA
      setIsAnalyzing(true);
      try {
        // Dans une version réelle, vous pourriez appeler une API d'IA pour l'analyse
        // Pour l'instant, nous utilisons une logique simple basée sur des mots-clés
        let diagnosis = '';
        if (problemDescription.toLowerCase().includes('ne s\'allume')) {
          diagnosis = "Selon votre description, il pourrait s'agir d'un problème d'alimentation ou de batterie. Notre technicien vérifiera l'adaptateur secteur, la prise DC et la batterie. Une réparation simple pourrait coûter entre 60€ et 120€ selon les pièces à remplacer.";
        } else if (problemDescription.toLowerCase().includes('écran')) {
          diagnosis = "Votre appareil semble avoir un problème d'affichage. Cela pourrait être dû à un écran endommagé ou à un problème de connexion avec la carte mère. Le coût estimé de réparation se situe entre 80€ et 200€ selon le modèle.";
        } else if (problemDescription.toLowerCase().includes('surchauffe')) {
          diagnosis = "La surchauffe est souvent causée par une accumulation de poussière dans les ventilateurs ou un problème de pâte thermique. Un nettoyage complet et le remplacement de la pâte thermique coûteraient environ 60€ à 90€.";
        } else {
          diagnosis = "Nous aurons besoin d'examiner votre appareil pour établir un diagnostic précis. Notre technicien effectuera une analyse complète pour identifier la source du problème et vous proposera une solution adaptée.";
        }
        
        // Simuler un délai pour l'analyse IA
        setTimeout(() => {
          setAiDiagnosis(diagnosis);
          setIsAnalyzing(false);
          setStep(2);
        }, 1500);
      } catch (error) {
        console.error('Erreur lors de l\'analyse IA:', error);
        setIsAnalyzing(false);
        setError('Une erreur est survenue lors de l\'analyse. Veuillez réessayer.');
      }
    } else if (step === 2) {
      // Recherche de points relais
      setStep(3);
    } else if (step === 3) {
      // Soumission de la demande
      if (!selectedRelayPoint || !preferredDate) {
        setError('Veuillez sélectionner un point relais et une date de dépôt.');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        if (!user) {
          throw new Error('Vous devez être connecté pour soumettre une demande de réparation.');
        }
        
        // Créer la demande de réparation
        const newRepair = {
          clientId: user.id,
          deviceType,
          brand,
          model,
          problemDescription,
          statusId: submittedStatusId || '1', // Utiliser '1' comme valeur par défaut si null
          preDiagnosis: aiDiagnosis,
          dropOffRelayId: selectedRelayPoint,
          appointmentDate: preferredDate,
        };
        
        // Créer la demande de réparation et récupérer l'ID
        const createdRepair = await repairService.createRepair(newRepair);
        setRepairId(createdRepair.id);
        
        // Générer le QR code et le code de réparation
        const { qrData: generatedQRData, repairCode: generatedRepairCode } = 
          qrCodeService.generateQRCodeData(createdRepair.id, selectedRelayPoint, user.id);
        
        setQrData(generatedQRData);
        setRepairCode(generatedRepairCode);
        
        // Envoyer une notification au client
        await notificationService.createNotification({
          userId: user.id,
          title: 'Demande de réparation créée',
          message: `Votre demande de réparation a été enregistrée avec succès. Code de réparation: ${generatedRepairCode}`,
          type: 'success',
          isRead: false,
          link: `/repairs/${createdRepair.id}`
        });
        
        // Temporairement désactivé : notification au point relais
        // La notification au point relais sera implémentée ultérieurement
        console.log('Notification au point relais désactivée temporairement');
        
        // Passer à l'étape d'affichage du QR code
        setLoading(false);
        setStep(4);
      } catch (error) {
        console.error('Erreur lors de la soumission de la demande:', error);
        setError('Une erreur est survenue lors de la soumission de votre demande. Veuillez réessayer.');
        setLoading(false);
      }
    } else if (step === 4) {
      // Rediriger vers le tableau de bord
      navigate('/dashboard', { 
        state: { 
          success: true, 
          message: 'Votre demande de réparation a été soumise avec succès.' 
        } 
      });
    }
  };
  
  const handlePrevious = () => {
    setStep(step - 1);
  };
  

  
  // Effet pour charger les points relais à proximité lorsque l'adresse change
  useEffect(() => {
    if (address && step === 2) {
      handleFindRelayPoints();
    }
  }, [address, step]);

  // Effet pour charger les statuts de réparation au chargement de la page
  useEffect(() => {
    const loadStatuses = async () => {
      try {
        console.log('Début de la récupération des statuts...');
        const statuses = await repairService.getRepairStatuses();
        console.log('Statuts récupérés:', statuses);
        
        if (!statuses || statuses.length === 0) {
          console.warn('Aucun statut n\'a été trouvé dans la base de données. Création d\'un statut par défaut...');
          
          // Créer un statut par défaut si aucun n'existe
          try {
            // Utiliser null comme statusId pour que Supabase génère un UUID automatiquement
            setSubmittedStatusId(null);
            return;
          } catch (createError) {
            console.error('Erreur lors de la création du statut par défaut:', createError);
          }
        }
        
        const submittedStatus = statuses.find(status => 
          status.name?.toLowerCase() === 'submitted' || 
          status.name?.toLowerCase() === 'soumise' ||
          status.name?.toLowerCase() === 'nouvelle');
        
        if (submittedStatus) {
          setSubmittedStatusId(submittedStatus.id);
          console.log('Statut initial trouvé:', submittedStatus);
        } else {
          console.error('Aucun statut initial trouvé parmi les statuts disponibles');
          // Utiliser le premier statut disponible comme fallback
          if (statuses.length > 0) {
            setSubmittedStatusId(statuses[0].id);
            console.log('Utilisation du premier statut disponible comme fallback:', statuses[0]);
          } else {
            // Dernier recours : mettre statusId à null pour que Supabase génère un UUID
            setSubmittedStatusId(null);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des statuts:', error);
        // En cas d'erreur, mettre statusId à null
        setSubmittedStatusId(null);
      }
    };
    
    loadStatuses();
  }, []);

  const handleFindRelayPoints = async () => {
    if (!address.trim()) {
      setError('Veuillez entrer une adresse pour rechercher les points relais.');
      return;
    }
    
    // Afficher les coordonnées actuelles pour le débogage
    console.log('Coordonnées actuelles avant vérification:', coordinates);
    
    // Vérifier si nous avons des coordonnées valides
    let validCoordinates = coordinates;
  
    if (!validCoordinates || typeof validCoordinates.lat !== 'number' || typeof validCoordinates.lng !== 'number') {
      console.log('Coordonnées invalides ou non disponibles, utilisation des coordonnées par défaut pour la France');
      
      // Utiliser des coordonnées par défaut pour la France
      validCoordinates = {
        lat: 46.603354, // Centre de la France
        lng: 1.888334,
        address: address,
        streetAddress: '',
        city: '',
        postalCode: ''
      };
      
      // Mettre à jour l'état des coordonnées
      setCoordinates(validCoordinates);
      
      console.log('ATTENTION: Utilisation des coordonnées par défaut car aucune coordonnée valide n\'a été fournie');
    } else {
      console.log('Utilisation des coordonnées EXACTES fournies par Google Places:', validCoordinates);
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Rechercher les points relais à proximité (rayon de 20 km)
      // Utiliser les coordonnées valides que nous avons préparées
      console.log('Recherche de points relais avec les coordonnées EXACTES:', validCoordinates);
      
      // Afficher les informations détaillées sur l'adresse
      if (validCoordinates.city || validCoordinates.postalCode) {
        console.log('Détails de l\'adresse pour la recherche:', {
          adresse: validCoordinates.address,
          rue: validCoordinates.streetAddress,
          ville: validCoordinates.city,
          codePostal: validCoordinates.postalCode,
          latitude: validCoordinates.lat,
          longitude: validCoordinates.lng
        });
      }
      
      const nearbyRelayPoints = await relayPointService.getNearbyRelayPointsByCoordinates(validCoordinates.lat, validCoordinates.lng, 20);
      
      // Les points relais sont déjà triés par distance et incluent la propriété distance
      // Convertir d'abord en unknown puis en RelayPointWithDistance pour éviter l'erreur TypeScript
      setRelayPoints(nearbyRelayPoints as unknown as RelayPointWithDistance[]);
      
      if (nearbyRelayPoints.length === 0) {
        setError('Aucun point relais trouvé à proximité de cette adresse. Essayez une autre adresse ou élargissez votre recherche.');
      } else {
        setShowMap(true);
      }
    } catch (error: any) {
      console.error('Erreur lors de la recherche des points relais:', error);
      setError(error.message || 'Une erreur est survenue lors de la recherche des points relais. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRelayPointSelect = (id: string) => {
    setSelectedRelayPoint(id);
    
    // Stocker les détails du point relais sélectionné
    const selectedRelay = relayPoints.find(relay => relay.id === id);
    if (selectedRelay) {
      // Utiliser une conversion de type pour éviter les erreurs TypeScript
      // Cette approche est sûre car nous savons que les propriétés nécessaires existent
      const relayDetails = {
        id: selectedRelay.id,
        businessName: selectedRelay.businessName,
        address: selectedRelay.address,
        openingHours: selectedRelay.openingHours,
        coordinates: {
          latitude: typeof selectedRelay.coordinates === 'object' ? selectedRelay.coordinates.latitude : 0,
          longitude: typeof selectedRelay.coordinates === 'object' ? selectedRelay.coordinates.longitude : 0
        },
        email: selectedRelay.email || '',
        phoneNumber: '',
        firstName: '',
        lastName: '',
        role: 'relayPoint' as const,
        createdAt: new Date().toISOString(),
        commission: 0
      };
      
      setSelectedRelayPointDetails(relayDetails);
    }
  };
  
  return (
    <Layout>
      <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Demande de réparation</h1>
          <p className="mt-2 text-gray-600">
            Décrivez votre problème et nous nous occupons du reste
          </p>
        </div>
        
        <div className="mb-8">
          <div className="flex items-center justify-between w-full max-w-3xl mx-auto">
            <div className="relative flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm ${step >= 1 ? 'bg-primary' : 'bg-gray-300'}`}>
                1
              </div>
              <span className="mt-2 text-sm font-medium text-gray-600">Problème</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
            <div className="relative flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm ${step >= 2 ? 'bg-primary' : 'bg-gray-300'}`}>
                2
              </div>
              <span className="mt-2 text-sm font-medium text-gray-600">Diagnostic</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${step >= 3 ? 'bg-primary' : 'bg-gray-200'}`}></div>
            <div className="relative flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm ${step >= 3 ? 'bg-primary' : 'bg-gray-300'}`}>
                3
              </div>
              <span className="mt-2 text-sm font-medium text-gray-600">Point relais</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${step >= 4 ? 'bg-primary' : 'bg-gray-200'}`}></div>
            <div className="relative flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm ${step >= 4 ? 'bg-primary' : 'bg-gray-300'}`}>
                4
              </div>
              <span className="mt-2 text-sm font-medium text-gray-600">QR Code</span>
            </div>
          </div>
        </div>
        
        <Card>
          <Card.Content className="p-6">
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-xl font-semibold text-gray-900">Décrivez votre appareil et le problème rencontré</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select
                    label="Type d'appareil"
                    options={deviceTypes}
                    value={deviceType}
                    onChange={setDeviceType}
                    required
                    fullWidth
                  />
                  
                  <Select
                    label="Marque"
                    options={commonBrands}
                    value={brand}
                    onChange={setBrand}
                    required
                    fullWidth
                  />
                </div>
                
                <Input
                  label="Modèle"
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Ex: MacBook Pro 2019, Galaxy S21..."
                  required
                  fullWidth
                />
                
                <div>
                  <label htmlFor="problem" className="block text-sm font-medium text-gray-700 mb-1">
                    Description du problème
                  </label>
                  <textarea
                    id="problem"
                    rows={5}
                    value={problemDescription}
                    onChange={(e) => setProblemDescription(e.target.value)}
                    placeholder="Décrivez en détail le problème que vous rencontrez avec votre appareil..."
                    className="block w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Plus votre description est précise, plus notre diagnostic sera pertinent.
                  </p>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    size="lg"
                    icon={<ChevronRight className="h-5 w-5" />}
                    iconPosition="right"
                    onClick={handleNext}
                    disabled={isAnalyzing || !deviceType || !brand || !problemDescription}
                  >
                    {isAnalyzing ? 'Analyse en cours...' : 'Analyser mon problème'}
                  </Button>
                </div>
              </div>
            )}
            
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-xl font-semibold text-gray-900">Pré-diagnostic IA</h2>
                
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 relative">
                  <div className="absolute top-0 right-0 transform -translate-y-1/2 bg-primary text-white text-xs px-2 py-1 rounded">
                    IA
                  </div>
                  <p className="text-gray-700">{aiDiagnosis}</p>
                  <div className="mt-4 flex items-center text-gray-600 text-sm">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    <span>Ce diagnostic initial est généré par notre intelligence artificielle. Un technicien effectuera une analyse complète.</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-2">Votre appareil</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Type d'appareil:</span>
                      <p className="font-medium text-gray-900">{deviceTypes.find(t => t.value === deviceType)?.label || deviceType}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Marque:</span>
                      <p className="font-medium text-gray-900">{commonBrands.find(b => b.value === brand)?.label || brand}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Modèle:</span>
                      <p className="font-medium text-gray-900">{model}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <label className="inline-flex items-center">
                    <input 
                      type="checkbox" 
                      defaultChecked={true}
                      className="rounded border-gray-300 text-primary shadow-sm focus:border-primary focus:ring focus:ring-primary/20" 
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      J'accepte que mon appareil soit examiné et qu'un devis me soit proposé
                    </span>
                  </label>
                </div>
                
                <div className="flex items-center pt-4">
                  <MessageSquare className="h-5 w-5 text-primary mr-3" />
                  <span className="text-sm text-gray-600">
                    Des questions ? Vous pouvez <a href="#" className="text-primary font-medium">discuter avec notre assistant</a>
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                  >
                    Retour
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    icon={<ChevronRight className="h-5 w-5" />}
                    iconPosition="right"
                    onClick={handleNext}
                  >
                    Choisir un point relais
                  </Button>
                </div>
              </div>
            )}
            
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-xl font-semibold text-gray-900">Choisissez un point relais</h2>
                
                <div className="mb-4">
                  <div className="relative">
                    <div className="relative">
                      <GooglePlacesAutocomplete
                        label="Votre adresse"
                        placeholder="Entrez votre adresse pour trouver les points relais proches"
                        value={address}
                        onChange={(value) => {
                          setAddress(value);
                          // Nous n'avons plus besoin de stocker le placeId
                        }}
                        onPlaceSelect={(place) => {
                          if (place.formatted_address) {
                            setAddress(place.formatted_address);
                            // Ne pas déclencher la recherche ici, elle sera déclenchée après avoir reçu les coordonnées
                          }
                        }}
                        onCoordinatesSelect={(coords) => {
                          console.log('Coordonnées reçues dans RequestRepairPage:', coords);
                          
                          // Vérifier que les coordonnées sont valides
                          if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
                            console.error('Coordonnées invalides reçues:', coords);
                            // Utiliser des coordonnées par défaut pour la France
                            const defaultCoords: Coordinates = {
                              lat: 46.603354, // Centre de la France
                              lng: 1.888334,
                              address: address,
                              streetAddress: '',
                              city: '',
                              postalCode: ''
                            };
                            console.log('Utilisation de coordonnées par défaut:', defaultCoords);
                            
                            // Déclencher la recherche directement avec les coordonnées par défaut
                            // sans passer par l'état qui peut être réinitialisé
                            try {
                              setLoading(true);
                              setError(null);
                              console.log('Recherche directe avec coordonnées par défaut:', defaultCoords);
                              relayPointService.getNearbyRelayPointsByCoordinates(defaultCoords.lat, defaultCoords.lng, 20)
                                .then(nearbyRelayPoints => {
                                  setRelayPoints(nearbyRelayPoints as unknown as RelayPointWithDistance[]);
                                  if (nearbyRelayPoints.length === 0) {
                                    setError('Aucun point relais trouvé à proximité de cette adresse. Essayez une autre adresse ou élargissez votre recherche.');
                                  } else {
                                    setShowMap(true);
                                  }
                                })
                                .catch(error => {
                                  console.error('Erreur lors de la recherche des points relais:', error);
                                  setError(error.message || 'Une erreur est survenue lors de la recherche des points relais. Veuillez réessayer.');
                                })
                                .finally(() => {
                                  setLoading(false);
                                });
                            } catch (error: any) {
                              console.error('Erreur lors de la recherche des points relais:', error);
                              setError(error.message || 'Une erreur est survenue lors de la recherche des points relais. Veuillez réessayer.');
                              setLoading(false);
                            }
                            return;
                          }
                          
                          // Si l'adresse complète est fournie avec les coordonnées, la mettre à jour
                          if (coords.address && coords.address !== address) {
                            console.log('Mise à jour de l\'adresse complète:', coords.address);
                            setAddress(coords.address);
                          }
                          
                          // Afficher les informations décomposées de l'adresse
                          // Assurons-nous que coords est bien du type Coordinates
                          const coordsWithDetails = coords as Coordinates;
                          if (coordsWithDetails.streetAddress || coordsWithDetails.city || coordsWithDetails.postalCode) {
                            console.log('Informations décomposées de l\'adresse:', {
                              rue: coordsWithDetails.streetAddress,
                              ville: coordsWithDetails.city,
                              codePostal: coordsWithDetails.postalCode
                            });
                          }
                          
                          // Déclencher la recherche directement avec les coordonnées reçues
                          // sans passer par l'état qui peut être réinitialisé
                          try {
                            setLoading(true);
                            setError(null);
                            console.log('Recherche directe avec coordonnées EXACTES:', coords);
                            // S'assurer que coords est du type Coordinates
                            const coordsToUse: Coordinates = {
                              lat: coords.lat,
                              lng: coords.lng,
                              address: coords.address || '',
                              // Utiliser le casting pour accéder aux propriétés supplémentaires
                              streetAddress: (coords as Coordinates).streetAddress || '',
                              city: (coords as Coordinates).city || '',
                              postalCode: (coords as Coordinates).postalCode || ''
                            };
                            relayPointService.getNearbyRelayPointsByCoordinates(coordsToUse.lat, coordsToUse.lng, 20)
                              .then(nearbyRelayPoints => {
                                setRelayPoints(nearbyRelayPoints as unknown as RelayPointWithDistance[]);
                                if (nearbyRelayPoints.length === 0) {
                                  setError('Aucun point relais trouvé à proximité de cette adresse. Essayez une autre adresse ou élargissez votre recherche.');
                                } else {
                                  setShowMap(true);
                                }
                              })
                              .catch(error => {
                                console.error('Erreur lors de la recherche des points relais:', error);
                                setError(error.message || 'Une erreur est survenue lors de la recherche des points relais. Veuillez réessayer.');
                              })
                              .finally(() => {
                                setLoading(false);
                              });
                          } catch (error: any) {
                            console.error('Erreur lors de la recherche des points relais:', error);
                            setError(error.message || 'Une erreur est survenue lors de la recherche des points relais. Veuillez réessayer.');
                            setLoading(false);
                          }
                          
                          // Mettre à jour l'état des coordonnées pour une utilisation ultérieure
                          setCoordinates(coords);
                        }}
                        disabled={loading}
                      />
                      {/* La recherche se fait automatiquement lorsqu'une adresse est sélectionnée */}
                    </div>
                  </div>
                </div>
                
                {error && (
                  <div className="p-4 mb-4 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
                    {error}
                  </div>
                )}
                
                {showMap && (
                  <div className="space-y-4">
                    <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center relative overflow-hidden">
                      <img 
                        src="https://images.pexels.com/photos/4386442/pexels-photo-4386442.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                        alt="Carte des points relais"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <p className="text-white text-lg font-medium">Carte interactive des points relais</p>
                      </div>
                    </div>
                    
                    <h3 className="font-medium text-gray-900">Points relais à proximité</h3>
                    
                    {loading ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : relayPoints.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        Aucun point relais trouvé à proximité. Essayez une autre adresse.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {relayPoints.map((relayPoint) => (
                          <div 
                            key={relayPoint.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedRelayPoint === relayPoint.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'}`}
                            onClick={() => handleRelayPointSelect(relayPoint.id)}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-900">{relayPoint.businessName}</h4>
                                <p className="text-gray-600 text-sm mt-1">{relayPoint.address}</p>
                                <p className="text-gray-500 text-xs mt-2">
                                  {typeof relayPoint.openingHours === 'string' 
                                    ? relayPoint.openingHours 
                                    : relayPoint.openingHours && typeof relayPoint.openingHours === 'object'
                                      ? Object.entries(relayPoint.openingHours)
                                          .map(([day, hours]) => {
                                            // Si hours est un objet, extraire les heures d'ouverture et de fermeture
                                            if (hours && typeof hours === 'object') {
                                              const hoursObj = hours as any;
                                              if (hoursObj.open && hoursObj.close) {
                                                return `${day.charAt(0).toUpperCase() + day.slice(1)}: ${hoursObj.open}-${hoursObj.close}`;
                                              }
                                              return `${day.charAt(0).toUpperCase() + day.slice(1)}: Fermé`;
                                            }
                                            return `${day.charAt(0).toUpperCase() + day.slice(1)}: ${String(hours)}`;
                                          })
                                          .join(', ')
                                      : 'Horaires non disponibles'}
                                </p>
                              </div>
                              <div className="bg-primary/10 text-primary px-2 py-1 rounded text-sm font-medium">
                                {relayPoint.distance} km
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div>
                      <label htmlFor="preferredDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Date préférentielle de dépôt
                      </label>
                      <input
                        type="date"
                        id="preferredDate"
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    
                    {selectedRelayPoint && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                        <div className="flex items-start">
                          <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                          <div>
                            <p className="text-sm text-blue-800">
                              Après validation, vous recevrez un QR code et un code de réparation à présenter lors du dépôt de votre appareil.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={loading}
                  >
                    Retour
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleNext}
                    disabled={!selectedRelayPoint || !preferredDate || loading}
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin inline-block h-4 w-4 border-b-2 border-white rounded-full mr-2"></span>
                        Traitement...
                      </>
                    ) : (
                      'Finaliser ma demande'
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Étape 4: Affichage du QR code */}
            {step === 4 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-xl font-semibold text-gray-900">Votre demande a été enregistrée</h2>
                
                {qrData && repairCode && repairId && (
                  <RepairQRCode
                    qrData={qrData}
                    repairCode={repairCode}
                    repairId={repairId}
                    relayName={selectedRelayPointDetails?.businessName || ''}
                    appointmentDate={preferredDate}
                    deviceInfo={{
                      type: deviceType,
                      brand: brand,
                      model: model
                    }}
                  />
                )}
                
                <div className="flex justify-center pt-4">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleNext}
                  >
                    Retour au tableau de bord
                  </Button>
                </div>
              </div>
            )}
          </Card.Content>
        </Card>
      </div>
    </Layout>
  );
};

export default RequestRepairPage;