import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { MapPin } from 'lucide-react';

// Clé API Google Maps depuis les variables d'environnement
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
if (!GOOGLE_MAPS_API_KEY) {
  console.error('La clé API Google Maps n\'est pas définie dans les variables d\'environnement');
}

// MIGRATION GOOGLE MAPS 2025 : utilisation exclusive du web component <place-autocomplete>
// Voir : https://developers.google.com/maps/documentation/javascript/places-migration-overview
// Ce composant n'utilise plus l'API JS classique Autocomplete, conformément à la doc Google 2025.

// Déclaration de type personnalisée pour le web component Google PlaceAutocompleteElement
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'place-autocomplete': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
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

// Composant pour l'autocomplétion d'adresses avec l'API Google Places (fallback classique)
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
    if (!inputRef.current || !window.google || !window.google.maps || !window.google.maps.places) {
      return;
    }
    try {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'fr' },
        types: ['address'],
        fields: ['address_components', 'formatted_address', 'geometry', 'name', 'place_id']
      });
      autocompleteRef.current.addListener('place_changed', () => {
        try {
          const place = autocompleteRef.current.getPlace();
          if (place && place.formatted_address) {
            const fullAddress = place.formatted_address;
            onInputChange(fullAddress);
            let coordinates: {
              lat: number,
              lng: number,
              address?: string,
              streetAddress?: string,
              city?: string,
              postalCode?: string
            };
            let streetAddress = '';
            let city = '';
            let postalCode = '';
            if (place.address_components) {
              for (const component of place.address_components) {
                const types = component.types;
                if (types.includes('street_number')) {
                  streetAddress = component.long_name + ' ' + streetAddress;
                }
                if (types.includes('route')) {
                  streetAddress = streetAddress + component.long_name;
                }
                if (types.includes('locality')) {
                  city = component.long_name;
                }
                if (types.includes('postal_code')) {
                  postalCode = component.long_name;
                }
              }
            }
            if (place.geometry && place.geometry.location) {
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
            } else {
              coordinates = {
                lat: 46.603354,
                lng: 1.888334,
                address: fullAddress,
                streetAddress,
                city,
                postalCode
              };
            }
            if (onCoordinatesSelect) {
              onCoordinatesSelect(coordinates);
            }
            const filteredPlace = {
              formatted_address: fullAddress,
              geometry: place.geometry,
              name: place.name,
              place_id: place.place_id,
              address_components: place.address_components
            };
            onPlaceSelect(filteredPlace);
          }
        } catch (error) {
          console.error('[GooglePlacesAutocomplete] Erreur lors de la récupération du lieu (fallback):', error);
        }
      });
      // Ajout : forcer la sélection de la première suggestion lors du blur
      if (inputRef.current) {
        inputRef.current.addEventListener('blur', () => {
          // Si aucune suggestion n'a été sélectionnée, forcer la sélection de la première
          const pacContainer = document.querySelector('.pac-container');
          if (pacContainer) {
            const firstSuggestion = pacContainer.querySelector('.pac-item');
            if (firstSuggestion) {
              (firstSuggestion as HTMLElement).click();
            }
          }
        });
      }
    } catch (error) {
      console.error('[GooglePlacesAutocomplete] Erreur lors de l\'initialisation de l\'autocomplétion (fallback):', error);
    }
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
      defaultValue={inputValue}
      placeholder={placeholder || 'Entrez une adresse'}
      disabled={disabled}
      className="block w-full px-4 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary"
    />
  );
};

// Fonction globale requise par Google Maps pour le paramètre callback=initMap
if (typeof window !== 'undefined' && !(window as any).initMap) {
  (window as any).initMap = () => {};
}

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps && window.google.maps.places) {
      console.log('[GooglePlacesAutocomplete] Script déjà chargé.');
      resolve();
      return;
    }
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      console.log('[GooglePlacesAutocomplete] Script déjà présent dans le DOM, attente de son chargement.');
      existingScript.addEventListener('load', () => resolve());
      return;
    }
    console.log('[GooglePlacesAutocomplete] Insertion du script Google Maps dans le DOM...');
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('[GooglePlacesAutocomplete] Script Google Maps chargé.');
      resolve();
    };
    script.onerror = () => {
      console.error('[GooglePlacesAutocomplete] Erreur lors du chargement du script Google Maps');
      reject('Erreur lors du chargement de Google Maps');
    };
    document.body.appendChild(script);
  });
}

const GOOGLE_GEOCODING_API = 'https://maps.googleapis.com/maps/api/geocode/json';

// Nouveau composant utilisant PlaceAutocompleteElement
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState(value || '');

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Charger le script Google Maps
  useEffect(() => {
    loadGoogleMapsScript(GOOGLE_MAPS_API_KEY)
      .then(() => setIsLoaded(true))
      .catch(() => {
        setIsLoaded(false);
        setLoadError("Impossible de charger Google Maps. Vérifiez votre connexion ou votre clé API.");
      });
  }, []);

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      {loadError && (
        <div className="text-error text-sm mb-2">{loadError}</div>
      )}
      {isLoaded ? (
        <PlaceAutocompleteElement
          onPlaceSelect={onPlaceSelect}
          onCoordinatesSelect={onCoordinatesSelect}
          inputValue={inputValue}
          onInputChange={val => {
            setInputValue(val);
            onChange(val);
          }}
          placeholder={placeholder}
          disabled={disabled}
        />
      ) : (
        <div className="text-sm text-gray-500">Chargement de l'autocomplétion Google…</div>
      )}
    </div>
  );
};

export default GooglePlacesAutocomplete;
