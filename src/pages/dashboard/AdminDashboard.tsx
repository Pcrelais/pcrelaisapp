import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Wrench, Package, MapPin, Settings, PieChart } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseConfig';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRepairs: 0,
    totalRelayPoints: 0,
    totalTechnicians: 0,
    pendingRepairs: 0
  });
  
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Récupérer le nombre total d'utilisateurs
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        // Récupérer le nombre total de réparations
        const { count: repairsCount } = await supabase
          .from('repair_requests')
          .select('*', { count: 'exact', head: true });
        
        // Récupérer le nombre de points relais
        // Vérifier si le rôle est 'relay' ou 'relayPoint' (pour la compatibilité avec les données existantes)
        const { data: relayPoints, error: relayError } = await supabase
          .from('profiles')
          .select('id')
          .or('role.eq.relay,role.eq.relayPoint');
          
        const relayPointsCount = relayPoints ? relayPoints.length : 0;
        
        if (relayError) {
          console.error('Erreur lors de la récupération des points relais:', relayError);
        }
        
        // Récupérer le nombre de techniciens
        const { count: techniciansCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'technician');
        
        // Récupérer le nombre de réparations en attente
        // Récupérer tous les statuts qui correspondent à des réparations en attente
        const { data: pendingStatuses } = await supabase
          .from('repair_statuses')
          .select('id')
          .in('code', ['SUBMITTED', 'RECEIVED', 'TO_DIAGNOSE']);
          
        // Si nous avons des statuts en attente, utiliser leurs IDs pour filtrer les réparations
        let pendingRepairsCount = 0;
        if (pendingStatuses && pendingStatuses.length > 0) {
          const pendingStatusIds = pendingStatuses.map(status => status.id);
          const { count: count } = await supabase
            .from('repair_requests')
            .select('*', { count: 'exact', head: true })
            .in('status_id', pendingStatusIds);
          
          pendingRepairsCount = count || 0;
        }
        
        setStats({
          totalUsers: usersCount || 0,
          totalRepairs: repairsCount || 0,
          totalRelayPoints: relayPointsCount || 0,
          totalTechnicians: techniciansCount || 0,
          pendingRepairs: pendingRepairsCount || 0
        });
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);
  
  const adminModules = [
    {
      title: 'Gestion des utilisateurs',
      description: 'Gérer les comptes utilisateurs, les rôles et les permissions',
      icon: <Users className="h-8 w-8 text-primary" />,
      action: () => navigate('/admin/users')
    },
    {
      title: 'Gestion des réparations',
      description: 'Suivre et gérer toutes les demandes de réparation',
      icon: <Wrench className="h-8 w-8 text-primary" />,
      action: () => navigate('/admin/repairs')
    },
    {
      title: 'Gestion des points relais',
      description: 'Ajouter, modifier ou supprimer des points relais',
      icon: <MapPin className="h-8 w-8 text-primary" />,
      action: () => navigate('/admin/relay-points')
    },
    {
      title: 'Gestion des techniciens',
      description: 'Gérer les techniciens et leurs spécialisations',
      icon: <Users className="h-8 w-8 text-primary" />,
      action: () => navigate('/admin/technicians')
    },
    {
      title: 'Paramètres du système',
      description: 'Configurer les paramètres globaux de l\'application',
      icon: <Settings className="h-8 w-8 text-primary" />,
      action: () => navigate('/admin/settings')
    },
    {
      title: 'Rapports et statistiques',
      description: 'Visualiser les statistiques et générer des rapports',
      icon: <PieChart className="h-8 w-8 text-primary" />,
      action: () => navigate('/admin/reports')
    }
  ];
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tableau de bord administrateur</h1>
        <p className="text-gray-600">
          Bienvenue, {user?.firstName} {user?.lastName}. Gérez votre plateforme PC Relais.
        </p>
      </div>
      
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none">
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total utilisateurs</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? '...' : stats.totalUsers}
                </h3>
              </div>
              <Users className="h-10 w-10 text-blue-500 opacity-80" />
            </div>
          </Card.Content>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-none">
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total réparations</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? '...' : stats.totalRepairs}
                </h3>
              </div>
              <Package className="h-10 w-10 text-green-500 opacity-80" />
            </div>
          </Card.Content>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-none">
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Points relais</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? '...' : stats.totalRelayPoints}
                </h3>
              </div>
              <MapPin className="h-10 w-10 text-purple-500 opacity-80" />
            </div>
          </Card.Content>
        </Card>
      </div>
      
      {/* Modules d'administration */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Modules d'administration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminModules.map((module, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <Card.Content className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    {module.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{module.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{module.description}</p>
                    <Button 
                      variant="outline" 
                      onClick={module.action}
                      className="w-full"
                    >
                      Accéder
                    </Button>
                  </div>
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Réparations récentes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Réparations en attente</h2>
          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {loading ? '...' : stats.pendingRepairs} en attente
          </span>
        </div>
        <Card>
          <Card.Content className="p-6">
            <div className="flex flex-col items-center justify-center py-6">
              <Package className="h-12 w-12 text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Gérer les réparations</h3>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Consultez et gérez toutes les demandes de réparation en cours.
              </p>
              <Button 
                variant="primary" 
                onClick={() => navigate('/admin/repairs')}
              >
                Voir toutes les réparations
              </Button>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
