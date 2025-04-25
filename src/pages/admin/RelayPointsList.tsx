import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { relayPointService } from '../../services/relayPointService';
import { Edit, MapPin, Plus, Trash } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';

// Type spécifique pour l'affichage des points relais
type RelayPointDisplay = {
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
};

const RelayPointsList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [relayPoints, setRelayPoints] = useState<RelayPointDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadRelayPoints();
  }, []);

  const loadRelayPoints = async () => {
    setLoading(true);
    try {
      if (!user) {
        navigate('/login');
        return;
      }

      // Si c'est un admin, charger tous les points relais
      // Si c'est un point relais, charger uniquement ses propres informations
      if (isAdmin) {
        const points = await relayPointService.getAllRelayPoints();
        setRelayPoints(points as RelayPointDisplay[]);
      } else if (user.role === 'relayPoint') {
        // Pour un point relais, ne charger que ses propres informations
        const point = await relayPointService.getRelayPointById(user.id);
        if (point) {
          setRelayPoints([point as RelayPointDisplay]);
        } else {
          setError('Impossible de charger vos informations');
        }
      } else {
        // Autre rôle non autorisé
        setError('Vous n\'avez pas les droits pour accéder à cette page');
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des points relais:', err);
      setError('Impossible de charger les points relais');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce point relais ?')) {
      try {
        // Implémenter la suppression dans le service
        console.log(`Tentative de suppression du point relais avec l'ID: ${id}`);
        // await relayPointService.deleteRelayPoint(id);
        alert('Fonctionnalité de suppression à implémenter');
        // Recharger la liste
        // loadRelayPoints();
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
        setError('Impossible de supprimer le point relais');
      }
    }
  };

  const formatOpeningHours = (hours: any) => {
    if (!hours || typeof hours !== 'object') return 'Horaires non disponibles';
    
    // Prendre seulement les jours de la semaine (lundi au vendredi)
    const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const weekendDays = ['saturday', 'sunday'];
    
    const formatDay = (day: string, dayData: any) => {
      if (!dayData || !dayData.open || !dayData.close) return null;
      return `${day.charAt(0).toUpperCase() + day.slice(1)}: ${dayData.open}-${dayData.close}`;
    };
    
    const weekHours = weekDays
      .map(day => formatDay(day, hours[day]))
      .filter(Boolean)
      .join(', ');
      
    const weekendHours = weekendDays
      .map(day => formatDay(day, hours[day]))
      .filter(Boolean)
      .join(', ');
    
    return (
      <>
        <div>Semaine: {weekHours || 'Fermé'}</div>
        <div>Weekend: {weekendHours || 'Fermé'}</div>
      </>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{isAdmin ? 'Points Relais' : 'Mon Point Relais'}</h1>
          {isAdmin && (
            <Button
              variant="primary"
              onClick={() => navigate('/admin/relay-points/new')}
            >
              <Plus className="h-5 w-5 mr-2" />
              Ajouter un point relais
            </Button>
          )}
        </div>
        


        {error && (
          <div className="mb-4 p-4 bg-error/10 border border-error/20 rounded-lg text-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : relayPoints.length === 0 ? (
          <Card>
            <Card.Content className="p-8 text-center text-gray-500">
              <p>Aucun point relais trouvé.</p>
              {isAdmin && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate('/admin/relay-points/new')}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Ajouter votre premier point relais
                </Button>
              )}
            </Card.Content>
          </Card>
        ) : (
          <div className="space-y-4">
            {relayPoints.map((relayPoint) => (
              <Card key={relayPoint.id}>
                <Card.Content className="p-6">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900">{relayPoint.businessName}</h2>
                      <div className="flex items-start mt-2">
                        <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                        <p className="text-gray-600">{relayPoint.address}</p>
                      </div>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Contact</h3>
                          <p className="text-gray-700">{relayPoint.email}</p>
                          <p className="text-gray-700">{relayPoint.phoneNumber}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Horaires</h3>
                          <div className="text-gray-700 text-sm">
                            {formatOpeningHours(relayPoint.openingHours)}
                          </div>
                        </div>
                      </div>
                      {relayPoint.coordinates && (
                        <div className="mt-2 text-xs text-gray-500">
                          Coordonnées: {relayPoint.coordinates.latitude.toFixed(6)}, {relayPoint.coordinates.longitude.toFixed(6)}
                        </div>
                      )}
                    </div>
                    <div className="flex mt-4 md:mt-0 space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/relay-points/edit/${relayPoint.id}`)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-error hover:bg-error/10"
                          onClick={() => handleDelete(relayPoint.id)}
                        >
                          <Trash className="h-4 w-4 mr-1" />
                          Supprimer
                        </Button>
                      )}
                    </div>
                  </div>
                </Card.Content>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RelayPointsList;
