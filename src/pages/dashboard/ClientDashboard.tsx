import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Search, Filter, ArrowUpDown, Clock, CheckCircle, AlertCircle, PenTool as Tool, MapPin, Calendar, Info, MessageCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { repairService } from '../../services/repairService';
import { notificationService } from '../../services/notificationService';
import { chatService } from '../../services/chatService';
import { RepairRequest, Notification, RepairStatus } from '../../types';
import { supabase } from '../../lib/supabaseConfig';

const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [repairs, setRepairs] = useState<RepairRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [statuses, setStatuses] = useState<Record<string, RepairStatus>>({});
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Charger les données au montage du composant
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Charger les statuts de réparation
        try {
          const statusesData = await repairService.getRepairStatuses();
          const statusesMap: Record<string, RepairStatus> = {};
          statusesData.forEach(status => {
            statusesMap[status.id] = status;
          });
          setStatuses(statusesMap);
        } catch (statusErr) {
          console.error('Erreur lors du chargement des statuts:', statusErr);
          // Continuer même en cas d'erreur
        }
        
        // Charger les réparations du client avec gestion d'erreur spécifique
        try {
          // Utiliser une requête directe simplifiée pour éviter les problèmes de récursion
          // Sélectionner uniquement les colonnes qui existent dans la table repair_requests
          const { data, error } = await supabase
            .from('repair_requests')
            .select('id, client_id, device_type_id, brand, model, problem_description, status_id, created_at, updated_at')
            .eq('client_id', user.id)
            .order('created_at', { ascending: false });
            
          if (error) {
            console.error('Erreur lors de la récupération des réparations:', error);
          } else {
            // Mapper manuellement les données
            const mappedRepairs = (data || []).map((item: any) => ({
              id: item.id,
              clientId: item.client_id,
              deviceType: item.device_type_id, // Utiliser device_type_id au lieu de device_type
              brand: item.brand,
              model: item.model,
              problemDescription: item.problem_description,
              statusId: item.status_id,
              createdAt: item.created_at,
              updatedAt: item.updated_at,
            }));
            setRepairs(mappedRepairs);
          }
        } catch (repairErr) {
          console.error('Exception lors du chargement des réparations:', repairErr);
        }
        
        // Charger les notifications non lues
        try {
          const notificationsData = await notificationService.getUnreadNotifications(user.id);
          setNotifications(notificationsData);
        } catch (notifErr) {
          console.error('Erreur lors du chargement des notifications:', notifErr);
          // Continuer même en cas d'erreur
        }
        
        // Charger le nombre de messages non lus
        try {
          const unreadCount = await chatService.getUnreadMessagesCount(user.id);
          setUnreadMessagesCount(unreadCount);
        } catch (chatErr) {
          console.error('Erreur lors du chargement des messages non lus:', chatErr);
        }
        
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError('Impossible de charger les données. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user]);
  
  const filteredRequests = repairs.filter(request => {
    const term = searchTerm.toLowerCase();
    return (
      (request.deviceType?.toLowerCase() || '').includes(term) ||
      (request.brand?.toLowerCase() || '').includes(term) ||
      (request.model?.toLowerCase() || '').includes(term) ||
      (request.id?.toLowerCase() || '').includes(term)
    );
  });
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };
  
  const renderStatusBadge = (statusId: string) => {
    const status = statuses[statusId];
    if (!status) return <Badge variant="default">Inconnu</Badge>;
    
    const statusColors: Record<string, string> = {
      pending: 'warning',
      received: 'warning',
      diagnosed: 'warning',
      inRepair: 'primary',
      repaired: 'success',
      readyForPickup: 'success',
      completed: 'success',
      cancelled: 'error',
    };
    
    return (
      <Badge variant={statusColors[status.name] as any || 'default'}>
        {status.label}
      </Badge>
    );
  };
  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600 mt-1">
            Consultez et gérez vos demandes de réparation
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link to="/request-repair">
            <Button variant="primary" icon={<PlusCircle className="h-5 w-5" />}>
              Nouvelle réparation
            </Button>
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="w-full p-4 mb-6 bg-error/10 border border-error/20 rounded-lg text-error">
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <Card.Header className="flex justify-between items-center">
            <Card.Title>Réparations récentes</Card.Title>
            <div className="flex space-x-2">
              <button className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <Filter className="h-4 w-4" />
              </button>
              <button className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <ArrowUpDown className="h-4 w-4" />
              </button>
            </div>
          </Card.Header>
          <div className="px-6 py-4">
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-5 w-5" />}
              fullWidth
            />
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <table className="w-full min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Référence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Appareil
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        Aucune réparation trouvée.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {request.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <div>{request.brand} {request.model}</div>
                          <div className="text-xs text-gray-500">{request.deviceType}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {formatDate(request.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {renderStatusBadge(request.statusId)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link 
                            to={`/repair/${request.id}`}
                            className="text-primary hover:text-primary-dark"
                          >
                            Détails
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <Card.Header>
              <Card.Title>Statistiques</Card.Title>
            </Card.Header>
            <Card.Content>
              {loading ? (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <Clock className="h-6 w-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-semibold">
                      {repairs.filter(r => {
                        const status = statuses[r.statusId];
                        return status && status.name !== 'completed' && status.name !== 'cancelled';
                      }).length}
                    </div>
                    <div className="text-gray-500 text-sm">En cours</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <CheckCircle className="h-6 w-6 text-success mx-auto mb-2" />
                    <div className="text-2xl font-semibold">
                      {repairs.filter(r => {
                        const status = statuses[r.statusId];
                        return status && status.name === 'completed';
                      }).length}
                    </div>
                    <div className="text-gray-500 text-sm">Terminées</div>
                  </div>
                </div>
              )}
            </Card.Content>
          </Card>
          
          <Card>
            <Card.Header className="flex justify-between items-center">
              <Card.Title>Notifications</Card.Title>
              <Link to="/notifications" className="text-sm text-primary">
                Voir tout
              </Link>
            </Card.Header>
            <Card.Content className="p-0">
              {loading ? (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Aucune notification non lue
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div key={notification.id} className={`p-4 ${!notification.isRead ? 'bg-primary/5' : ''}`}>
                      <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                          {notification.type === 'info' && <Info className="h-5 w-5 text-primary" />}
                          {notification.type === 'success' && <CheckCircle className="h-5 w-5 text-success" />}
                          {notification.type === 'warning' && <AlertCircle className="h-5 w-5 text-warning" />}
                          {notification.type === 'error' && <AlertCircle className="h-5 w-5 text-error" />}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="text-sm font-medium text-gray-900">{notification.title}</div>
                          <div className="text-sm text-gray-500 mt-1">{notification.message}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(notification.timestamp).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Content>
          </Card>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>Actions rapides</Card.Title>
          </Card.Header>
          <Card.Content className="space-y-4">
            <Link to="/request-repair" className="flex items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="bg-primary/10 p-2 rounded-full">
                <Tool className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <div className="font-medium">Demander une réparation</div>
                <div className="text-sm text-gray-500">Faire réparer un nouvel appareil</div>
              </div>
            </Link>
            <Link to="/find-relays" className="flex items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="bg-primary/10 p-2 rounded-full">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <div className="font-medium">Trouver un point relais</div>
                <div className="text-sm text-gray-500">Localiser le point relais le plus proche</div>
              </div>
            </Link>
            <Link to="/appointments" className="flex items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="bg-primary/10 p-2 rounded-full">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <div className="font-medium">Rendez-vous</div>
                <div className="text-sm text-gray-500">Gérer vos rendez-vous</div>
              </div>
            </Link>
            {unreadMessagesCount > 0 && (
              <div className="flex items-center p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors border border-primary/20">
                <div className="bg-primary/10 p-2 rounded-full">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4 flex-1">
                  <div className="font-medium flex items-center justify-between">
                    <span>Messages non lus</span>
                    <Badge variant="primary" className="ml-2">{unreadMessagesCount}</Badge>
                  </div>
                  <div className="text-sm text-gray-500">Vous avez des messages non lus</div>
                </div>
              </div>
            )}
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Header>
            <Card.Title>Prochains rendez-vous</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="text-center py-8">
              <Calendar className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Aucun rendez-vous à venir</p>
              <Link to="/appointments" className="mt-4 inline-block text-primary text-sm">
                Planifier un rendez-vous
              </Link>
            </div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Header>
            <Card.Title>Besoin d'aide ?</Card.Title>
          </Card.Header>
          <Card.Content className="space-y-4">
            <p className="text-gray-600 text-sm">
              Notre équipe et notre assistant IA sont là pour vous aider avec toutes vos questions.
            </p>
            <div className="space-y-2">
              {repairs.length > 0 && (
                <Link to={`/chat/${repairs[0].id}`}>
                  <Button variant="primary" fullWidth>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Discuter avec le technicien
                    {unreadMessagesCount > 0 && (
                      <Badge variant="primary" className="ml-2 bg-white text-primary">{unreadMessagesCount}</Badge>
                    )}
                  </Button>
                </Link>
              )}
              <Link to="/support">
                <Button variant="outline" fullWidth>
                  Contacter le support
                </Button>
              </Link>
              <Link to="/faq">
                <Button variant="ghost" fullWidth>
                  Consulter la FAQ
                </Button>
              </Link>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
};

export default ClientDashboard;