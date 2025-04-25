import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart2, PieChart, Download, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabaseConfig';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

interface RepairStat {
  status: string;
  count: number;
  color: string;
}

interface MonthlyRepair {
  month: string;
  count: number;
}

interface RelayRepairStat {
  relay_name: string;
  count: number;
}

interface TechnicianRepairStat {
  technician_name: string;
  count: number;
}

const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [repairsByStatus, setRepairsByStatus] = useState<RepairStat[]>([]);
  const [monthlyRepairs, setMonthlyRepairs] = useState<MonthlyRepair[]>([]);
  const [repairsByRelay, setRepairsByRelay] = useState<RelayRepairStat[]>([]);
  const [repairsByTechnician, setRepairsByTechnician] = useState<TechnicianRepairStat[]>([]);
  
  const [totalRepairs, setTotalRepairs] = useState(0);
  const [avgRepairTime, setAvgRepairTime] = useState(0);
  const [completedRepairs, setCompletedRepairs] = useState(0);
  const [pendingRepairs, setPendingRepairs] = useState(0);
  
  useEffect(() => {
    fetchStatistics();
  }, []);
  
  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Récupérer le nombre total de réparations
      const { count: totalCount } = await supabase
        .from('repair_requests')
        .select('*', { count: 'exact', head: true });
      
      setTotalRepairs(totalCount || 0);
      
      // Récupérer les réparations par statut
      const { data: statusData, error: statusError } = await supabase
        .from('repair_requests')
        .select(`
          status_id,
          repair_statuses (
            code,
            name
          )
        `);
      
      if (statusError) throw statusError;
      
      if (statusData) {
        const statusCounts: Record<string, number> = {};
        
        statusData.forEach(repair => {
          const statusCode = repair.repair_statuses?.code || 'UNKNOWN';
          statusCounts[statusCode] = (statusCounts[statusCode] || 0) + 1;
        });
        
        const statusColors: Record<string, string> = {
          SUBMITTED: '#3b82f6', // blue
          RECEIVED: '#8b5cf6', // purple
          TO_DIAGNOSE: '#ec4899', // pink
          IN_REPAIR: '#f97316', // orange
          REPAIRED: '#10b981', // green
          READY_FOR_PICKUP: '#14b8a6', // teal
          COMPLETED: '#22c55e', // green
          CANCELLED: '#ef4444', // red
          UNKNOWN: '#6b7280' // gray
        };
        
        const statusStats: RepairStat[] = Object.entries(statusCounts).map(([status, count]) => ({
          status,
          count,
          color: statusColors[status] || '#6b7280'
        }));
        
        setRepairsByStatus(statusStats);
        
        // Calculer le nombre de réparations terminées et en attente
        const completed = statusCounts['COMPLETED'] || 0;
        const pending = totalCount ? totalCount - completed : 0;
        
        setCompletedRepairs(completed);
        setPendingRepairs(pending);
      }
      
      // Récupérer les réparations par mois
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('repair_requests')
        .select('created_at');
      
      if (monthlyError) throw monthlyError;
      
      if (monthlyData) {
        const monthlyCounts: Record<string, number> = {};
        
        monthlyData.forEach(repair => {
          const date = new Date(repair.created_at);
          const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlyCounts[monthYear] = (monthlyCounts[monthYear] || 0) + 1;
        });
        
        // Trier par date
        const sortedMonths = Object.entries(monthlyCounts)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, count]) => {
            const [year, monthNum] = month.split('-');
            const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
            return {
              month: date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
              count
            };
          });
        
        setMonthlyRepairs(sortedMonths);
      }
      
      // Récupérer les réparations par point relais
      const { data: relayData, error: relayError } = await supabase
        .from('repair_requests')
        .select(`
          drop_off_relay_id,
          profiles!repair_requests_drop_off_relay_id_fkey (
            first_name,
            last_name
          )
        `);
      
      if (relayError) throw relayError;
      
      if (relayData) {
        const relayCounts: Record<string, number> = {};
        const relayNames: Record<string, string> = {};
        
        relayData.forEach(repair => {
          if (repair.drop_off_relay_id) {
            relayCounts[repair.drop_off_relay_id] = (relayCounts[repair.drop_off_relay_id] || 0) + 1;
            
            const firstName = repair.profiles?.first_name || '';
            const lastName = repair.profiles?.last_name || '';
            relayNames[repair.drop_off_relay_id] = `${firstName} ${lastName}`.trim() || 'Point relais inconnu';
          }
        });
        
        const relayStats: RelayRepairStat[] = Object.entries(relayCounts)
          .map(([relayId, count]) => ({
            relay_name: relayNames[relayId],
            count
          }))
          .sort((a, b) => b.count - a.count);
        
        setRepairsByRelay(relayStats);
      }
      
      // Récupérer les réparations par technicien
      const { data: technicianData, error: technicianError } = await supabase
        .from('repair_requests')
        .select(`
          technician_id,
          profiles!repair_requests_technician_id_fkey (
            first_name,
            last_name
          )
        `);
      
      if (technicianError) throw technicianError;
      
      if (technicianData) {
        const technicianCounts: Record<string, number> = {};
        const technicianNames: Record<string, string> = {};
        
        technicianData.forEach(repair => {
          if (repair.technician_id) {
            technicianCounts[repair.technician_id] = (technicianCounts[repair.technician_id] || 0) + 1;
            
            const firstName = repair.profiles?.first_name || '';
            const lastName = repair.profiles?.last_name || '';
            technicianNames[repair.technician_id] = `${firstName} ${lastName}`.trim() || 'Technicien inconnu';
          }
        });
        
        const technicianStats: TechnicianRepairStat[] = Object.entries(technicianCounts)
          .map(([technicianId, count]) => ({
            technician_name: technicianNames[technicianId],
            count
          }))
          .sort((a, b) => b.count - a.count);
        
        setRepairsByTechnician(technicianStats);
      }
      
      // Calculer le temps moyen de réparation
      const { data: completedData, error: completedError } = await supabase
        .from('repair_requests')
        .select('created_at, updated_at')
        .eq('status_id', (await supabase.from('repair_statuses').select('id').eq('code', 'COMPLETED').single()).data?.id || '');
      
      if (completedError) throw completedError;
      
      if (completedData && completedData.length > 0) {
        let totalDays = 0;
        
        completedData.forEach(repair => {
          const createdDate = new Date(repair.created_at);
          const updatedDate = new Date(repair.updated_at);
          const diffTime = Math.abs(updatedDate.getTime() - createdDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          totalDays += diffDays;
        });
        
        setAvgRepairTime(Math.round(totalDays / completedData.length));
      }
      
    } catch (error: any) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      setError(error.message || 'Erreur lors de la récupération des statistiques.');
    } finally {
      setLoading(false);
    }
  };
  
  const exportToCsv = () => {
    try {
      // Créer les données CSV pour les réparations par statut
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // En-tête
      csvContent += "Catégorie,Donnée,Valeur\n";
      
      // Réparations par statut
      repairsByStatus.forEach(stat => {
        csvContent += `Statut,${stat.status},${stat.count}\n`;
      });
      
      // Réparations par mois
      monthlyRepairs.forEach(stat => {
        csvContent += `Mois,${stat.month},${stat.count}\n`;
      });
      
      // Réparations par point relais
      repairsByRelay.forEach(stat => {
        csvContent += `Point Relais,${stat.relay_name},${stat.count}\n`;
      });
      
      // Réparations par technicien
      repairsByTechnician.forEach(stat => {
        csvContent += `Technicien,${stat.technician_name},${stat.count}\n`;
      });
      
      // Statistiques globales
      csvContent += `Global,Total des réparations,${totalRepairs}\n`;
      csvContent += `Global,Réparations terminées,${completedRepairs}\n`;
      csvContent += `Global,Réparations en cours,${pendingRepairs}\n`;
      csvContent += `Global,Temps moyen de réparation (jours),${avgRepairTime}\n`;
      
      // Créer un lien de téléchargement
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `pc-relais-statistiques-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      
      // Télécharger le fichier
      link.click();
      
      // Nettoyer
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erreur lors de l\'exportation des données:', error);
      setError('Erreur lors de l\'exportation des données.');
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
        <h1 className="text-2xl font-bold">Rapports et statistiques</h1>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-md text-error">
          {error}
        </div>
      )}
      
      <div className="mb-6 flex justify-end">
        <Button
          variant="outline"
          onClick={exportToCsv}
          disabled={loading}
        >
          <Download className="h-4 w-4 mr-2" />
          Exporter les données (CSV)
        </Button>
      </div>
      
      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none">
          <Card.Content className="p-6">
            <div className="flex flex-col items-center">
              <BarChart2 className="h-8 w-8 text-blue-500 mb-2" />
              <p className="text-sm font-medium text-blue-600">Total des réparations</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? '...' : totalRepairs}
              </h3>
            </div>
          </Card.Content>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-none">
          <Card.Content className="p-6">
            <div className="flex flex-col items-center">
              <PieChart className="h-8 w-8 text-green-500 mb-2" />
              <p className="text-sm font-medium text-green-600">Réparations terminées</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? '...' : completedRepairs}
              </h3>
            </div>
          </Card.Content>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-none">
          <Card.Content className="p-6">
            <div className="flex flex-col items-center">
              <BarChart2 className="h-8 w-8 text-orange-500 mb-2" />
              <p className="text-sm font-medium text-orange-600">Réparations en cours</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? '...' : pendingRepairs}
              </h3>
            </div>
          </Card.Content>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-none">
          <Card.Content className="p-6">
            <div className="flex flex-col items-center">
              <Calendar className="h-8 w-8 text-purple-500 mb-2" />
              <p className="text-sm font-medium text-purple-600">Temps moyen de réparation</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? '...' : `${avgRepairTime} jours`}
              </h3>
            </div>
          </Card.Content>
        </Card>
      </div>
      
      {/* Réparations par statut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <Card.Header>
            <Card.Title>Réparations par statut</Card.Title>
          </Card.Header>
          <Card.Content>
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : repairsByStatus.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                Aucune donnée disponible
              </div>
            ) : (
              <div className="space-y-4">
                {repairsByStatus.map((stat, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-32 text-sm font-medium">{stat.status}</div>
                    <div className="flex-1 mx-2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="h-2.5 rounded-full" 
                          style={{ 
                            width: `${(stat.count / totalRepairs) * 100}%`,
                            backgroundColor: stat.color
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-12 text-right text-sm font-medium">{stat.count}</div>
                  </div>
                ))}
              </div>
            )}
          </Card.Content>
        </Card>
        
        {/* Réparations par mois */}
        <Card>
          <Card.Header>
            <Card.Title>Réparations par mois</Card.Title>
          </Card.Header>
          <Card.Content>
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : monthlyRepairs.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                Aucune donnée disponible
              </div>
            ) : (
              <div className="space-y-4">
                {monthlyRepairs.map((stat, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-40 text-sm font-medium">{stat.month}</div>
                    <div className="flex-1 mx-2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="h-2.5 rounded-full bg-blue-600" 
                          style={{ 
                            width: `${(stat.count / Math.max(...monthlyRepairs.map(s => s.count))) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-12 text-right text-sm font-medium">{stat.count}</div>
                  </div>
                ))}
              </div>
            )}
          </Card.Content>
        </Card>
      </div>
      
      {/* Réparations par point relais et technicien */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>Réparations par point relais</Card.Title>
          </Card.Header>
          <Card.Content>
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : repairsByRelay.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                Aucune donnée disponible
              </div>
            ) : (
              <div className="space-y-4">
                {repairsByRelay.map((stat, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-40 text-sm font-medium truncate" title={stat.relay_name}>
                      {stat.relay_name}
                    </div>
                    <div className="flex-1 mx-2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="h-2.5 rounded-full bg-yellow-500" 
                          style={{ 
                            width: `${(stat.count / Math.max(...repairsByRelay.map(s => s.count))) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-12 text-right text-sm font-medium">{stat.count}</div>
                  </div>
                ))}
              </div>
            )}
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Header>
            <Card.Title>Réparations par technicien</Card.Title>
          </Card.Header>
          <Card.Content>
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : repairsByTechnician.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                Aucune donnée disponible
              </div>
            ) : (
              <div className="space-y-4">
                {repairsByTechnician.map((stat, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-40 text-sm font-medium truncate" title={stat.technician_name}>
                      {stat.technician_name}
                    </div>
                    <div className="flex-1 mx-2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="h-2.5 rounded-full bg-green-600" 
                          style={{ 
                            width: `${(stat.count / Math.max(...repairsByTechnician.map(s => s.count))) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-12 text-right text-sm font-medium">{stat.count}</div>
                  </div>
                ))}
              </div>
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;
