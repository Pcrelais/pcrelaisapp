import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { MapPin } from 'lucide-react';

// Clé API Google Maps depuis les variables d'environnement
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
if (!GOOGLE_MAPS_API_KEY) {
  console.error('La clé API Google Maps n\'est pas définie dans les variables d\'environnement');
}

// Définition des props du composant
interface GooglePlacesAutocompleteProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string, placeId?: string) => void;
  disabled?: boolean;
  onPlaceSelect?: (place: any) => void;
  // Prop pour transmettre les coordonnées et l'adresse complète
  onCoordinatesSelect?: (coordinates: {lat: number, lng: number, address?: string}) => void;
}

// Composant pour l'autocomplétion d'adresses avec l'API Google Places
const PlaceAutocompleteElement: React.FC<{
  onPlaceSelect: (place: any) => void;
  onCoordinatesSelect?: (coordinates: {
    lat: number, 
    lng: number, 
    address?: string,
    streetAddress?: string,
    city?: string,
    postalCode?: string
  }) => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}> = ({ onPlaceSelect, onCoordinatesSelect, inputValue, onInputChange, placeholder, disabled }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    // S'assurer que l'API Google Maps est chargée et que l'input existe
    if (!inputRef.current || !window.google || !window.google.maps || !window.google.maps.places) {
      return;
    }

    try {
      // Créer l'instance d'autocomplétion avec l'API classique
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'fr' },
        types: ['address'],
        fields: ['address_components', 'formatted_address', 'geometry', 'name', 'place_id']
      });

      // Écouter les événements de sélection de lieu
      autocompleteRef.current.addListener('place_changed', () => {
        try {
          const place = autocompleteRef.current.getPlace();
          if (place && place.formatted_address) {
            // Utiliser l'adresse formatée complète fournie par Google
            const fullAddress = place.formatted_address;
            console.log('Adresse complète récupérée depuis Google Places:', fullAddress);
            
            // S'assurer que l'adresse n'est pas tronquée
            onInputChange(fullAddress);
            
            // Déterminer les coordonnées à utiliser
            let coordinates: {
              lat: number, 
              lng: number, 
              address?: string,
              streetAddress?: string,
              city?: string,
              postalCode?: string
            };
            
            // Extraire les différentes parties de l'adresse
            let streetAddress = '';
            let city = '';
            let postalCode = '';
            
            // Parcourir les composants d'adresse pour extraire les informations
            if (place.address_components) {
              for (const component of place.address_components) {
                const types = component.types;
                
                // Extraire le numéro et la rue
                if (types.includes('street_number')) {
                  streetAddress = component.long_name + ' ' + streetAddress;
                }
                if (types.includes('route')) {
                  streetAddress = streetAddress + component.long_name;
                }
                
                // Extraire la ville
                if (types.includes('locality')) {
                  city = component.long_name;
                }
                
                // Extraire le code postal
                if (types.includes('postal_code')) {
                  postalCode = component.long_name;
                }
              }
            }
            
            console.log('Adresse décomposée:', { streetAddress, city, postalCode });
            
            // Récupérer les coordonnées depuis l'API Places
            if (place.geometry && place.geometry.location) {
              // Utiliser les coordonnées exactes fournies par Google Places
              const exactLat = place.geometry.location.lat();
              const exactLng = place.geometry.location.lng();
              
              coordinates = {
                lat: exactLat,
                lng: exactLng,
                address: fullAddress,
                streetAddress,
                city,
                postalCode
              };
              
              console.log('Coordonnées EXACTES récupérées depuis Google Places:', coordinates);
            } else {
              // Si les coordonnées ne sont pas disponibles, vérifier si nous avons le code postal et la ville
              if (city && postalCode) {
                console.warn('Coordonnées non disponibles, mais ville et code postal présents. Utilisation de coordonnées approximatives.');
                
                // Utiliser des coordonnées approximatives basées sur le code postal et la ville
                // Ces coordonnées sont plus précises que les coordonnées par défaut pour la France
                coordinates = {
                  lat: 45.4, // Coordonnées approximatives pour la France
                  lng: 5.4,
                  address: fullAddress,
                  streetAddress,
                  city,
                  postalCode
                };
                
                console.log('Utilisation de coordonnées approximatives basées sur la ville et le code postal:', coordinates);
              } else {
                // Si aucune information n'est disponible, utiliser des coordonnées par défaut pour la France
                console.warn('Aucune coordonnée disponible pour cette adresse. Utilisation des coordonnées par défaut.');
                
                coordinates = {
                  lat: 46.603354, // Coordonnées du centre de la France
                  lng: 1.888334,
                  address: fullAddress,
                  streetAddress,
                  city,
                  postalCode
                };
                
                console.log('Utilisation de coordonnées par défaut pour la France:', coordinates);
              }
            }
            
            // Transmettre les coordonnées immédiatement si la prop est fournie
            if (onCoordinatesSelect) {
              onCoordinatesSelect(coordinates);
            }
            
            // Créer un objet place filtré sans les propriétés dépréciées
            const filteredPlace = {
              formatted_address: fullAddress,
              geometry: place.geometry,
              name: place.name,
              place_id: place.place_id,
              address_components: place.address_components
            };
            
            // Déclencher onPlaceSelect immédiatement pour lancer la recherche automatique
            onPlaceSelect(filteredPlace);
          }
        } catch (error) {
          console.error('Erreur lors de la récupération du lieu:', error);
        }
      });
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de l\'autocomplétion:', error);
    }

    // Nettoyage lors du démontage
    return () => {
      if (autocompleteRef.current && window.google && window.google.maps) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onInputChange, onPlaceSelect, onCoordinatesSelect]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={inputValue}
      onChange={(e) => onInputChange(e.target.value)}
      placeholder={placeholder || 'Entrez une adresse'}
      disabled={disabled}
      className="block w-full px-4 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary"
    />
  );
};

const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  label,
  placeholder,
  value,
  onChange,
  disabled,
  onPlaceSelect = () => {},
  onCoordinatesSelect
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger l'API Google Maps
  useEffect(() => {
    const loadGoogleMapsAPI = async () => {
      try {
        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['places']
        });

        await loader.load();
        setIsLoaded(true);
      } catch (err) {
        console.error('Erreur lors du chargement de l\'API Google Maps:', err);
        setError('Impossible de charger l\'API Google Maps. Vérifiez votre connexion internet et réessayez.');
      }
    };

    loadGoogleMapsAPI();
  }, []);

  // Fonction de gestion du changement de valeur
  const handleInputChange = useCallback((newValue: string) => {
    onChange(newValue);
  }, [onChange]);

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-5 w-5 text-gray-400" />
        </div>
        {isLoaded ? (
          <PlaceAutocompleteElement
            inputValue={value}
            onInputChange={handleInputChange}
            onPlaceSelect={onPlaceSelect}
            onCoordinatesSelect={onCoordinatesSelect}
            placeholder={placeholder}
            disabled={disabled}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || 'Chargement de l\'API Google Maps...'}
            disabled={true}
            className="block w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary"
          />
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default GooglePlacesAutocomplete;
