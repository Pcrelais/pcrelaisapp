import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { supabase } from '../../lib/supabaseConfig';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

interface TechnicianFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  specialization?: string;
  is_active: boolean;
}

const TechnicianEditForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<TechnicianFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    specialization: '',
    is_active: true
  });
  
  useEffect(() => {
    const fetchTechnician = async () => {
      try {
        setLoading(true);
        
        if (!id) {
          setError("ID du technicien manquant");
          return;
        }
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .eq('role', 'technician')
          .single();
        
        if (error) {
          throw error;
        }
        
        if (!data) {
          setError("Technicien non trouvé");
          return;
        }
        
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          phone: data.phone || '',
          specialization: data.specialization || '',
          is_active: data.is_active !== false // Si is_active est undefined, on considère que c'est true
        });
        
      } catch (error: any) {
        console.error('Erreur lors de la récupération du technicien:', error);
        setError(error.message || "Erreur lors de la récupération du technicien");
      } finally {
        setLoading(false);
      }
    };
    
    fetchTechnician();
  }, [id]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      
      if (!id) {
        setError("ID du technicien manquant");
        return;
      }
      
      // Vérifier si la colonne is_active existe
      const { data: columnExists, error: columnError } = await supabase
        .rpc('check_column_exists', { 
          table_name: 'profiles', 
          column_name: 'is_active' 
        });
      
      if (columnError) {
        console.error('Erreur lors de la vérification de la colonne:', columnError);
        throw new Error("Impossible de vérifier si la colonne is_active existe. Veuillez exécuter la migration 11_add_is_active_column.sql.");
      }
      
      // Vérifier si la colonne specialization existe
      const { data: specializationExists, error: specializationError } = await supabase
        .rpc('check_column_exists', { 
          table_name: 'profiles', 
          column_name: 'specialization' 
        });
      
      if (specializationError) {
        console.error('Erreur lors de la vérification de la colonne:', specializationError);
        throw new Error("Impossible de vérifier si la colonne specialization existe. Veuillez exécuter la migration 11_add_is_active_column.sql.");
      }
      
      // Préparer les données à mettre à jour
      const updateData: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || null
      };
      
      // Ajouter is_active si la colonne existe
      if (columnExists) {
        updateData.is_active = formData.is_active;
      }
      
      // Ajouter specialization si la colonne existe
      if (specializationExists) {
        updateData.specialization = formData.specialization || null;
      }
      
      // Mettre à jour le technicien
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id);
      
      if (updateError) {
        throw updateError;
      }
      
      setSuccessMessage("Technicien mis à jour avec succès");
      setTimeout(() => {
        navigate('/admin/technicians');
      }, 2000);
      
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du technicien:', error);
      setError(error.message || "Erreur lors de la mise à jour du technicien");
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/admin/technicians')}
          className="mr-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold">Modifier le technicien</h1>
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
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Card>
          <Card.Header>
            <Card.Title>Informations du technicien</Card.Title>
          </Card.Header>
          <Card.Content>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-gray-400 text-xs">(non modifiable)</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 bg-gray-100 rounded-md cursor-not-allowed"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Spécialisation
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                    Technicien actif
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/technicians')}
                  className="mr-2"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-b-2 border-white rounded-full"></div>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card.Content>
        </Card>
      )}
    </div>
  );
};

export default TechnicianEditForm;
