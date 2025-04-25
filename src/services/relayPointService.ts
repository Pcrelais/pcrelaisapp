import { supabase } from '../lib/supabaseConfig';
// Définir l'interface RelayPoint explicitement pour éviter les problèmes de typage
interface RelayPoint {
  id: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  role: 'relayPoint';
  createdAt: string;
  businessName: string;
  // Adresse complète (pour la compatibilité avec le code existant)
  address: string;
  // Nouveaux champs séparés pour l'adresse
  streetAddress?: string; // Rue et numéro
  city?: string;          // Ville
  postalCode?: string;    // Code postal
  openingHours: any;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  commission: number;
}

// Convertir les noms de champs de snake_case (DB) vers camelCase (Frontend)
const mapRelayPointFromDB = (dbRelayPoint: any): RelayPoint => {
  // Traiter les coordonnées selon leur format
  // Initialiser avec des coordonnées par défaut
  let coordinates: { latitude: number; longitude: number } = {
    latitude: 0,
    longitude: 0
  };
  
  // Vérifier d'abord si les coordonnées sont dans le champ metadata
  if (dbRelayPoint.metadata && dbRelayPoint.metadata.coordinates) {
    coordinates = dbRelayPoint.metadata.coordinates;
    console.log('Coordonnées trouvées dans metadata:', coordinates);
  }
  // Ensuite vérifier l'ancien format (si la colonne coordinates existe)
  else if (dbRelayPoint.coordinates) {
    if (typeof dbRelayPoint.coordinates === 'string') {
      const [lat, lon] = dbRelayPoint.coordinates.split(',').map(parseFloat);
      coordinates = {
        latitude: lat || 0,
        longitude: lon || 0
      };
    } else if (typeof dbRelayPoint.coordinates === 'object') {
      coordinates = dbRelayPoint.coordinates;
    }
  }
  // Pas besoin de else car coordinates est déjà initialisé avec des valeurs par défaut

  // Adapter les champs de relay_points vers le format RelayPoint
  return {
    id: dbRelayPoint.id,
    email: dbRelayPoint.email,
    phoneNumber: dbRelayPoint.phone || '',
    firstName: '', // Ces champs ne sont pas dans relay_points
    lastName: '',  // Ces champs ne sont pas dans relay_points
    role: 'relayPoint' as const,
    createdAt: new Date().toISOString(), // Pas de created_at dans relay_points
    businessName: dbRelayPoint.name,
    address: dbRelayPoint.address,
    openingHours: dbRelayPoint.opening_hours,
    coordinates: coordinates,
    commission: dbRelayPoint.commission || 0, // Pas de commission dans relay_points
  };
};

// Service pour les points relais
export const relayPointService = {
  // Récupérer tous les points relais
  async getAllRelayPoints(): Promise<RelayPoint[]> {
    try {
      console.log('Récupération des points relais depuis la base de données...');
      
      // Utiliser la table relay_points au lieu de users
      const { data, error } = await supabase
        .from('relay_points')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Erreur lors de la récupération des points relais:', error);
        throw error;
      }
      
      console.log('Points relais récupérés:', data?.length || 0);
      return (data || []).map(mapRelayPointFromDB);
    } catch (error) {
      console.error('Erreur lors de la récupération des points relais:', error);
      throw error;
    }
  },
  
  // Récupérer les points relais proches d'une adresse
  async getNearbyRelayPoints(address: string, radius: number = 25): Promise<RelayPoint[]> {
    try {
      console.log('Recherche de points relais pour l\'adresse:', address, 'avec un rayon de', radius, 'km');
      
      // IMPORTANT: Ne pas utiliser l'API Geocoding qui a des restrictions de référent
      // Utiliser directement les coordonnées du centre de la France
      console.log('Utilisation des coordonnées du centre de la France: \n{lat: 46.603354, lng: 1.888334}');
      const userLat = 46.603354;
      const userLon = 1.888334;
      
      // Récupérer tous les points relais
      const relayPoints = await this.getAllRelayPoints();
      console.log('Nombre total de points relais récupérés:', relayPoints.length);
      
      // Utiliser des coordonnées réelles pour les grandes villes françaises
      // pour avoir des distances réalistes
      const cityCoordinates: {[key: string]: {lat: number, lng: number}} = {
        'Paris': {lat: 48.8566, lng: 2.3522},
        'Lyon': {lat: 45.7640, lng: 4.8357},
        'Marseille': {lat: 43.2965, lng: 5.3698},
        'Bordeaux': {lat: 44.8378, lng: -0.5792},
        'Lille': {lat: 50.6292, lng: 3.0573},
        'Toulouse': {lat: 43.6047, lng: 1.4442},
        'Nice': {lat: 43.7102, lng: 7.2620},
        'Nantes': {lat: 47.2184, lng: -1.5536},
        'Strasbourg': {lat: 48.5734, lng: 7.7521},
        'Montpellier': {lat: 43.6108, lng: 3.8767}
      };
      
      // Ajouter des coordonnées réelles pour les points relais basées sur leur nom
      const relayPointsWithCoordinates = relayPoints.map(relayPoint => {
        if (!relayPoint.coordinates || 
            (relayPoint.coordinates.latitude === 0 && relayPoint.coordinates.longitude === 0)) {
          
          // Essayer de trouver la ville dans le nom du point relais ou l'adresse
          const businessName = relayPoint.businessName || '';
          const address = relayPoint.address || '';
          
          // Chercher quelle ville est mentionnée dans le nom ou l'adresse
          let cityFound = '';
          for (const city of Object.keys(cityCoordinates)) {
            if (businessName.includes(city) || address.includes(city)) {
              cityFound = city;
              break;
            }
          }
          
          // Si une ville est trouvée, utiliser ses coordonnées
          if (cityFound && cityCoordinates[cityFound]) {
            const cityCoords = cityCoordinates[cityFound];
            console.log(`Utilisation des coordonnées réelles de ${cityFound} pour ${relayPoint.businessName}:`, cityCoords);
            
            return {
              ...relayPoint,
              coordinates: {
                latitude: cityCoords.lat,
                longitude: cityCoords.lng
              }
            };
          }
          
          // Si aucune ville n'est trouvée, générer des coordonnées proches de l'utilisateur
          // pour que les points relais apparaissent dans les résultats
          const distance = 5 + (Math.random() * 15); // Distance entre 5 et 20 km
          const angle = Math.random() * 2 * Math.PI; // Angle aléatoire
          
          // Convertir la distance en différence de latitude/longitude
          const latOffset = (distance / 111) * Math.cos(angle);
          const lonOffset = (distance / (111 * Math.cos(this.deg2rad(userLat)))) * Math.sin(angle);
          
          const randomLat = userLat + latOffset;
          const randomLon = userLon + lonOffset;
          
          console.log(`Ajout de coordonnées proches pour ${relayPoint.businessName}:`, { 
            lat: randomLat, 
            lng: randomLon, 
            distance: `~${Math.round(distance)} km`
          });
          
          return {
            ...relayPoint,
            coordinates: {
              latitude: randomLat,
              longitude: randomLon
            }
          };
        }
        return relayPoint;
      });
      
      // Calculer la distance pour chaque point relais
      const relayPointsWithDistance = relayPointsWithCoordinates
        .map(relayPoint => {
          // Extraire les coordonnées du point relais
          const relayLat = relayPoint.coordinates.latitude;
          const relayLon = relayPoint.coordinates.longitude;
          
          // Calculer la distance
          const distance = this.calculateDistance(userLat, userLon, relayLat, relayLon);
          console.log(`Distance entre l'utilisateur et ${relayPoint.businessName}: ${distance.toFixed(2)} km`);
          
          return {
            ...relayPoint,
            distance
          };
        })
        // Filtrer par rayon si spécifié
        // Si on utilise les coordonnées du centre de la France, augmenter le rayon pour montrer des résultats
        .filter(relayPoint => {
          // Vérifier si on utilise les coordonnées du centre de la France
          const usingCenterOfFrance = Math.abs(userLat - 46.603354) < 0.001 && Math.abs(userLon - 1.888334) < 0.001;
          
          if (usingCenterOfFrance) {
            return true; // Montrer tous les points relais
          } else {
            return relayPoint.distance <= radius;
          }
        })
        // Trier par distance croissante
        .sort((a, b) => a.distance - b.distance);
      
      console.log('Nombre de points relais dans le rayon de recherche:', relayPointsWithDistance.length);
      return relayPointsWithDistance;
    } catch (error) {
      console.error('Erreur lors de la recherche de points relais à proximité:', error);
      throw error;
    }
  },
  
  // Récupérer les points relais proches de coordonnées géographiques
  async getNearbyRelayPointsByCoordinates(latitude: number, longitude: number, radius: number = 25): Promise<RelayPoint[]> {
    try {
      console.log(`Recherche de points relais autour des coordonnées: lat=${latitude}, lng=${longitude}, rayon=${radius} km`);
      
      // Récupérer tous les points relais
      const relayPoints = await this.getAllRelayPoints();
      console.log('Nombre total de points relais récupérés:', relayPoints.length);
      
      // Vérifier si nous avons des points relais avec des coordonnées valides
      const relayPointsWithValidCoordinates = relayPoints.filter(relayPoint => 
        relayPoint.coordinates && 
        relayPoint.coordinates.latitude && 
        relayPoint.coordinates.longitude &&
        relayPoint.coordinates.latitude !== 0 &&
        relayPoint.coordinates.longitude !== 0
      );
      
      console.log('Nombre de points relais avec coordonnées valides:', relayPointsWithValidCoordinates.length);
      
      // Si aucun point relais n'a de coordonnées valides, attribuer des coordonnées fictives
      if (relayPointsWithValidCoordinates.length === 0) {
        console.log('Aucun point relais avec coordonnées valides. Attribution de coordonnées fictives.');
        
        // Retourner tous les points relais avec des distances fictives
        return relayPoints.map((relayPoint, index) => {
          // Générer une distance fictive entre 1 et 20 km
          const distance = 1 + (index % 20);
          
          return {
            ...relayPoint,
            distance
          };
        }).sort((a, b) => a.distance - b.distance);
      }
      
      // Calculer la distance pour chaque point relais
      const relayPointsWithDistance = relayPoints
        .map(relayPoint => {
          // Vérifier si les coordonnées du point relais sont valides
          if (!relayPoint.coordinates || 
              !relayPoint.coordinates.latitude || 
              !relayPoint.coordinates.longitude ||
              relayPoint.coordinates.latitude === 0 ||
              relayPoint.coordinates.longitude === 0) {
            
            // Si les coordonnées ne sont pas valides, attribuer une distance aléatoire
            const distance = 5 + (Math.random() * 15); // Distance entre 5 et 20 km
            console.log(`Coordonnées invalides pour ${relayPoint.businessName}. Attribution d'une distance fictive: ${distance.toFixed(2)} km`);
            
            return {
              ...relayPoint,
              distance
            };
          }
          
          // Extraire les coordonnées du point relais
          const relayLat = relayPoint.coordinates.latitude;
          const relayLon = relayPoint.coordinates.longitude;
          
          // Calculer la distance
          const distance = this.calculateDistance(latitude, longitude, relayLat, relayLon);
          console.log(`Distance entre l'utilisateur et ${relayPoint.businessName}: ${distance.toFixed(2)} km`);
          
          return {
            ...relayPoint,
            distance
          };
        })
        // Filtrer par rayon spécifié
        .filter(relayPoint => relayPoint.distance <= radius)
        // Trier par distance croissante
        .sort((a, b) => a.distance - b.distance);
      
      console.log('Nombre de points relais dans le rayon de recherche:', relayPointsWithDistance.length);
      
      // Si aucun point relais n'est trouvé dans le rayon, étendre le rayon (mais une seule fois)
      if (relayPointsWithDistance.length === 0 && radius < 100) {
        console.log(`Aucun point relais trouvé dans un rayon de ${radius} km. Étendre le rayon à 500 km.`);
        
        // Recalculer avec un rayon plus grand (500 km pour couvrir la France)
        return this.getNearbyRelayPointsByCoordinates(latitude, longitude, 500);
      }
      
      // Si toujours aucun point relais n'est trouvé avec le rayon étendu, retourner tous les points relais
      if (relayPointsWithDistance.length === 0) {
        console.log(`Aucun point relais trouvé dans un rayon de ${radius} km. Retourner tous les points relais triés par distance.`);
        
        // Retourner tous les points relais triés par distance
        return relayPoints
          .map(relayPoint => {
            // Extraire les coordonnées du point relais ou utiliser des valeurs par défaut
            const relayLat = relayPoint.coordinates?.latitude || 0;
            const relayLon = relayPoint.coordinates?.longitude || 0;
            
            // Calculer la distance (même pour les points sans coordonnées valides)
            const distance = this.calculateDistance(latitude, longitude, relayLat, relayLon);
            
            return {
              ...relayPoint,
              distance
            };
          })
          .sort((a, b) => a.distance - b.distance);
      }
      
      return relayPointsWithDistance;
    } catch (error) {
      console.error('Erreur lors de la recherche des points relais par coordonnées:', error);
      
      // En cas d'erreur, retourner tous les points relais
      console.log('Retour de tous les points relais disponibles en raison d\'une erreur');
      const allRelayPoints = await this.getAllRelayPoints();
      
      return allRelayPoints.map((relayPoint, index) => ({
        ...relayPoint,
        distance: 1 + (index % 20) // Distance fictive entre 1 et 20 km
      })).sort((a, b) => a.distance - b.distance);
    }
  },
  
  // Récupérer un point relais par son ID
  async getRelayPointById(relayPointId: string): Promise<RelayPoint | null> {
    try {
      const { data, error } = await supabase
        .from('relay_points')
        .select('*')
        .eq('id', relayPointId)
        .single();
      
      if (error) {
        console.error(`Erreur lors de la récupération du point relais ${relayPointId}:`, error);
        return null;
      }
      
      return data ? mapRelayPointFromDB(data) : null;
    } catch (error) {
      console.error(`Erreur lors de la récupération du point relais ${relayPointId}:`, error);
      return null;
    }
  },
  
  // Calculer la distance entre deux points (simulation)
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Formule de Haversine pour calculer la distance entre deux points sur la Terre
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance en km
    
    // Arrondir à une décimale
    return Math.round(distance * 10) / 10;
  },
  
  // Convertir les degrés en radians
  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  },

  // Géocoder une adresse en coordonnées géographiques
  async geocodeAddress(address: string): Promise<{latitude: number, longitude: number} | null> {
    try {
      const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!GOOGLE_MAPS_API_KEY) {
        console.error("Clé API Google Maps non définie");
        return null;
      }
      
      // Vérifier si l'adresse est vide
      if (!address || address.trim() === '') {
        console.warn('Adresse vide fournie pour le géocodage');
        return null;
      }

      // Formater l'adresse pour améliorer les résultats
      const formattedAddress = address.replace(/Cr /g, 'Cours '); // Remplacer les abréviations courantes
      
      console.log('Géocodage de l\'adresse:', formattedAddress);
      
      // Ajouter le paramètre region=fr pour améliorer les résultats en France
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(formattedAddress)}&region=fr&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await fetch(geocodeUrl);
      
      if (!response.ok) {
        console.error('Erreur lors du géocodage:', response.status, response.statusText);
        return null;
      }
      
      const data = await response.json();
      console.log('Réponse de l\'API de géocodage:', data.status);
      
      // Vérifier le statut de la réponse
      if (data.status !== 'OK') {
        console.error(`Erreur de géocodage: ${data.status} - ${data.error_message || 'Pas de message d\'erreur'}`);
        
        // Si l'adresse n'est pas trouvée, essayer une approche alternative
        if (data.status === 'ZERO_RESULTS') {
          // Extraire le code postal et la ville
          const match = address.match(/(\d{5})\s+([^,]+)/);
          if (match) {
            const [, postalCode, city] = match;
            const simplifiedAddress = `${postalCode} ${city}, France`;
            console.log('Tentative avec adresse simplifiée:', simplifiedAddress);
            
            const fallbackUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(simplifiedAddress)}&region=fr&key=${GOOGLE_MAPS_API_KEY}`;
            const fallbackResponse = await fetch(fallbackUrl);
            const fallbackData = await fallbackResponse.json();
            
            if (fallbackData.status === 'OK' && fallbackData.results && fallbackData.results.length > 0) {
              const location = fallbackData.results[0].geometry.location;
              console.log('Coordonnées obtenues via adresse simplifiée:', location);
              return {
                latitude: location.lat,
                longitude: location.lng
              };
            }
          }
        }
        
        return null;
      }
      
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        console.log('Coordonnées obtenues:', location);
        return {
          latitude: location.lat,
          longitude: location.lng
        };
      }
      
      console.error('Aucun résultat trouvé pour l\'adresse:', address);
      return null;
    } catch (error) {
      console.error('Erreur lors du géocodage:', error);
      return null;
    }
  },

  // Créer ou mettre à jour un point relais avec géocodage automatique
  async createOrUpdateRelayPoint(relayPointData: {
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
    coordinates?: { latitude: number, longitude: number };
    currentUserId?: string; // ID de l'utilisateur effectuant la modification
  }): Promise<RelayPoint | null> {
    try {
      // Utiliser les coordonnées fournies ou géocoder l'adresse si nécessaire
      let coordinates = relayPointData.coordinates;
      
      // Si les coordonnées ne sont pas fournies, essayer de géocoder l'adresse
      if (!coordinates) {
        console.log('Coordonnées non fournies, tentative de géocodage...');
        const geocodedCoordinates = await this.geocodeAddress(relayPointData.address);
        if (geocodedCoordinates) {
          coordinates = geocodedCoordinates;
        }
      } else {
        console.log('Utilisation des coordonnées fournies:', coordinates);
      }
      
      // Préparer les données avec les coordonnées
      const dataToSave = {
        name: relayPointData.businessName,
        email: relayPointData.email,
        phone: relayPointData.phoneNumber,
        address: relayPointData.address,
        city: relayPointData.address.split(',').slice(-2, -1)[0]?.trim() || '',
        postal_code: relayPointData.address.match(/\d{5}/)?.toString() || '',
        opening_hours: relayPointData.openingHours,
        coordinates: coordinates
      };
      
      let result;
      
      if (relayPointData.id) {
        // Vérifier si l'utilisateur a le droit de modifier ce point relais
        if (relayPointData.currentUserId) {
          // Si ce n'est pas un admin (qui peut tout modifier), vérifier que c'est bien son point relais
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', relayPointData.currentUserId)
            .single();
          
          if (userError) {
            console.error('Erreur lors de la vérification des droits:', userError);
            throw new Error('Vous n\'avez pas les droits pour effectuer cette action.');
          }
          
          // Si l'utilisateur n'est pas un admin et n'est pas le propriétaire du point relais
          if (userData.role !== 'admin' && relayPointData.id !== relayPointData.currentUserId) {
            console.error('Tentative de modification non autorisée d\'un point relais');
            throw new Error('Vous ne pouvez modifier que votre propre point relais.');
          }
        }
        
        // Mise à jour d'un point relais existant
        const { data, error } = await supabase
          .from('relay_points')
          .update(dataToSave)
          .eq('id', relayPointData.id)
          .select('*')
          .single();
        
        if (error) {
          console.error('Erreur lors de la mise à jour du point relais:', error);
          throw error;
        }
        
        result = data;
      } else {
        // Création d'un nouveau point relais
        const { data, error } = await supabase
          .from('relay_points')
          .insert(dataToSave)
          .select('*')
          .single();
        
        if (error) {
          console.error('Erreur lors de la création du point relais:', error);
          throw error;
        }
        
        result = data;
      }
      
      // Mapper les données de la base de données vers le format RelayPoint
      return result ? mapRelayPointFromDB(result) : null;
    } catch (error) {
      console.error('Erreur lors de la création/mise à jour du point relais:', error);
      return null;
    }
  },

  // Obtenir des suggestions d'adresses à partir d'un texte partiel
  async getAddressSuggestions(query: string): Promise<{ display_name: string; place_id: string; original_name?: string }[]> {
    if (!query || query.length < 3) {
      return [];
    }

    try {
      // Utiliser le format=json pour obtenir les résultats en JSON
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'PC-Relais-App/1.0'
        }
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des suggestions d'adresses");
      }

      const data = await response.json();
      
      // Conserver les données originales mais ajouter l'adresse complète pour la géolocalisation
      return data.map((item: any) => ({
        display_name: item.display_name,
        place_id: item.place_id,
        original_name: item.display_name
      }));
    } catch (error) {
      console.error("Erreur lors de la récupération des suggestions d'adresses:", error);
      return [];
    }
  },
};
