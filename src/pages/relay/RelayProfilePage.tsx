import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Settings, MapPin, Clock, Phone, Mail, Store, Edit } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { relayPointService } from '../../services/relayPointService';

const RelayProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relayPoint, setRelayPoint] = useState<any>(null);

  useEffect(() => {
    const loadRelayPoint = async () => {
      if (!user || user.role !== 'relayPoint') {
        navigate('/dashboard');
        return;
      }

      try {
        setLoading(true);
        const data = await relayPointService.getRelayPointById(user.id);
        if (data) {
          setRelayPoint(data);
        } else {
          setError('Impossible de charger les informations du point relais.');
        }
      } catch (err) {
        console.error('Erreur lors du chargement du point relais:', err);
        setError('Une erreur est survenue lors du chargement des données.');
      } finally {
        setLoading(false);
      }
    };

    loadRelayPoint();
  }, [user, navigate]);

  // Formater les horaires d'ouverture pour l'affichage
  const formatOpeningHours = (hours: any) => {
    if (!hours) return 'Non spécifiés';

    const days = [
      { id: 'monday', label: 'Lundi' },
      { id: 'tuesday', label: 'Mardi' },
      { id: 'wednesday', label: 'Mercredi' },
      { id: 'thursday', label: 'Jeudi' },
      { id: 'friday', label: 'Vendredi' },
      { id: 'saturday', label: 'Samedi' },
      { id: 'sunday', label: 'Dimanche' },
    ];

    return (
      <div className="space-y-1">
        {days.map((day) => {
          const dayHours = hours[day.id];
          if (!dayHours || (!dayHours.open && !dayHours.close)) {
            return (
              <div key={day.id} className="flex justify-between">
                <span className="font-medium">{day.label}:</span>
                <span className="text-gray-500">Fermé</span>
              </div>
            );
          }
          return (
            <div key={day.id} className="flex justify-between">
              <span className="font-medium">{day.label}:</span>
              <span>{dayHours.open} - {dayHours.close}</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (!user || user.role !== 'relayPoint') {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <Card>
            <Card.Content>
              <div className="p-4 text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès non autorisé</h2>
                <p className="text-gray-600 mb-4">
                  Cette page est réservée aux points relais.
                </p>
                <Button variant="primary" onClick={() => navigate('/dashboard')}>
                  Retour au tableau de bord
                </Button>
              </div>
            </Card.Content>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Profil du point relais</h1>
          <Button 
            variant="outline"
            onClick={() => navigate(`/admin/relay-points/${user.id}/edit`)}
            icon={<Edit className="h-4 w-4 mr-2" />}
          >
            Modifier mes informations
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
            <p className="mt-4 text-gray-500">Chargement des informations...</p>
          </div>
        ) : error ? (
          <Card>
            <Card.Content>
              <div className="p-4 text-center">
                <p className="text-error mb-4">{error}</p>
                <Button variant="primary" onClick={() => window.location.reload()}>
                  Réessayer
                </Button>
              </div>
            </Card.Content>
          </Card>
        ) : relayPoint ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <Card.Content className="p-6">
                <div className="flex items-center mb-6">
                  <Store className="h-8 w-8 text-primary mr-3" />
                  <h2 className="text-xl font-semibold">{relayPoint.businessName}</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-700">Adresse</p>
                      <p className="text-gray-600">{relayPoint.address}</p>
                      {relayPoint.coordinates && (
                        <p className="text-sm text-gray-500 mt-1">
                          Coordonnées: {parseFloat(String(relayPoint.coordinates.latitude)).toFixed(6)}, 
                          {parseFloat(String(relayPoint.coordinates.longitude)).toFixed(6)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-700">Email</p>
                      <p className="text-gray-600">{relayPoint.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-700">Téléphone</p>
                      <p className="text-gray-600">{relayPoint.phoneNumber || 'Non spécifié'}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex items-center mb-4">
                      <Settings className="h-5 w-5 text-gray-500 mr-2" />
                      <h3 className="text-lg font-medium text-gray-800">Paramètres du point relais</h3>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">
                        Commission: <span className="font-semibold">{relayPoint.commission || 0}%</span> par réparation
                      </p>
                      <p className="text-sm text-gray-500">
                        Cette commission est appliquée sur chaque réparation traitée par votre point relais.
                      </p>
                    </div>
                  </div>
                </div>
              </Card.Content>
            </Card>

            <Card>
              <Card.Content className="p-6">
                <div className="flex items-center mb-4">
                  <Clock className="h-5 w-5 text-gray-500 mr-2" />
                  <h3 className="text-lg font-medium text-gray-800">Horaires d'ouverture</h3>
                </div>
                
                <div className="mt-3">
                  {formatOpeningHours(relayPoint.openingHours)}
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Ces horaires sont affichés aux clients lorsqu'ils choisissent un point relais pour déposer ou récupérer leur appareil.
                  </p>
                </div>
              </Card.Content>
            </Card>
          </div>
        ) : (
          <Card>
            <Card.Content>
              <div className="p-4 text-center">
                <p className="text-gray-600 mb-4">
                  Aucune information trouvée pour ce point relais.
                </p>
              </div>
            </Card.Content>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default RelayProfilePage;
