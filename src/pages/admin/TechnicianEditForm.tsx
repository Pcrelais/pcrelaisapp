import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { supabase } from '../../lib/supabaseConfig';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import GooglePlacesAutocomplete from '../../components/ui/GooglePlacesAutocomplete';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface TechnicianFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  specialization?: string;
  is_active: boolean;
  latitude?: number;
  longitude?: number;
  zone_radius_km?: number;
  address?: string;
}

// Utilitaire pour extraire ville/code postal depuis Google Places (si dispo)
function extractCityPostal(address: string): { city?: string; postalCode?: string } {
  if (!address) return {};
  // Simple extraction par regex (à adapter selon format)
  const postalMatch = address.match(/\b\d{5}\b/);
  const cityMatch = address.match(/\b([A-Za-zÀ-ÿ\-\s']{2,})\b(?=,|$)/g);
  return {
    postalCode: postalMatch ? postalMatch[0] : undefined,
    city: cityMatch ? cityMatch[cityMatch.length - 1]?.trim() : undefined
  };
}

// Composant pour déplacer le marqueur sur la carte
function DraggableMarker({ position, onChange }: { position: [number, number], onChange: (lat: number, lng: number) => void }) {
  const [draggable, setDraggable] = useState(true);
  const [markerPosition, setMarkerPosition] = useState<[number, number]>(position);
  useEffect(() => { setMarkerPosition(position); }, [position]);
  useMapEvents({
    click(e: any) {
      setMarkerPosition([e.latlng.lat, e.latlng.lng]);
      onChange(e.latlng.lat, e.latlng.lng);
    }
  });
  return (
    <Marker
      position={markerPosition}
      draggable={draggable}
      eventHandlers={{
        dragend: (e: any) => {
          const marker = e.target;
          const pos = marker.getLatLng();
          setMarkerPosition([pos.lat, pos.lng]);
          onChange(pos.lat, pos.lng);
        }
      }}
      icon={L.icon({ iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png', iconSize: [25, 41], iconAnchor: [12, 41] })}
    />
  );
}

const TechnicianEditForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [coordError, setCoordError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<TechnicianFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    specialization: '',
    is_active: true,
    latitude: undefined,
    longitude: undefined,
    zone_radius_km: 30,
    address: ''
  });
  
  useEffect(() => {
    const fetchTechnician = async () => {
      try {
        setLoading(true);
        
        if (!id) {
          setError("ID du technicien manquant");
          return;
        }
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .eq('role', 'technician')
          .single();
        
        if (error) {
          throw error;
        }
        
        if (!data) {
          setError("Technicien non trouvé");
          return;
        }
        
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          phone: data.phone || '',
          specialization: data.specialization || '',
          is_active: data.is_active !== false,
          latitude: typeof data.latitude === 'number' ? data.latitude : undefined,
          longitude: typeof data.longitude === 'number' ? data.longitude : undefined,
          zone_radius_km: typeof data.zone_radius_km === 'number' ? data.zone_radius_km : 30,
          address: data.address || ''
        });
        
      } catch (error: any) {
        console.error('Erreur lors de la récupération du technicien:', error);
        setError(error.message || "Erreur lors de la récupération du technicien");
      } finally {
        setLoading(false);
      }
    };
    
    fetchTechnician();
  }, [id]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? undefined : Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      if (!id) {
        setError("ID du technicien manquant");
        return;
      }
      // Préparer les données à mettre à jour
      const updateData: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || null,
        latitude: formData.latitude !== undefined ? Number(formData.latitude) : null,
        longitude: formData.longitude !== undefined ? Number(formData.longitude) : null,
        zone_radius_km: formData.zone_radius_km !== undefined ? Number(formData.zone_radius_km) : 30,
        address: formData.address || null,
        is_active: formData.is_active,
        specialization: formData.specialization || null
      };
      // Mettre à jour le technicien
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id);
      if (updateError) {
        throw updateError;
      }
      setSuccessMessage("Technicien mis à jour avec succès");
      setTimeout(() => {
        navigate('/admin/technicians');
      }, 2000);
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du technicien:', error);
      setError(error.message || "Erreur lors de la mise à jour du technicien");
    } finally {
      setSaving(false);
    }
  };
  
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setCoordError("La géolocalisation n'est pas supportée par ce navigateur.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        setCoordError(null);
      },
      () => setCoordError("Impossible de récupérer la position actuelle."),
      { enableHighAccuracy: true }
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/admin/technicians')}
          className="mr-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold">Modifier le technicien</h1>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-md text-error">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-md text-success">
          {successMessage}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Card>
          <Card.Header>
            <Card.Title>Informations du technicien</Card.Title>
          </Card.Header>
          <Card.Content>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-gray-400 text-xs">(non modifiable)</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 bg-gray-100 rounded-md cursor-not-allowed"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Spécialisation
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                    Technicien actif
                  </label>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse du technicien (autocomplétion)
                  </label>
                  <GooglePlacesAutocomplete
                    label=""
                    placeholder="Entrez l'adresse complète"
                    value={formData.address || ''}
                    onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
                    onPlaceSelect={(place) => {
                      if (place && place.formatted_address) {
                        const location = place.geometry?.location;
                        setFormData(prev => ({
                          ...prev,
                          address: place.formatted_address,
                          latitude:
                            typeof location?.lat === 'function'
                              ? location.lat()
                              : location?.lat ?? prev.latitude,
                          longitude:
                            typeof location?.lng === 'function'
                              ? location.lng()
                              : location?.lng ?? prev.longitude
                        }));
                      }
                    }}
                  />
                  {formData.latitude && formData.longitude && (
                    <div className="mt-2 text-sm text-gray-600">
                      Coordonnées: {parseFloat(String(formData.latitude)).toFixed(6)}, {parseFloat(String(formData.longitude)).toFixed(6)}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rayon de couverture (km)
                  </label>
                  <input
                    type="number"
                    name="zone_radius_km"
                    value={formData.zone_radius_km || 30}
                    onChange={handleChange}
                    min={1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/technicians')}
                  className="mr-2"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-b-2 border-white rounded-full"></div>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card.Content>
        </Card>
      )}
      {/* Affichage de la carte interactive si coordonnées valides */}
      {formData.latitude !== undefined && formData.longitude !== undefined && (
        <div className="mt-4" style={{ height: 300 }}>
          <MapContainer
            center={[formData.latitude, formData.longitude]}
            zoom={13}
            style={{ height: 300, width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <DraggableMarker
              position={[formData.latitude, formData.longitude]}
              onChange={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))}
            />
            <Circle
              center={[formData.latitude, formData.longitude]}
              radius={(formData.zone_radius_km || 30) * 1000}
              pathOptions={{ color: 'blue', fillOpacity: 0.2 }}
            />
          </MapContainer>
        </div>
      )}
    </div>
  );
};

export default TechnicianEditForm;
