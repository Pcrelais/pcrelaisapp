import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Eye, 
  MapPin, 
  Wrench,
  AlertCircle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import { supabase } from '../../lib/supabaseConfig';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

interface RepairStatus {
  id: string;
  code: string;
  name: string;
  color?: string;
}

interface RepairRequest {
  id: string;
  code: string;
  device_type: string;
  device_brand: string;
  device_model: string;
  issue_description: string;
  client_id: string;
  client_first_name?: string;
  client_last_name?: string;
  client_email?: string;
  status_id: string;
  status?: RepairStatus;
  technician_id?: string;
  technician_first_name?: string;
  technician_last_name?: string;
  drop_off_relay_id?: string;
  drop_off_relay_name?: string;
  pickup_relay_id?: string;
  pickup_relay_name?: string;
  created_at: string;
  updated_at: string;
}

const RepairsListPage: React.FC = () => {
  const { } = useAuth(); // On n'utilise pas user pour l'instant
  const navigate = useNavigate();
  
  const [repairs, setRepairs] = useState<RepairRequest[]>([]);
  const [filteredRepairs, setFilteredRepairs] = useState<RepairRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [statuses, setStatuses] = useState<RepairStatus[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  
  useEffect(() => {
    fetchRepairs();
    fetchStatuses();
  }, []);
  
  useEffect(() => {
    filterRepairs();
  }, [searchTerm, selectedStatus, repairs]);
  
  const fetchStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from('repair_statuses')
        .select('*')
        .order('id');
      
      if (error) throw error;
      
      if (data) {
        // Ajouter des couleurs pour les statuts
        const statusesWithColors = data.map(status => {
          let color;
          switch (status.code) {
            case 'SUBMITTED':
              color = 'blue';
              break;
            case 'RECEIVED':
              color = 'purple';
              break;
            case 'TO_DIAGNOSE':
              color = 'pink';
              break;
            case 'IN_REPAIR':
              color = 'orange';
              break;
            case 'REPAIRED':
              color = 'teal';
              break;
            case 'READY_FOR_PICKUP':
              color = 'indigo';
              break;
            case 'COMPLETED':
              color = 'green';
              break;
            case 'CANCELLED':
              color = 'red';
              break;
            default:
              color = 'gray';
          }
          return { ...status, color };
        });
        
        setStatuses(statusesWithColors);
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération des statuts:', error);
    }
  };
  
  const fetchRepairs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Récupérer les réparations de base
      const { data: repairsData, error: repairsError } = await supabase
        .from('repair_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (repairsError) throw repairsError;
      
      if (!repairsData) {
        setRepairs([]);
        return;
      }
      
      // Enrichir les données avec les informations des relations
      const enrichedRepairs: RepairRequest[] = [];
      
      for (const repair of repairsData) {
        // Récupérer le statut
        const { data: statusData } = await supabase
          .from('repair_statuses')
          .select('*')
          .eq('id', repair.status_id)
          .maybeSingle();
        
        // Récupérer le client
        const { data: clientData } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('id', repair.client_id)
          .maybeSingle();
        
        // Récupérer le technicien
        let technicianData = null;
        if (repair.technician_id) {
          const { data } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', repair.technician_id)
            .maybeSingle();
          technicianData = data;
        }
        
        // Récupérer le point relais de dépôt
        let dropOffRelayData = null;
        if (repair.drop_off_relay_id) {
          const { data } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', repair.drop_off_relay_id)
            .maybeSingle();
          dropOffRelayData = data;
        }
        
        // Récupérer le point relais de retrait
        let pickupRelayData = null;
        if (repair.pickup_relay_id) {
          const { data } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', repair.pickup_relay_id)
            .maybeSingle();
          pickupRelayData = data;
        }
        
        // Construire l'objet réparation enrichi
        const enrichedRepair: RepairRequest = {
          ...repair,
          status: statusData || undefined,
          client_first_name: clientData?.first_name,
          client_last_name: clientData?.last_name,
          client_email: clientData?.email,
          technician_first_name: technicianData?.first_name,
          technician_last_name: technicianData?.last_name,
          drop_off_relay_name: dropOffRelayData ? `${dropOffRelayData.first_name} ${dropOffRelayData.last_name}` : undefined,
          pickup_relay_name: pickupRelayData ? `${pickupRelayData.first_name} ${pickupRelayData.last_name}` : undefined
        };
        
        enrichedRepairs.push(enrichedRepair);
      }
      
      setRepairs(enrichedRepairs);
      setFilteredRepairs(enrichedRepairs);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des réparations:', error);
      setError(error.message || 'Erreur lors de la récupération des réparations.');
    } finally {
      setLoading(false);
    }
  };
  
  const filterRepairs = () => {
    let filtered = [...repairs];
    
    // Filtrer par terme de recherche
    if (searchTerm) {
      const lowercasedFilter = searchTerm.toLowerCase();
      filtered = filtered.filter(repair => {
        return (
          repair.code.toLowerCase().includes(lowercasedFilter) ||
          repair.device_type.toLowerCase().includes(lowercasedFilter) ||
          repair.device_brand.toLowerCase().includes(lowercasedFilter) ||
          repair.device_model.toLowerCase().includes(lowercasedFilter) ||
          repair.issue_description.toLowerCase().includes(lowercasedFilter) ||
          (repair.client_first_name && repair.client_first_name.toLowerCase().includes(lowercasedFilter)) ||
          (repair.client_last_name && repair.client_last_name.toLowerCase().includes(lowercasedFilter)) ||
          (repair.client_email && repair.client_email.toLowerCase().includes(lowercasedFilter)) ||
          (repair.technician_first_name && repair.technician_first_name.toLowerCase().includes(lowercasedFilter)) ||
          (repair.technician_last_name && repair.technician_last_name.toLowerCase().includes(lowercasedFilter)) ||
          (repair.drop_off_relay_name && repair.drop_off_relay_name.toLowerCase().includes(lowercasedFilter)) ||
          (repair.pickup_relay_name && repair.pickup_relay_name.toLowerCase().includes(lowercasedFilter))
        );
      });
    }
    
    // Filtrer par statut
    if (selectedStatus) {
      filtered = filtered.filter(repair => repair.status_id === selectedStatus);
    }
    
    setFilteredRepairs(filtered);
  };
  
  const getStatusBadge = (status?: RepairStatus) => {
    if (!status) return <Badge variant="default">Inconnu</Badge>;
    
    let variant: any = 'default';
    
    switch (status.code) {
      case 'SUBMITTED':
        variant = 'blue';
        break;
      case 'RECEIVED':
        variant = 'purple';
        break;
      case 'TO_DIAGNOSE':
        variant = 'pink';
        break;
      case 'IN_REPAIR':
        variant = 'orange';
        break;
      case 'REPAIRED':
        variant = 'teal';
        break;
      case 'READY_FOR_PICKUP':
        variant = 'indigo';
        break;
      case 'COMPLETED':
        variant = 'success';
        break;
      case 'CANCELLED':
        variant = 'error';
        break;
      default:
        variant = 'default';
    }
    
    return <Badge variant={variant}>{status.name}</Badge>;
  };
  
  const getStatusIcon = (status?: RepairStatus) => {
    if (!status) return <AlertCircle className="h-5 w-5 text-gray-400" />;
    
    switch (status.code) {
      case 'SUBMITTED':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'RECEIVED':
        return <MapPin className="h-5 w-5 text-purple-500" />;
      case 'TO_DIAGNOSE':
        return <AlertCircle className="h-5 w-5 text-pink-500" />;
      case 'IN_REPAIR':
        return <Wrench className="h-5 w-5 text-orange-500" />;
      case 'REPAIRED':
        return <CheckCircle className="h-5 w-5 text-teal-500" />;
      case 'READY_FOR_PICKUP':
        return <MapPin className="h-5 w-5 text-indigo-500" />;
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'CANCELLED':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/admin')}
          className="mr-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold">Gestion des réparations</h1>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-md text-error">
          {error}
        </div>
      )}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Rechercher une réparation..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtres {showFilters ? '(Masquer)' : '(Afficher)'}
          </Button>
          
          <Button
            variant="outline"
            onClick={fetchRepairs}
            disabled={loading}
          >
            <ArrowLeft className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>
      
      {showFilters && (
        <Card className="mb-6">
          <Card.Content className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="">Tous les statuts</option>
                  {statuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}
      
      <Card>
        <Card.Content className="p-0">
          {loading ? (
            <div className="p-6 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredRepairs.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Aucune réparation trouvée.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Appareil
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Technicien
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date de création
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRepairs.map((repair) => (
                    <tr key={repair.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {repair.code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {repair.device_brand} {repair.device_model}
                        </div>
                        <div className="text-xs text-gray-500">
                          {repair.device_type}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {repair.client_first_name} {repair.client_last_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {repair.client_email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(repair.status)}
                          <span className="ml-2">
                            {getStatusBadge(repair.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {repair.technician_first_name && repair.technician_last_name 
                            ? `${repair.technician_first_name} ${repair.technician_last_name}`
                            : 'Non assigné'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(repair.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/repair/${repair.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Détails
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
};

export default RepairsListPage;
