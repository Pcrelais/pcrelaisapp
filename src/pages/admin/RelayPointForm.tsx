import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { ArrowLeft, MapPin, Save, AlertCircle, Clock } from 'lucide-react';
import { relayPointService } from '../../services/relayPointService';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';

// Type spécifique pour le formulaire des points relais
type RelayPointFormData = {
  id?: string;
  businessName: string;
  address: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  openingHours: any;
  role: 'relayPoint';
  commission: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  createdAt?: string;
};
import GooglePlacesAutocomplete from '../../components/ui/GooglePlacesAutocomplete';

// Composant pour gérer les heures d'ouverture
const OpeningHoursInput = ({ value, onChange }: { 
  value: any, 
  onChange: (hours: any) => void 
}) => {
  const days = [
    { id: 'monday', label: 'Lundi' },
    { id: 'tuesday', label: 'Mardi' },
    { id: 'wednesday', label: 'Mercredi' },
    { id: 'thursday', label: 'Jeudi' },
    { id: 'friday', label: 'Vendredi' },
    { id: 'saturday', label: 'Samedi' },
    { id: 'sunday', label: 'Dimanche' },
  ];

  const handleDayChange = (day: string, field: 'open' | 'close', time: string) => {
    const newHours = { ...value };
    if (!newHours[day]) {
      newHours[day] = { open: '', close: '' };
    }
    newHours[day][field] = time;
    onChange(newHours);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">Horaires d'ouverture</label>
      <div className="space-y-3">
        {days.map((day) => (
          <div key={day.id} className="grid grid-cols-3 gap-2 items-center">
            <div className="text-sm font-medium">{day.label}</div>
            <Input
              type="time"
              placeholder="Ouverture"
              value={(value && value[day.id] && value[day.id].open) || ''}
              onChange={(e) => handleDayChange(day.id, 'open', e.target.value)}
              className="text-sm"
            />
            <Input
              type="time"
              placeholder="Fermeture"
              value={(value && value[day.id] && value[day.id].close) || ''}
              onChange={(e) => handleDayChange(day.id, 'close', e.target.value)}
              className="text-sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const RelayPointForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<Partial<RelayPointFormData>>({
    businessName: '',
    address: '',
    email: '',
    phoneNumber: '',
    openingHours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '09:00', close: '13:00' },
      sunday: { open: '', close: '' }
    }
  });

  // Charger les données du point relais si on est en mode édition
  useEffect(() => {
    const loadRelayPoint = async () => {
      if (id) {
        setLoading(true);
        try {
          const relayPoint = await relayPointService.getRelayPointById(id);
          
          // Vérifier si l'utilisateur a le droit de modifier ce point relais
          if (user && user.role !== 'admin' && id !== user.id) {
            setError("Vous ne pouvez modifier que votre propre point relais.");
            setLoading(false);
            return;
          }
          
          if (relayPoint) {
            setFormData({
              id: relayPoint.id,
              businessName: relayPoint.businessName,
              address: relayPoint.address,
              email: relayPoint.email,
              phoneNumber: relayPoint.phoneNumber,
              openingHours: relayPoint.openingHours || {
                monday: { open: '09:00', close: '18:00' },
                tuesday: { open: '09:00', close: '18:00' },
                wednesday: { open: '09:00', close: '18:00' },
                thursday: { open: '09:00', close: '18:00' },
                friday: { open: '09:00', close: '18:00' },
                saturday: { open: '09:00', close: '13:00' },
                sunday: { open: '', close: '' }
              },
              coordinates: relayPoint.coordinates
            });
          } else {
            setError('Point relais non trouvé');
          }
        } catch (err) {
          setError('Erreur lors du chargement du point relais');
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };

    loadRelayPoint();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpeningHoursChange = (hours: any) => {
    setFormData((prev) => ({ ...prev, openingHours: hours }));
  };

  const handleAddressSelect = async (address: string, location?: any) => {
    // Mettre à jour l'adresse dans le state
    setFormData((prev) => ({ ...prev, address }));
    
    // Si les coordonnées sont fournies directement par l'API Places, les utiliser
    if (location) {
      console.log('Coordonnées obtenues directement de Google Places:', location);
      
      // Vérifier si location a des méthodes lat() et lng() (objet Google Maps LatLng)
      if (typeof location.lat === 'function' && typeof location.lng === 'function') {
        const latitude = location.lat();
        const longitude = location.lng();
        console.log('Valeurs extraites:', { latitude, longitude });
        
        setFormData((prev) => ({
          ...prev,
          address,
          coordinates: {
            latitude,
            longitude
          }
        }));
        return;
      } 
      // Vérifier si location a des propriétés lat et lng directes
      else if (location.lat !== undefined && location.lng !== undefined) {
        setFormData((prev) => ({
          ...prev,
          address,
          coordinates: {
            latitude: location.lat,
            longitude: location.lng
          }
        }));
        return;
      }
    }
    
    // Sinon, essayer de géocoder l'adresse (ce qui peut ne pas fonctionner avec les restrictions de référent)
    try {
      const coordinates = await relayPointService.geocodeAddress(address);
      if (coordinates) {
        console.log('Coordonnées obtenues via géocodage:', coordinates);
        setFormData((prev) => ({
          ...prev,
          address,
          coordinates
        }));
      } else {
        console.warn('Impossible de géocoder l\'adresse:', address);
      }
    } catch (error) {
      console.error('Erreur lors du géocodage de l\'adresse:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Validation des données
      if (!formData.businessName || !formData.address || !formData.email) {
        setError('Veuillez remplir tous les champs obligatoires.');
        setLoading(false);
        return;
      }
      
      // Vérifier si l'utilisateur a le droit de modifier ce point relais
      if (formData.id && user && user.role !== 'admin' && formData.id !== user.id) {
        setError("Vous ne pouvez modifier que votre propre point relais.");
        setLoading(false);
        return;
      }
      
      // Préparer les données pour l'API
      if (!formData.businessName || !formData.address || !formData.email) {
        throw new Error('Champs obligatoires manquants');
      }
      
      const dataToSave = {
        id: formData.id,
        businessName: formData.businessName,
        address: formData.address,
        email: formData.email,
        phoneNumber: formData.phoneNumber || '',
        firstName: formData.firstName || '',
        lastName: formData.lastName || '',
        role: 'relayPoint' as const,
        commission: formData.commission || 0,
        openingHours: formData.openingHours || {},
        coordinates: formData.coordinates,
        currentUserId: user?.id // Ajouter l'ID de l'utilisateur courant pour la vérification d'autorisation
      };
      
      // Appel à l'API pour créer ou mettre à jour le point relais
      const result = await relayPointService.createOrUpdateRelayPoint(dataToSave);
      

      if (result) {
        setSuccess(true);
        // Rediriger vers la liste après un court délai ou vers le profil si c'est un point relais
        setTimeout(() => {
          if (user?.role === 'admin') {
            navigate('/admin/relay-points');
          } else if (user?.role === 'relayPoint') {
            navigate('/relay/profile');
          } else {
            navigate('/dashboard');
          }
        }, 1500);
      } else {
        setError('Erreur lors de l\'enregistrement du point relais');
      }
    } catch (err) {
      setError('Une erreur est survenue');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="mb-6 flex items-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/relay-points')}
            className="mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">
            {id ? 'Modifier le point relais' : 'Ajouter un point relais'}
          </h1>
        </div>

      <Card>
        <Card.Content className="p-6">
          {user && user.role !== 'admin' && id && id !== user.id && (
            <div className="mb-6 p-4 bg-warning/10 border border-warning/20 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 text-warning mr-2 mt-0.5" />
              <div>
                <p className="text-warning font-medium">Accès limité</p>
                <p className="text-sm text-gray-600 mt-1">
                  En tant que point relais, vous ne pouvez modifier que vos propres informations.
                </p>
              </div>
            </div>
          )}
          {error && (
            <div className="mb-4 p-4 bg-error/10 border border-error/20 rounded-lg text-error">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-success/10 border border-success/20 rounded-lg text-success">
              Point relais enregistré avec succès!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Nom du point relais"
              name="businessName"
              value={formData.businessName || ''}
              onChange={handleInputChange}
              placeholder="Ex: PC Relais Paris"
              required
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Adresse complète
              </label>
              <div className="relative">
                <GooglePlacesAutocomplete
                  label=""
                  placeholder="Entrez l'adresse complète"
                  value={formData.address || ''}
                  onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
                  onPlaceSelect={(place) => {
                    if (place && place.formatted_address) {
                      // Récupérer les coordonnées directement depuis l'objet place
                      const location = place.geometry?.location;
                      handleAddressSelect(place.formatted_address, location);
                    }
                  }}
                />
                {formData.coordinates && (
                  <div className="mt-2 text-sm text-gray-600">
                    Coordonnées: {parseFloat(String(formData.coordinates.latitude)).toFixed(6)}, 
                    {parseFloat(String(formData.coordinates.longitude)).toFixed(6)}
                  </div>
                )}
                <div className="absolute right-3 top-3 text-gray-400">
                  <MapPin className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                L'adresse sera automatiquement géocodée pour calculer les distances.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={handleInputChange}
                placeholder="contact@pcrelais.fr"
                required
              />

              <Input
                label="Téléphone"
                name="phoneNumber"
                value={formData.phoneNumber || ''}
                onChange={handleInputChange}
                placeholder="01 23 45 67 89"
              />
            </div>

            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mb-6">
              <div className="flex items-start mb-3">
                <Clock className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">Horaires d'ouverture</p>
                  <p className="text-sm text-blue-600">Ces horaires seront affichés aux clients lors de la sélection d'un point relais.</p>
                </div>
              </div>
              <OpeningHoursInput
                value={formData.openingHours}
                onChange={handleOpeningHoursChange}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <span className="animate-spin h-4 w-4 mr-2 border-b-2 border-white rounded-full"></span>
                    Enregistrement...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Save className="h-5 w-5 mr-2" />
                    Enregistrer
                  </span>
                )}
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card>
      </div>
    </Layout>
  );
};

export default RelayPointForm;
