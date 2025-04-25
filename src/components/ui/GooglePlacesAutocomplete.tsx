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
}

// Composant pour l'autocomplétion d'adresses avec l'API Google Places
const PlaceAutocompleteElementComponent: React.FC<{
  onPlaceSelect: (place: any) => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}> = ({ onPlaceSelect, inputValue, onInputChange, placeholder, disabled }) => {
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
        types: ['address']
      });

      // Écouter les événements de sélection de lieu
      autocompleteRef.current.addListener('place_changed', () => {
        try {
          const place = autocompleteRef.current.getPlace();
          if (place && place.formatted_address) {
            onInputChange(place.formatted_address);
            // Déclencher onPlaceSelect immédiatement pour lancer la recherche automatique
            onPlaceSelect(place);
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
  }, [onPlaceSelect, onInputChange]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={inputValue}
      onChange={(e) => onInputChange(e.target.value)}
      placeholder={placeholder || 'Entrez une adresse'}
      disabled={disabled}
      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
    />
  );
};

const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  label,
  placeholder = 'Entrez une adresse',
  value,
  onChange,
  disabled = false,
  onPlaceSelect
}) => {
  // État local pour stocker les erreurs et l'état de chargement
  const [loadError, setLoadError] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Gestionnaire de sélection de lieu
  const handlePlaceSelect = useCallback((place: any) => {
    if (onPlaceSelect) {
      onPlaceSelect(place);
    }
  }, [onPlaceSelect]);

  // Chargement de l'API Google Maps
  useEffect(() => {
    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      libraries: ['places']
    });

    loader.load()
      .then(() => {
        setIsLoaded(true);
      })
      .catch((error) => {
        console.error('Erreur lors du chargement de l\'API Google Maps:', error);
        setLoadError(error.message || "Erreur lors du chargement de l'API");
      });
  }, []);

  // Rendu du composant
  return (
    <div>
      <div className="relative">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        
        {/* Afficher soit le composant PlaceAutocompleteElement, soit l'input standard */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
          
          {isLoaded ? (
            <PlaceAutocompleteElementComponent
              onPlaceSelect={handlePlaceSelect}
              inputValue={value}
              onInputChange={onChange}
              placeholder={placeholder}
              disabled={disabled}
            />
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          )}
        </div>
      </div>
      
      {loadError && (
        <div className="text-red-500 text-sm mt-1">
          <p>Erreur lors du chargement de l'API Google Maps: {loadError}</p>
        </div>
      )}
    </div>
  );
};

export default GooglePlacesAutocomplete;
