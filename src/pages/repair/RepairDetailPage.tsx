import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Wrench, 
  MapPin, 
  MessageSquare, 
  Clipboard, 
  CheckCircle, 
  Clock,
  MessageCircle,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseConfig';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import FileUploader from '../../components/ui/FileUploader';
import FileGallery from '../../components/ui/FileGallery';

// Types
interface RepairDetail {
  id: string;
  clientId: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  deviceType: string;
  brand: string;
  model: string;
  problemDescription: string;
  preDiagnosis?: string;
  estimatedCost?: number;
  statusId: string | number;
  statusName?: string;
  statusLabel?: string;
  createdAt: string;
  updatedAt: string;
  dropOffRelayId?: string;
  dropOffRelayName?: string;
  pickupRelayId?: string;
  pickupRelayName?: string;
  appointmentDate?: string;
  technicianId?: string;
  technicianName?: string;
  notes?: string;
}

interface TechnicianOption {
  id: string;
  name: string;
}

interface StatusOption {
  id: string;
  code: string;
  label: string;
  description?: string;
  color?: string;
}

const RepairDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [repair, setRepair] = useState<RepairDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [notes, setNotes] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedTechnician, setSelectedTechnician] = useState<string>('');
  const [technicianOptions, setTechnicianOptions] = useState<TechnicianOption[]>([]);
  const [fileUploadSuccess, setFileUploadSuccess] = useState(false);
  
  useEffect(() => {
    const fetchRepairDetails = async () => {
      console.log('=== DÉBUT DÉBOGAGE CONTACTS ===');
      if (!id || !user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Récupérer les détails de la réparation avec une approche plus robuste
        const { data: repairData, error: repairError } = await supabase
          .from('repair_requests')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        
        if (repairError) throw repairError;
        
        if (!repairData) {
          // Vérifier si la réparation existe dans repair_codes
          const { data: repairCodeData, error: repairCodeError } = await supabase
            .from('repair_codes')
            .select('*')
            .eq('id', id)
            .maybeSingle();
            
          if (repairCodeError) throw repairCodeError;
          
          if (repairCodeData) {
            setError('Cette réparation existe mais n\'a pas encore été complètement enregistrée. Veuillez déposer l\'appareil dans un point relais pour finaliser l\'enregistrement.');
          } else {
            setError('Réparation non trouvée');
          }
          return;
        }
        
        // Récupérer le statut
        let statusData = null;
        if (repairData.status_id) {
          const { data: status, error: statusError } = await supabase
            .from('repair_statuses')
            .select('id, code, label')
            .eq('id', repairData.status_id)
            .maybeSingle();
            
          if (!statusError && status) {
            statusData = status;
          }
        }
        
        // Récupérer les informations du client
        let clientData = null;
        if (repairData.client_id) {
          console.log('client_id trouvé:', repairData.client_id);
          
          try {
            const { data: client, error: clientError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', repairData.client_id)
              .maybeSingle();
              
            console.log('Résultat de la requête pour le client:', client);
              
            if (!clientError && client) {
              clientData = client;
              console.log('Client récupéré:', clientData);
            } else {
              console.error('Erreur ou client non trouvé:', clientError);
              // Créer un client par défaut avec les informations disponibles
              clientData = {
                id: repairData.client_id,
                email: repairData.client_email || 'client@pcrelais.fr',
                first_name: repairData.client_first_name || '',
                last_name: repairData.client_last_name || '',
                phone: repairData.client_phone || ''
              };
              console.log('Utilisation d\'un client par défaut:', clientData);
            }
          } catch (err) {
            console.error('Erreur lors de la récupération du client:', err);
            // Créer un client par défaut en cas d'erreur
            clientData = {
              id: repairData.client_id,
              email: 'client@pcrelais.fr',
              first_name: '',
              last_name: '',
              phone: ''
            };
            console.log('Utilisation d\'un client par défaut après erreur:', clientData);
          }
        } else {
          console.log('Aucun client_id trouvé dans la réparation');
        }
        
        // Récupérer les informations du technicien depuis la nouvelle table technicians
        let technicianName = 'Non assigné';
        if (repairData.technician_id) {
          console.log('technician_id trouvé:', repairData.technician_id);
          
          try {
            // Utiliser la table technicians pour récupérer les informations du technicien
            const { data, error } = await supabase
              .from('technicians')
              .select('first_name, last_name')
              .eq('id', repairData.technician_id)
              .single();
              
            console.log('Résultat de la requête pour le technicien:', data);
              
            if (!error && data) {
              const dbTechnicianName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
              if (dbTechnicianName) {
                technicianName = dbTechnicianName;
                console.log('Nom du technicien récupéré depuis la table technicians:', technicianName);
              }
            } else {
              // Si la requête échoue, essayer d'utiliser la fonction RPC
              console.log('Essai de récupération via la fonction RPC get_technician_by_id');
              const { data: technicien, error: rpcError } = await supabase
                .rpc('get_technician_by_id', { technician_id: repairData.technician_id });
                
              console.log('Résultat de la fonction RPC get_technician_by_id:', technicien);
                
              if (!rpcError && technicien) {
                const rpcTechnicianName = `${technicien.first_name || ''} ${technicien.last_name || ''}`.trim();
                if (rpcTechnicianName) {
                  technicianName = rpcTechnicianName;
                  console.log('Nom du technicien récupéré via RPC:', technicianName);
                }
              } else {
                console.log('Erreur ou technicien non trouvé via RPC:', rpcError);
                technicianName = `Technicien #${repairData.technician_id.substring(0, 8)}`;
              }
            }
          } catch (err) {
            console.error('Erreur lors de la récupération du technicien:', err);
            technicianName = `Technicien #${repairData.technician_id.substring(0, 8)}`;
          }
        }
        
        // Récupérer les informations du point relais de dépôt
        let dropOffRelayName = 'Non défini';
        if (repairData.drop_off_relay_id) {
          console.log('drop_off_relay_id trouvé:', repairData.drop_off_relay_id);
          
          try {
            // Récupérer les informations du point relais directement depuis la table relay_points
            const { data: relayPoint, error: relayPointError } = await supabase
              .from('relay_points')
              .select('*')
              .eq('id', repairData.drop_off_relay_id)
              .single();
              
            console.log('Données du point relais de dépôt:', relayPoint);
              
            if (!relayPointError && relayPoint) {
              // Vérifier les champs disponibles et construire l'adresse complète
              const name = relayPoint.name || 'PC Relais';
              
              // Déterminer si l'adresse est déjà complète dans un seul champ
              let fullAddress = '';
              if (relayPoint.address && relayPoint.address.includes(relayPoint.city || '') && relayPoint.address.includes(relayPoint.postal_code || '')) {
                // L'adresse contient déjà la ville et le code postal
                fullAddress = relayPoint.address;
              } else {
                // Construire l'adresse à partir des champs individuels
                const street = relayPoint.street || relayPoint.address || '';
                const city = relayPoint.city || '';
                const postalCode = relayPoint.postal_code || '';
                const country = relayPoint.country || 'France';
                
                // Éviter les doublons dans l'adresse
                const addressParts = [];
                if (street) addressParts.push(street);
                if (postalCode && city) {
                  addressParts.push(`${postalCode} ${city}`);
                } else {
                  if (postalCode) addressParts.push(postalCode);
                  if (city) addressParts.push(city);
                }
                if (country && country !== 'France') addressParts.push(country);
                
                fullAddress = addressParts.join(', ');
              }
              
              dropOffRelayName = `${name} - ${fullAddress}`;
              console.log('Point relais de dépôt trouvé:', dropOffRelayName);
            } else {
              console.error('Erreur ou point relais de dépôt non trouvé dans relay_points:', relayPointError);
              dropOffRelayName = `Point relais #${repairData.drop_off_relay_id.substring(0, 8)}`;
            }
          } catch (err) {
            console.error('Erreur lors de la récupération du point relais de dépôt:', err);
            dropOffRelayName = `Point relais #${repairData.drop_off_relay_id.substring(0, 8)}`;
          }
        }
        
        // Récupérer les informations du point relais de récupération
        let pickupRelayName = 'Non défini';
        if (repairData.pickup_relay_id) {
          console.log('pickup_relay_id trouvé:', repairData.pickup_relay_id);
          
          try {
            // Récupérer les informations du point relais directement depuis la table relay_points
            const { data: relayPoint, error: relayPointError } = await supabase
              .from('relay_points')
              .select('*')
              .eq('id', repairData.pickup_relay_id)
              .single();
              
            console.log('Données du point relais de retrait:', relayPoint);
              
            if (!relayPointError && relayPoint) {
              // Vérifier les champs disponibles et construire l'adresse complète
              const name = relayPoint.name || 'PC Relais';
              
              // Déterminer si l'adresse est déjà complète dans un seul champ
              let fullAddress = '';
              if (relayPoint.address && relayPoint.address.includes(relayPoint.city || '') && relayPoint.address.includes(relayPoint.postal_code || '')) {
                // L'adresse contient déjà la ville et le code postal
                fullAddress = relayPoint.address;
              } else {
                // Construire l'adresse à partir des champs individuels
                const street = relayPoint.street || relayPoint.address || '';
                const city = relayPoint.city || '';
                const postalCode = relayPoint.postal_code || '';
                const country = relayPoint.country || 'France';
                
                // Éviter les doublons dans l'adresse
                const addressParts = [];
                if (street) addressParts.push(street);
                if (postalCode && city) {
                  addressParts.push(`${postalCode} ${city}`);
                } else {
                  if (postalCode) addressParts.push(postalCode);
                  if (city) addressParts.push(city);
                }
                if (country && country !== 'France') addressParts.push(country);
                
                fullAddress = addressParts.join(', ');
              }
              
              pickupRelayName = `${name} - ${fullAddress}`;
              console.log('Point relais de retrait trouvé:', pickupRelayName);
            } else {
              console.error('Erreur ou point relais de retrait non trouvé dans relay_points:', relayPointError);
              pickupRelayName = `Point relais #${repairData.pickup_relay_id.substring(0, 8)}`;
            }
          } catch (err) {
            console.error('Erreur lors de la récupération du point relais de retrait:', err);
            pickupRelayName = `Point relais #${repairData.pickup_relay_id.substring(0, 8)}`;
          }
        }
        
        // Formater les données pour l'affichage
        setRepair({
          id: repairData.id,
          clientId: repairData.client_id,
          // Utiliser les informations du client si disponibles, sinon utiliser 'Client' comme nom par défaut
          clientName: clientData && (clientData.first_name || clientData.last_name) ? 
            `${clientData.first_name || ''} ${clientData.last_name || ''}`.trim() : 
            (clientData?.email ? clientData.email.split('@')[0] : 'Client'),
          clientEmail: clientData?.email || '',
          clientPhone: clientData?.phone || '',
          deviceType: repairData.device_type || '',
          brand: repairData.brand || '',
          model: repairData.model || '',
          problemDescription: repairData.problem_description || '',
          preDiagnosis: repairData.pre_diagnosis || '',
          estimatedCost: repairData.estimated_cost,
          statusId: repairData.status_id,
          statusName: statusData?.code || '',
          statusLabel: statusData?.label || '',
          createdAt: repairData.created_at,
          updatedAt: repairData.updated_at,
          dropOffRelayId: repairData.drop_off_relay_id,
          dropOffRelayName: dropOffRelayName,
          pickupRelayId: repairData.pickup_relay_id,
          pickupRelayName: pickupRelayName,
          appointmentDate: repairData.appointment_date,
          technicianId: repairData.technician_id,
          technicianName: technicianName,
          notes: repairData.notes || '',
        });
        
        // Récupérer les options de statut
        const { data: statusOptions, error: statusOptionsError } = await supabase
          .from('repair_statuses')
          .select('id, code, label')
          .order('id');
          
        if (!statusOptionsError) {
          setStatusOptions(statusOptions);
        }
        
        // Récupérer les techniciens disponibles depuis la nouvelle table technicians
        const { data: technicians, error: techniciansError } = await supabase
          .from('technicians')
          .select('id, user_id, first_name, last_name')
          .order('last_name');
          
        if (!techniciansError && technicians) {
          const options = technicians.map(tech => ({
            id: tech.id,
            name: `${tech.first_name} ${tech.last_name}`
          }));
          setTechnicianOptions(options);
        }
        
        // Initialiser les valeurs des champs de formulaire
        setNotes(repairData.notes || '');
        setEstimatedCost(repairData.estimated_cost ? repairData.estimated_cost.toString() : '');
        setSelectedStatus(repairData.status_id);
        setSelectedTechnician(repairData.technician_id || '');
        
      } catch (error) {
        console.error('Erreur lors de la récupération des détails de la réparation:', error);
        setError('Erreur lors de la récupération des détails de la réparation');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRepairDetails();
  }, [id, user]);
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Non défini';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const renderStatusBadge = (statusName?: string, statusLabel?: string) => {
    if (!statusName || !statusLabel) return null;
    
    const getVariant = () => {
      switch (statusName) {
        case 'pending':
          return 'warning';
        case 'received':
        case 'diagnosed':
        case 'inRepair':
          return 'primary';
        case 'repaired':
        case 'readyForPickup':
        case 'completed':
          return 'success';
        case 'cancelled':
          return 'error';
        default:
          return 'default';
      }
    };
    
    return <Badge variant={getVariant()}>{statusLabel}</Badge>;
  };
  
  const handleUpdateRepair = async () => {
    if (!repair || !user) return;
    
    // Vérifier que l'utilisateur a les droits pour mettre à jour la réparation
    if (user.role !== 'technician' && user.role !== 'admin') {
      setError('Vous n\'avez pas les droits nécessaires pour modifier cette réparation.');
      return;
    }
    
    try {
      setUpdating(true);
      setUpdateSuccess(false);
      
      // Préparer les données à mettre à jour
      const updateData: any = {
        status_id: selectedStatus,
        notes: notes,
        updated_at: new Date().toISOString()
      };
      
      // Ajouter le coût estimé si c'est un technicien
      if (user.role === 'technician' && estimatedCost) {
        updateData.estimated_cost = parseFloat(estimatedCost);
      }
      
      // Ajouter l'assignation du technicien si c'est un administrateur
      if (user.role === 'admin' && selectedTechnician) {
        updateData.technician_id = selectedTechnician || null;
      }
      
      // Mettre à jour la réparation
      const { error: updateError } = await supabase
        .from('repair_requests')
        .update(updateData)
        .eq('id', repair.id);
      
      if (updateError) throw updateError;
      
      // Créer une notification pour le client
      const statusLabel = statusOptions.find(s => s.id === selectedStatus)?.label || '';
      
      await supabase.from('notifications').insert({
        user_id: repair.clientId,
        title: 'Mise à jour de votre réparation',
        message: `Le statut de votre réparation ${repair.brand} ${repair.model} a été mis à jour: ${statusLabel}`,
        type: 'info',
        related_to_request_id: repair.id,
        is_read: false,
        timestamp: new Date().toISOString()
      });
      
      setUpdateSuccess(true);
      
      // Recharger les détails après la mise à jour
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la réparation:', err);
      setError('Impossible de mettre à jour la réparation. Veuillez réessayer.');
    } finally {
      setUpdating(false);
    }
  };
  
  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error || !repair) {
    return (
      <div className="p-6">
        <div className="bg-error/10 border border-error/20 rounded-lg p-4 text-error">
          <h2 className="text-lg font-semibold">Erreur</h2>
          <p>{error || 'Réparation non trouvée'}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate(-1)}
          >
            Retour
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Détails de la réparation
          </h1>
          <p className="text-gray-600">
            {repair.brand} {repair.model} - {repair.deviceType}
          </p>
        </div>
      </div>
      
      {updateSuccess && (
        <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-lg text-success">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            <p>La réparation a été mise à jour avec succès.</p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="md:col-span-2">
          <Card.Header>
            <div className="flex justify-between items-center">
              <Card.Title>Informations générales</Card.Title>
              {renderStatusBadge(repair.statusName, repair.statusLabel)}
            </div>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Appareil</h3>
                <p className="text-gray-900">{repair.deviceType}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Marque / Modèle</h3>
                <p className="text-gray-900">{repair.brand} {repair.model}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Date de création</h3>
                <p className="text-gray-900">{formatDate(repair.createdAt)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Dernière mise à jour</h3>
                <p className="text-gray-900">{formatDate(repair.updatedAt)}</p>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Description du problème</h3>
                <p className="text-gray-900 whitespace-pre-line">{repair.problemDescription}</p>
              </div>
              {repair.preDiagnosis && (
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Pré-diagnostic</h3>
                  <p className="text-gray-900 whitespace-pre-line">{repair.preDiagnosis}</p>
                </div>
              )}
              {repair.estimatedCost !== undefined && repair.estimatedCost !== null && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Coût estimé</h3>
                  <p className="text-gray-900">{repair.estimatedCost} €</p>
                </div>
              )}
            </div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Header>
            <Card.Title>Contacts</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Client</p>
                  <p className="font-medium">{repair.clientName}</p>
                  <p className="text-sm text-gray-500">{repair.clientEmail}</p>
                  <p className="text-sm text-gray-500">{repair.clientPhone}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Wrench className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Technicien</p>
                  <p className="font-medium">{repair.technicianName || 'Non assigné'}</p>
                  {repair.technicianId && <p className="text-xs text-gray-400">ID: {repair.technicianId}</p>}
                </div>
              </div>
              
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Point relais (dépôt)</p>
                  <p className="font-medium">{repair.dropOffRelayName || 'Non défini'}</p>
                  {repair.dropOffRelayId && <p className="text-xs text-gray-400">ID: {repair.dropOffRelayId}</p>}
                </div>
              </div>
              
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Point relais (retrait)</p>
                  <p className="font-medium">{repair.pickupRelayName || 'Non défini'}</p>
                  {repair.pickupRelayId && <p className="text-xs text-gray-400">ID: {repair.pickupRelayId}</p>}
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>
      
      {/* Section pour les techniciens, administrateurs et points relais (en lecture seule pour les points relais) */}
      {(user?.role === 'technician' || user?.role === 'admin' || user?.role === 'relayPoint') && (
        <Card className="mb-6">
          <Card.Header>
            <Card.Title>Gestion de la réparation</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut de la réparation
                </label>
                {user?.role === 'relayPoint' ? (
                  <div className="p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    {statusOptions.find(s => s.id === repair.statusId)?.label || 'Non défini'}
                  </div>
                ) : (
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    {statusOptions.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              {user?.role === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigner un technicien
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={selectedTechnician}
                    onChange={(e) => setSelectedTechnician(e.target.value)}
                  >
                    <option value="">-- Sélectionner un technicien --</option>
                    {technicianOptions.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {user?.role === 'technician' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Coût estimé (€)
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              )}
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                {user?.role === 'relayPoint' ? (
                  <div className="p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 min-h-[100px] whitespace-pre-line">
                    {repair.notes || 'Aucune note disponible'}
                  </div>
                ) : (
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Ajouter des notes sur la réparation..."
                  ></textarea>
                )}
              </div>
            </div>
            
            {/* Section pour les fichiers */}
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                Documents et photos
              </h3>
              
              {/* Uploader de fichiers */}
              <div className="mb-4">
                <FileUploader
                  onFileUploaded={() => {
                    setFileUploadSuccess(true);
                    setTimeout(() => setFileUploadSuccess(false), 3000);
                  }}
                  acceptedFileType="image"
                  repairId={id}
                  className="mb-2"
                />
                
                <FileUploader
                  onFileUploaded={() => {
                    setFileUploadSuccess(true);
                    setTimeout(() => setFileUploadSuccess(false), 3000);
                  }}
                  acceptedFileType="document"
                  repairId={id}
                />
                
                {fileUploadSuccess && (
                  <div className="mt-2 p-2 bg-green-50 text-green-700 text-sm rounded">
                    Fichier téléchargé avec succès!
                  </div>
                )}
              </div>
              
              {/* Galerie de fichiers */}
              <FileGallery
                repairId={id}
                showDelete={user?.role === 'technician' || user?.role === 'admin' || user?.role === 'relayPoint'}
                className="mt-4"
              />
            </div>
            
            <div className="mt-6 flex justify-between">
              <Button
                variant="outline"
                onClick={() => navigate(`/chat/${id}`)}
                disabled={updating}
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Discuter avec le client
              </Button>
              {user?.role !== 'relayPoint' && (
                <Button
                  variant="primary"
                  onClick={handleUpdateRepair}
                  disabled={updating}
                >
                  {updating ? 'Mise à jour...' : 'Mettre à jour la réparation'}
                </Button>
              )}
            </div>
          </Card.Content>
        </Card>
      )}
      
      {/* Section pour les clients */}
      {user?.role === 'client' && user?.id === repair.clientId && (
        <Card className="mb-6">
          <Card.Header>
            <Card.Title>Suivi de votre réparation</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${repair.statusName === 'completed' ? 'bg-success text-white' : 'bg-gray-200 text-gray-500'}`}>
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium">Statut actuel</h3>
                  <p className="text-gray-600">{repair.statusLabel}</p>
                </div>
              </div>
              
              {repair.estimatedCost !== undefined && repair.estimatedCost !== null && (
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center">
                    <Clipboard className="h-5 w-5" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium">Coût estimé</h3>
                    <p className="text-gray-600">{repair.estimatedCost} €</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium">Dernière mise à jour</h3>
                  <p className="text-gray-600">{formatDate(repair.updatedAt)}</p>
                </div>
              </div>
            </div>
            
            {/* Galerie de fichiers pour le client */}
            <div className="mt-6 border-t pt-4">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                Documents et photos
              </h3>
              
              <FileGallery
                repairId={id}
                showDelete={false}
                className="mt-4"
              />
            </div>
            
            <div className="mt-6">
              <Link to={`/chat/${repair.id}`}>
                <Button variant="outline" className="w-full">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Contacter le technicien
                </Button>
              </Link>
            </div>
          </Card.Content>
        </Card>
      )}
    </div>
  );
};

export default RepairDetailPage;
