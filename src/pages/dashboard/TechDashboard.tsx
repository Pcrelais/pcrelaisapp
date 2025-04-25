import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, BarChart, ArrowUpDown, Clock, CheckCircle, PenTool as Tool, Calendar, Package, ClipboardList, MessageSquare, Settings, Info, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { technicianService } from '../../services/technicianService';

// Types
interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface TechRepairRequest {
  id: string;
  brand: string;
  model: string;
  problemDescription: string;
  statusId: string | number; // Peut être une chaîne ou un nombre selon les données de Supabase
  statusName?: string;
  statusLabel?: string;
  clientName?: string;
  estimatedCost?: number;
  createdAt: string;
  updatedAt: string;
  relayName?: string;
  technicianAssigned?: boolean;
}

const TechDashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [repairs, setRepairs] = useState<TechRepairRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalRepairs: 0,
    inProgressRepairs: 0,
    completedRepairs: 0,
    averageCompletionTime: 0,
  });
  const [todaysRepairs, setTodaysRepairs] = useState<TechRepairRequest[]>([]);
  const [completedRepairs, setCompletedRepairs] = useState<TechRepairRequest[]>([]);

  useEffect(() => {
    const fetchTechnicianData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!user?.id) {
          throw new Error('Utilisateur non authentifié');
        }

        // Fetch repair requests assigned to the technician
        const repairs = await technicianService.getTechnicianRepairs(user.id);
        
        // Débogage : afficher les réparations et leurs codes de statut
        console.log('Toutes les réparations:', repairs);
        console.log('Codes de statut disponibles:', [...new Set(repairs.map(r => r.statusCode))]);
        console.log('Réparations à diagnostiquer:', repairs.filter(r => r.statusCode === 'WAITING_DIAGNOSTIC'));
        
        // Process data for dashboard
        const today = new Date().toISOString().split('T')[0];
        
        // Filter repairs for today
        const todaysRepairsData = repairs.filter(repair => {
          // Vérifier si la réparation est d'aujourd'hui ou en cours
          const isToday = repair.createdAt.split('T')[0] === today;
          const isInProgress = repair.statusCode === 'IN_PROGRESS' || repair.statusCode === 'PICKED_UP_BY_TECHNICIAN';
          const needsDiagnostic = repair.statusCode === 'WAITING_DIAGNOSTIC';
          return isToday || isInProgress || needsDiagnostic;
        });
        
        // Filter completed repairs
        const completedRepairsData = repairs.filter(repair => {
          // Vérifier si la réparation est terminée
          const isCompleted = repair.statusCode === 'COMPLETED' || repair.statusCode === 'RETURNED_TO_RELAY';
          return isCompleted;
        }).slice(0, 5); // Show only 5 most recent
        
        // Calculate stats
        const statsData = {
          totalRepairs: repairs.length,
          inProgressRepairs: repairs.filter(repair => 
            repair.statusCode === 'IN_PROGRESS' || 
            repair.statusCode === 'PICKED_UP_BY_TECHNICIAN' || 
            repair.statusCode === 'WAITING_DIAGNOSTIC'
          ).length,
          completedRepairs: repairs.filter(repair => 
            repair.statusCode === 'COMPLETED' || 
            repair.statusCode === 'RETURNED_TO_RELAY'
          ).length,
          averageCompletionTime: calculateAverageCompletionTime(repairs),
        };
        
        // Fetch notifications (placeholder for now - would be replaced with actual API call)
        const notificationsData: Notification[] = [
          {
            id: '1',
            title: 'Nouvelle réparation assignée',
            message: 'Une nouvelle réparation de MacBook Pro a été assignée à vous.',
            timestamp: new Date().toISOString(),
            isRead: false,
            type: 'info',
          },
          {
            id: '2',
            title: 'Réparation terminée',
            message: 'La réparation #1234 a été marquée comme terminée.',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            isRead: true,
            type: 'success',
          },
        ];
        
        setRepairs(repairs);
        setTodaysRepairs(todaysRepairsData);
        setCompletedRepairs(completedRepairsData);
        setStats(statsData);
        setNotifications(notificationsData);
      } catch (err) {
        console.error('Error fetching technician data:', err);
        setError('Erreur lors du chargement des données. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicianData();
  }, [user]);
  
  const filteredRequests = repairs.filter(request => 
    searchTerm === '' || (
      (request.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };
  
  // Helper function to calculate average completion time in days
  const calculateAverageCompletionTime = (repairs: TechRepairRequest[]) => {
    const completedRepairs = repairs.filter(repair => repair.statusId === 3);
    if (completedRepairs.length === 0) return 0;
    
    const totalDays = completedRepairs.reduce((sum, repair) => {
      const startDate = new Date(repair.createdAt);
      const endDate = new Date(repair.updatedAt);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);
    
    return Math.round(totalDays / completedRepairs.length);
  };
  
  const renderStatusBadge = (status: string, label: string) => {
    switch (status) {
      case 'waiting_for_parts':
        return <Badge variant="warning">{label || 'En attente de pièces'}</Badge>;
      case 'in_progress':
        return <Badge variant="primary">{label || 'En cours'}</Badge>;
      case 'completed':
        return <Badge variant="success">{label || 'Terminée'}</Badge>;
      case 'cancelled':
        return <Badge variant="error">{label || 'Annulée'}</Badge>;
      default:
        return <Badge variant="default">{label || status}</Badge>;
    }
  };
  
  const renderPriorityBadge = (priority: string = 'medium') => {
    const priorityColors: Record<string, string> = {
      low: 'default',
      medium: 'warning',
      high: 'error',
    };
    
    const priorityLabels: Record<string, string> = {
      low: 'Basse',
      medium: 'Moyenne',
      high: 'Haute',
    };
    
    return (
      <Badge variant={priorityColors[priority] as any} size="sm">
        {priorityLabels[priority]}
      </Badge>
    );
  };
  
  // Note: todaysRepairs et completedRepairs sont déjà définis dans le state
  // et sont mis à jour dans le useEffect
  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Technicien</h1>
          <p className="text-gray-600 mt-1">
            Gérez vos réparations en cours et consultez les diagnostics
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <Link to="/tech/work-orders">
            <Button variant="outline" icon={<ClipboardList className="h-5 w-5" />}>
              Ordres de travail
            </Button>
          </Link>
          <Link to="/tech/repair-new">
            <Button variant="primary" icon={<Tool className="h-5 w-5" />}>
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <Card.Content className="p-6 text-center">
            {loading ? (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-warning/10 text-warning mb-4">
                  <Clock className="h-6 w-6" />
                </div>
                <div className="text-2xl font-bold">{stats.totalRepairs - stats.inProgressRepairs - stats.completedRepairs}</div>
                <div className="text-gray-600 text-sm mt-1">À diagnostiquer</div>
              </>
            )}
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="p-6 text-center">
            {loading ? (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                  <Tool className="h-6 w-6" />
                </div>
                <div className="text-2xl font-bold">{stats.inProgressRepairs}</div>
                <div className="text-gray-600 text-sm mt-1">En réparation</div>
              </>
            )}
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="p-6 text-center">
            {loading ? (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success/10 text-success mb-4">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div className="text-2xl font-bold">{stats.completedRepairs}</div>
                <div className="text-gray-600 text-sm mt-1">Réparés</div>
              </>
            )}
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="p-6 text-center">
            {loading ? (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary/10 text-secondary mb-4">
                  <BarChart className="h-6 w-6" />
                </div>
                <div className="text-2xl font-bold">{stats.averageCompletionTime} jours</div>
                <div className="text-gray-600 text-sm mt-1">Temps moyen</div>
              </>
            )}
          </Card.Content>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <Card.Header className="flex justify-between items-center">
            <Card.Title>Réparations en cours</Card.Title>
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
              placeholder="Rechercher un client ou un appareil..."
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
                      Réf.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Appareil
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priorité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.filter(r => r.technicianAssigned && r.statusName !== 'completed').length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        Aucune réparation trouvée.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests
                      .filter((r) => r.technicianAssigned && r.statusName !== 'completed')
                      .map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                <Package className="h-5 w-5 text-gray-500" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{request.brand} {request.model}</div>
                                <div className="text-xs text-gray-500">Appareil électronique</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {request.clientName || 'Client inconnu'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            <div>{request.brand} {request.model}</div>
                            <div className="text-xs text-gray-500">Appareil électronique</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {renderStatusBadge(request.statusName || '', request.statusLabel || '')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {renderPriorityBadge('medium')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {formatDate(request.updatedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link to={`/tech/repair/${request.id}`} className="text-primary hover:text-primary-dark">
                              Traiter
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

          <Card>
            <Card.Header>
              <Card.Title>Actions rapides</Card.Title>
            </Card.Header>
            <Card.Content className="space-y-4">
              <Link to="/tech/repair-new" className="flex items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Tool className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <div className="font-medium">Nouvelle réparation</div>
                  <div className="text-sm text-gray-500">Créer un dossier de réparation</div>
                </div>
              </Link>
              <Link to="/tech/inventory" className="flex items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <div className="font-medium">Inventaire</div>
                  <div className="text-sm text-gray-500">Gérer les pièces et composants</div>
                </div>
              </Link>
              <Link to="/tech/chats" className="flex items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="bg-primary/10 p-2 rounded-full">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <div className="font-medium">Conversations clients</div>
                  <div className="text-sm text-gray-500">Répondre aux messages</div>
                </div>
              </Link>
              <Link to="/tech/settings" className="flex items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <div className="font-medium">Paramètres</div>
                  <div className="text-sm text-gray-500">Configurer votre espace</div>
                </div>
              </Link>
            </Card.Content>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>Réparations pour aujourd'hui</Card.Title>
          </Card.Header>
          {loading ? (
            <Card.Content className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </Card.Content>
          ) : todaysRepairs.length === 0 ? (
            <Card.Content className="text-center py-8">
              <Calendar className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Aucune réparation prévue pour aujourd'hui</p>
            </Card.Content>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Appareil
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Problème
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
                  {todaysRepairs.map((repair) => (
                    <tr key={repair.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {repair.brand} {repair.model}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="truncate max-w-[200px]">{repair.problemDescription}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderStatusBadge(repair.statusName || '', repair.statusLabel || '')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link 
                          to={`/tech/repair/${repair.id}`}
                          className="text-primary hover:text-primary-dark"
                        >
                          Traiter
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        
        <Card>
          <Card.Header>
            <Card.Title>Réparations récemment terminées</Card.Title>
          </Card.Header>
          {loading ? (
            <Card.Content className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </Card.Content>
          ) : completedRepairs.length === 0 ? (
            <Card.Content className="text-center py-8">
              <CheckCircle className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Aucune réparation terminée récemment</p>
            </Card.Content>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Appareil
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coût
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {completedRepairs.map((repair) => (
                    <tr key={repair.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {repair.brand} {repair.model}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {repair.clientName || 'Client inconnu'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                        {repair.estimatedCost ? `${repair.estimatedCost} €` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                        {formatDate(repair.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TechDashboard;