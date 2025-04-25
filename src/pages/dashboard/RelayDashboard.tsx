import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { relayOperationService } from '../../services/relayOperationService';
import { notificationService } from '../../services/notificationService';
import { RepairRequest, Notification } from '../../types';

// Composants modulaires du tableau de bord
import DashboardStats from '../../components/dashboard/DashboardStats';
import QuickActions from '../../components/dashboard/QuickActions';
import AlertMessages from '../../components/dashboard/AlertMessages';
import SearchAndFilters from '../../components/dashboard/SearchAndFilters';

// Étendre le type RepairRequest pour inclure les propriétés spécifiques au point relais
interface RelayRepairRequest extends RepairRequest {
  clientName?: string;
  statusName?: string;
  statusLabel?: string;
  operation?: 'dropOff' | 'pickup' | 'transit';
  expectedArrival?: string;
  drop_off_date?: string; // Date de dépôt de l'appareil
}

const RelayDashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [repairs, setRepairs] = useState<RelayRepairRequest[]>([]);
  // Cette variable est mise à jour mais n'est pas lue dans le composant actuel
  // Elle pourrait être utilisée pour afficher les notifications dans une future mise à jour
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dropOffs' | 'pickups' | 'transit' | 'all'>('all');
  const [stats, setStats] = useState({
    pendingDropOffs: 0,
    readyForPickup: 0,
    inTransit: 0,
    completedThisMonth: 0
  });
  
  // Charger les données au montage du composant
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Charger les réparations du point relais
        const repairsData = await relayOperationService.getRelayRepairs(user.id);
        setRepairs(repairsData);
        
        // Charger les statistiques
        const statsData = await relayOperationService.getRelayStats(user.id);
        setStats(statsData);
        
        // Charger les notifications non lues
        const notificationsData = await notificationService.getUnreadNotifications(user.id);
        setNotifications(notificationsData);
        
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
  
  const filteredRequests = repairs.filter(request => 
    (request.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.deviceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.id?.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };
  
  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const renderStatusBadge = (statusName: string, statusLabel: string) => {
    const statusColors: Record<string, string> = {
      pending: 'warning',
      received: 'primary',
      diagnosed: 'warning',
      inRepair: 'primary',
      repaired: 'success',
      readyForPickup: 'success',
      completed: 'success',
      cancelled: 'error',
    };
    
    return (
      <Badge 
        variant={statusColors[statusName] as any || 'default'}
        className="whitespace-nowrap"
      >
        {statusLabel}
      </Badge>
    );
  };
  
  // Fonction pour traiter un dépôt d'appareil
  const handleProcessDropOff = async (repairId: string) => {
    if (!user) return;
    
    setProcessingId(repairId);
    setError(null);
    setSuccessMessage(null);
    
    try {
      await relayOperationService.processDropOff(repairId);
      
      // Mettre à jour les données localement
      const updatedRepairs = repairs.map(repair => {
        if (repair.id === repairId) {
          return {
            ...repair,
            statusName: 'received',
            statusLabel: 'Reçu',
            operation: 'transit' as const // Typage explicite comme valeur littérale
          };
        }
        return repair;
      });
      
      setRepairs(updatedRepairs);
      setSuccessMessage('Dépôt traité avec succès. L\'appareil a été marqué comme reçu.');
      
      // Mettre à jour les statistiques
      setStats(prev => ({
        ...prev,
        pendingDropOffs: prev.pendingDropOffs - 1,
        inTransit: prev.inTransit + 1
      }));
    } catch (err: any) {
      console.error('Erreur lors du traitement du dépôt:', err);
      setError(err.message || 'Erreur lors du traitement du dépôt. Veuillez réessayer.');
    } finally {
      setProcessingId(null);
    }
  };
  
  // Fonction pour traiter une récupération d'appareil
  const handleProcessPickup = async (repairId: string) => {
    if (!user) return;
    
    setProcessingId(repairId);
    setError(null);
    setSuccessMessage(null);
    
    try {
      await relayOperationService.processPickup(repairId);
      
      // Mettre à jour les données localement
      const updatedRepairs = repairs.map(repair => {
        if (repair.id === repairId) {
          return {
            ...repair,
            statusName: 'completed',
            statusLabel: 'Terminé',
            operation: undefined
          };
        }
        return repair;
      });
      
      setRepairs(updatedRepairs);
      setSuccessMessage('Récupération traitée avec succès. La réparation a été marquée comme terminée.');
      
      // Mettre à jour les statistiques
      setStats(prev => ({
        ...prev,
        readyForPickup: prev.readyForPickup - 1,
        completedThisMonth: prev.completedThisMonth + 1
      }));
    } catch (err: any) {
      console.error('Erreur lors du traitement de la récupération:', err);
      setError(err.message || 'Erreur lors du traitement de la récupération. Veuillez réessayer.');
    } finally {
      setProcessingId(null);
    }
  };
  
  // Fonction pour afficher le contenu en fonction de l'onglet actif
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dropOffs':
        return renderPendingDropOffs();
      case 'pickups':
        return renderReadyForPickups();
      case 'transit':
        return renderInTransit();
      case 'all':
      default:
        return (
          <>
            {renderPendingDropOffs()}
            {renderReadyForPickups()}
            {renderInTransit()}
          </>
        );
    }
  };
  
  // Fonction pour rendre les dépôts en attente
  const renderPendingDropOffs = () => {
    const pendingDropOffs = filteredRequests.filter(request => request.operation === 'dropOff');
    
    if (pendingDropOffs.length === 0 && activeTab === 'dropOffs') {
      return (
        <div className="p-6 text-center text-gray-500">
          Aucun dépôt en attente pour le moment.
        </div>
      );
    }
    
    if (pendingDropOffs.length === 0) {
      return null;
    }
    
    return (
      <div className="overflow-hidden">
        {activeTab === 'all' && (
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="text-md font-medium text-gray-700">Dépôts en attente ({pendingDropOffs.length})</h3>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client / Appareil
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date prévue
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingDropOffs.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">{request.clientName}</div>
                      <div className="text-sm text-gray-500">{request.brand} {request.model}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      {renderStatusBadge(request.statusName || '', request.statusLabel || '')}
                      <span className="text-xs text-gray-500 mt-1">Dépôt prévu</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {request.expectedArrival ? formatDateTime(request.expectedArrival) : formatDate(request.updatedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleProcessDropOff(request.id)}
                        disabled={processingId === request.id}
                        className="whitespace-nowrap"
                      >
                        {processingId === request.id ? 'Traitement...' : 'Traiter le dépôt'}
                      </Button>
                      <Link 
                        to={`/relay/repair/${request.id}`}
                        className="text-primary hover:text-primary-dark inline-flex items-center"
                      >
                        Détails
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // Fonction pour rendre les appareils prêts pour récupération
  const renderReadyForPickups = () => {
    const readyForPickups = filteredRequests.filter(request => request.operation === 'pickup');
    
    if (readyForPickups.length === 0 && activeTab === 'pickups') {
      return (
        <div className="p-6 text-center text-gray-500">
          Aucun appareil prêt pour récupération pour le moment.
        </div>
      );
    }
    
    if (readyForPickups.length === 0) {
      return null;
    }
    
    return (
      <div className="overflow-hidden">
        {activeTab === 'all' && (
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="text-md font-medium text-gray-700">Prêts pour récupération ({readyForPickups.length})</h3>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client / Appareil
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prêt depuis
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {readyForPickups.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">{request.clientName}</div>
                      <div className="text-sm text-gray-500">{request.brand} {request.model}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      {renderStatusBadge(request.statusName || '', request.statusLabel || '')}
                      <span className="text-xs text-gray-500 mt-1">En attente de récupération</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatDate(request.updatedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleProcessPickup(request.id)}
                        disabled={processingId === request.id}
                        className="whitespace-nowrap"
                      >
                        {processingId === request.id ? 'Traitement...' : 'Confirmer la récupération'}
                      </Button>
                      <Link 
                        to={`/relay/repair/${request.id}`}
                        className="text-primary hover:text-primary-dark inline-flex items-center"
                      >
                        Détails
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // Fonction pour rendre les appareils en transit
  const renderInTransit = () => {
    const inTransit = filteredRequests.filter(request => request.operation === 'transit');
    
    if (inTransit.length === 0 && activeTab === 'transit') {
      return (
        <div className="p-6 text-center text-gray-500">
          Aucun appareil en transit pour le moment.
        </div>
      );
    }
    
    if (inTransit.length === 0) {
      return null;
    }
    
    return (
      <div className="overflow-hidden">
        {activeTab === 'all' && (
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="text-md font-medium text-gray-700">En transit ({inTransit.length})</h3>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client / Appareil
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reçu le
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inTransit.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">{request.clientName}</div>
                      <div className="text-sm text-gray-500">{request.brand} {request.model}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      {renderStatusBadge(request.statusName || '', request.statusLabel || '')}
                      <span className="text-xs text-gray-500 mt-1">En cours de traitement</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {request.drop_off_date ? formatDateTime(request.drop_off_date) : formatDate(request.updatedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link 
                      to={`/relay/repair/${request.id}`}
                      className="text-primary hover:text-primary-dark"
                    >
                      Détails
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container-app py-8">
      {/* En-tête du tableau de bord */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Tableau de bord du point relais</h1>
        <p className="text-gray-600">Bienvenue, {user?.firstName}. Gérez vos opérations et suivez vos statistiques.</p>
      </div>
      
      {/* Cartes de statistiques */}
      <DashboardStats 
        pendingDropOffs={stats.pendingDropOffs}
        readyForPickup={stats.readyForPickup}
        inTransit={stats.inTransit}
        completedThisMonth={stats.completedThisMonth}
      />
      
      {/* Actions rapides */}
      <QuickActions />
      
      {/* Notifications et messages d'alerte */}
      <AlertMessages 
        successMessage={successMessage}
        errorMessage={error}
        onClearSuccess={() => setSuccessMessage(null)}
        onClearError={() => setError(null)}
      />
      
      {/* Barre de recherche et filtres */}
      <SearchAndFilters 
        searchTerm={searchTerm}
        activeTab={activeTab}
        stats={stats}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
        onTabChange={(tab) => setActiveTab(tab)}
      />
      
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Opérations du point relais</h2>
        </div>
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
            <p className="mt-4 text-gray-500">Chargement des données...</p>
          </div>
        ) : (
          renderTabContent()
        )}
      </div>
    </div>
  );
};

export default RelayDashboard;
