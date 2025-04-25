import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { ArrowLeft, MapPin, Save } from 'lucide-react';
import { relayPointService } from '../../services/relayPointService';
import Layout from '../../components/layout/Layout';

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
      // Vérifier que les champs obligatoires sont remplis
      if (!formData.businessName || !formData.address || !formData.email) {
        setError('Veuillez remplir tous les champs obligatoires');
        setLoading(false);
        return;
      }

      // Vérifier si les coordonnées sont disponibles
      if (!formData.coordinates) {
        setError('Les coordonnées géographiques sont manquantes. Veuillez sélectionner une adresse valide.');
        setLoading(false);
        return;
      }

      console.log('Envoi des coordonnées au service:', formData.coordinates);
      
      // Créer ou mettre à jour le point relais
      const result = await relayPointService.createOrUpdateRelayPoint({
        id: formData.id,
        businessName: formData.businessName || '',
        address: formData.address || '',
        email: formData.email || '',
        firstName: formData.firstName || '',
        lastName: formData.lastName || '',
        phoneNumber: formData.phoneNumber || '',
        openingHours: formData.openingHours || {},
        role: 'relayPoint',
        commission: formData.commission || 0,
        coordinates: formData.coordinates // Ajout des coordonnées
      });

      if (result) {
        setSuccess(true);
        // Rediriger vers la liste des points relais après un court délai
        setTimeout(() => {
          navigate('/admin/relay-points');
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

            <OpeningHoursInput
              value={formData.openingHours}
              onChange={handleOpeningHoursChange}
            />

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
