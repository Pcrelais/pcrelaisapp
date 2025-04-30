import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Edit, 
  CheckCircle,
  XCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabaseConfig';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

interface Technician {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  speciality?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const TechniciansPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTechnician, setNewTechnician] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    speciality: '',
    password: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    
    fetchTechnicians();
  }, [user, navigate]);
  
  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .order('last_name', { ascending: true });
      
      if (error) throw error;
      
      console.log('Techniciens récupérés:', data);
      setTechnicians(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des techniciens:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTechnician(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAddTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    try {
      // Vérifier que tous les champs requis sont remplis
      if (!newTechnician.first_name || !newTechnician.last_name || !newTechnician.email) {
        setFormError('Veuillez remplir tous les champs obligatoires.');
        return;
      }
      
      // Ajouter directement dans la table technicians
      const { data, error } = await supabase
        .from('technicians')
        .insert({
          first_name: newTechnician.first_name,
          last_name: newTechnician.last_name,
          email: newTechnician.email,
          phone: newTechnician.phone,
          speciality: newTechnician.speciality,
          is_active: true
        })
        .select();
      
      if (error) throw error;
      
      console.log('Technicien ajouté avec succès:', data);
      
      // Réinitialiser le formulaire
      setNewTechnician({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        speciality: '',
        password: ''
      });
      
      setSuccessMessage('Technicien ajouté avec succès.');
      setShowAddForm(false);
      
      // Rafraîchir la liste des techniciens
      fetchTechnicians();
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout du technicien:', error);
      setFormError(error.message || 'Une erreur est survenue lors de l\'ajout du technicien.');
    }
  };
  
  const handleToggleStatus = async (technicianId: string, isActive: boolean) => {
    try {
      console.log(`Tentative de modification du statut pour le technicien ${technicianId}`);
      
      // Afficher un message temporaire pour informer l'utilisateur
      setSuccessMessage(`Pour activer/désactiver les techniciens, veuillez d'abord exécuter la migration 11_add_is_active_column.sql.`);
      setTimeout(() => setSuccessMessage(null), 5000);
      
      // Vérifier si la migration a été appliquée
      try {
        const { error } = await supabase
          .from('technicians')
          .update({ is_active: !isActive })
          .eq('id', technicianId);
        
        if (error) throw error;
        
        // Mettre à jour la liste des techniciens
        setTechnicians(prevTechnicians =>
          prevTechnicians.map(tech =>
            tech.id === technicianId ? { ...tech, is_active: !isActive } : tech
          )
        );
        
        setSuccessMessage(`Technicien ${!isActive ? 'activé' : 'désactivé'} avec succès.`);
        
        // Effacer le message de succès après 3 secondes
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } catch (error) {
        console.error('Erreur lors de la modification du statut:', error);
        setFormError('Une erreur est survenue lors de la modification du statut.');
        
        // Effacer le message d'erreur après 3 secondes
        setTimeout(() => {
          setFormError(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Erreur lors de la modification du statut:', error);
      setFormError('Une erreur est survenue lors de la modification du statut.');
      
      // Effacer le message d'erreur après 3 secondes
      setTimeout(() => {
        setFormError(null);
      }, 3000);
    }
  };
  
  const filteredTechnicians = technicians.filter(tech => {
    const fullName = `${tech.first_name} ${tech.last_name}`.toLowerCase();
    const email = tech.email?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    
    return fullName.includes(query) || email.includes(query);
  });
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-4"
          onClick={() => navigate('/admin')}
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des techniciens
          </h1>
          <p className="text-gray-600">
            Ajoutez, modifiez ou supprimez des techniciens
          </p>
        </div>
      </div>
      
      {successMessage && (
        <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-lg text-success">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            <p>{successMessage}</p>
          </div>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Rechercher un technicien..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Button
          variant="primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? (
            <>
              <XCircle className="h-5 w-5 mr-2" />
              Annuler
            </>
          ) : (
            <>
              <Plus className="h-5 w-5 mr-2" />
              Ajouter un technicien
            </>
          )}
        </Button>
      </div>
      
      {showAddForm && (
        <Card className="mb-6">
          <Card.Header>
            <Card.Title>Ajouter un nouveau technicien</Card.Title>
          </Card.Header>
          <Card.Content>
            {formError && (
              <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-md text-error text-sm">
                {formError}
              </div>
            )}
            
            <form onSubmit={handleAddTechnician}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={newTechnician.first_name}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={newTechnician.last_name}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-error">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newTechnician.email}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={newTechnician.phone}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="speciality" className="block text-sm font-medium text-gray-700 mb-1">
                    Spécialisation
                  </label>
                  <input
                    type="text"
                    id="speciality"
                    name="speciality"
                    value={newTechnician.speciality}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="ex: Smartphones, Ordinateurs..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe <span className="text-error">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={newTechnician.password}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                >
                  Ajouter le technicien
                </Button>
              </div>
            </form>
          </Card.Content>
        </Card>
      )}
      
      <Card>
        <Card.Content className="p-0">
          {loading ? (
            <div className="p-6 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredTechnicians.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {searchQuery ? 'Aucun technicien ne correspond à votre recherche.' : 'Aucun technicien disponible.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Spécialisation
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date d'ajout
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTechnicians.map((technician) => (
                    <tr key={technician.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {technician.first_name} {technician.last_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{technician.email}</div>
                        {technician.phone && (
                          <div className="text-sm text-gray-500">{technician.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {technician.speciality || 'Non spécifiée'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={technician.is_active === false ? 'error' : 'success'}
                        >
                          {technician.is_active === false ? 'Inactif' : 'Actif'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(technician.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(technician.id, !!technician.is_active)}
                          >
                            {technician.is_active ? 'Désactiver' : 'Activer'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/technicians/edit/${technician.id}`)}
                          >
                            <Edit className="h-4 w-4" />
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

export default TechniciansPage;
