import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Edit, 
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Shield
} from 'lucide-react';
import { supabase } from '../../lib/supabaseConfig';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
  is_active?: boolean;
  created_at: string;
}

const UsersPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  useEffect(() => {
    if (searchTerm) {
      const lowercasedFilter = searchTerm.toLowerCase();
      const filtered = users.filter(user => {
        return (
          user.first_name.toLowerCase().includes(lowercasedFilter) ||
          user.last_name.toLowerCase().includes(lowercasedFilter) ||
          user.email.toLowerCase().includes(lowercasedFilter) ||
          user.role.toLowerCase().includes(lowercasedFilter)
        );
      });
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        setUsers(data);
        setFilteredUsers(data);
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      setError(error.message || 'Erreur lors de la récupération des utilisateurs.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    try {
      console.log(`Tentative de modification du statut pour l'utilisateur ${userId}`);
      
      // Vérifier si la migration a été appliquée
      try {
        // Vérifier si la colonne is_active existe
        const { data: columnExists, error: columnError } = await supabase
          .rpc('check_column_exists', { 
            table_name: 'profiles', 
            column_name: 'is_active' 
          });
        
        if (columnError) {
          console.error('Erreur lors de la vérification de la colonne:', columnError);
          setError("Impossible de vérifier si la colonne is_active existe. Veuillez exécuter la migration 11_add_is_active_column.sql.");
          return;
        }
        
        if (columnExists) {
          // La colonne existe, on peut faire la mise à jour
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ is_active: !isActive })
            .eq('id', userId);
          
          if (updateError) {
            throw updateError;
          }
          
          // Mettre à jour l'interface utilisateur
          setUsers(prevUsers => 
            prevUsers.map(u => 
              u.id === userId ? { ...u, is_active: !isActive } : u
            )
          );
          
          setSuccessMessage(`Statut de l'utilisateur mis à jour avec succès.`);
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          // La colonne n'existe pas encore
          setError("La colonne is_active n'existe pas encore. Veuillez exécuter la migration 11_add_is_active_column.sql.");
          setTimeout(() => setError(null), 3000);
        }
      } catch (error: any) {
        console.error('Erreur lors de la modification du statut:', error);
        setError(error.message || 'Erreur lors de la modification du statut de l\'utilisateur.');
        setTimeout(() => setError(null), 3000);
      }
      
    } catch (error: any) {
      console.error('Erreur lors de la modification du statut:', error);
      setError(error.message || 'Erreur lors de la modification du statut de l\'utilisateur.');
      setTimeout(() => setError(null), 3000);
    }
  };
  
  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'primary';
      case 'technician':
        return 'success';
      case 'relay':
      case 'relaypoint':
        return 'warning';
      case 'client':
        return 'secondary';
      default:
        return 'default';
    }
  };
  
  const getRoleDisplayName = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'Administrateur';
      case 'technician':
        return 'Technicien';
      case 'relay':
      case 'relaypoint':
        return 'Point Relais';
      case 'client':
        return 'Client';
      default:
        return role;
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
        <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-md text-error">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-md text-success">
          {successMessage}
        </div>
      )}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Card>
        <Card.Content className="p-0">
          {loading ? (
            <div className="p-6 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Aucun utilisateur trouvé.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rôle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date d'inscription
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="flex items-center text-sm text-gray-500">
                            <Mail className="h-4 w-4 mr-1" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <Phone className="h-4 w-4 mr-1" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={getRoleBadgeVariant(user.role)}
                        >
                          {getRoleDisplayName(user.role)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={user.is_active === false ? 'error' : 'success'}
                        >
                          {user.is_active === false ? 'Inactif' : 'Actif'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(user.id, !!user.is_active)}
                          >
                            {user.is_active === false ? 'Activer' : 'Désactiver'}
                          </Button>
                        </div>
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

export default UsersPage;
