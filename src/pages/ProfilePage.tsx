import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import { supabase } from '../lib/supabaseConfig';
import Button from '../components/ui/Button';
import { User, MapPin, Clock, Store } from 'lucide-react';

interface OpeningHours {
  monday?: { open: string; close: string };
  tuesday?: { open: string; close: string };
  wednesday?: { open: string; close: string };
  thursday?: { open: string; close: string };
  friday?: { open: string; close: string };
  saturday?: { open: string; close: string };
  sunday?: { open: string; close: string };
}

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [relayPointData, setRelayPointData] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    // Champs pour les points relais
    relayName: '',
    address: '',
    city: '',
    postalCode: '',
    openingHours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '09:00', close: '13:00' },
      sunday: { open: '', close: '' }
    } as OpeningHours,
    isActive: true
  });
  
  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.id) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, email, phone')
          .eq('id', user.id)
          .single();
        if (!error && profile) {
          setFormData(prev => ({
            ...prev,
            firstName: profile.first_name || '',
            lastName: profile.last_name || '',
            email: profile.email || user.email || '',
            phone: profile.phone || '',
          }));
        }
      }
    };
    fetchProfile();
    // Si l'utilisateur est un point relais, récupérer les informations supplémentaires
    if (user && user.role === 'relayPoint') {
      loadRelayPointData(user.id);
    }
  }, [user]);
  
  const loadRelayPointData = async (userId: string) => {
    try {
      // Récupérer les informations du point relais
      const { data, error } = await supabase
        .from('relay_points')
        .select('*')
        .eq('manager_id', userId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setRelayPointData(data);
        setFormData(prev => ({
          ...prev,
          relayName: data.name || '',
          address: data.address || '',
          city: data.city || '',
          postalCode: data.postal_code || '',
          openingHours: data.opening_hours || prev.openingHours,
          isActive: data.is_active !== undefined ? data.is_active : true
        }));
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des données du point relais:', err);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleOpeningHoursChange = (day: string, type: 'open' | 'close', value: string) => {
    setFormData(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: {
          ...prev.openingHours[day as keyof OpeningHours],
          [type]: value
        }
      }
    }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Mettre à jour le profil dans Supabase
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (profileError) throw profileError;
      
      // Si l'utilisateur est un point relais, mettre à jour les informations du point relais
      if (user.role === 'relayPoint') {
        const relayPointUpdateData = {
          name: formData.relayName,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postalCode,
          opening_hours: formData.openingHours,
          is_active: formData.isActive,
          updated_at: new Date().toISOString()
        };
        
        if (relayPointData) {
          // Mettre à jour le point relais existant
          const { error: relayError } = await supabase
            .from('relay_points')
            .update(relayPointUpdateData)
            .eq('id', relayPointData.id);
          
          if (relayError) throw relayError;
        } else {
          // Créer un nouveau point relais
          const { error: relayError } = await supabase
            .from('relay_points')
            .insert({
              ...relayPointUpdateData,
              manager_id: user.id
            });
          
          if (relayError) throw relayError;
        }
      }
      
      // Si l'email a changé, mettre à jour l'email dans l'authentification
      if (formData.email !== user.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: formData.email,
        });
        
        if (authError) {
          setError("Votre profil a été mis à jour, mais la modification de l'email nécessite une vérification. Vous recevrez un email pour confirmer ce changement.");
        }
      }
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du profil:', err);
      setError(err.message || 'Une erreur est survenue lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };
  
  if (!user) {
    return (
      <Layout>
        <div className="container-app py-8">
          <div className="text-center">
            <p>Veuillez vous connecter pour accéder à votre profil.</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container-app py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex items-center mb-6">
              <div className="bg-primary/10 p-3 rounded-full mr-4">
                <User className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Mon Profil</h1>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">Votre profil a été mis à jour avec succès!</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informations personnelles */}
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-lg font-medium text-gray-800 mb-4">Informations personnelles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      Prénom
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Nom
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                      required
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    La modification de l'email nécessitera une vérification par email.
                  </p>
                </div>
                
                <div className="mt-4">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro de téléphone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              
              {/* Informations spécifiques aux points relais */}
              {user?.role === 'relayPoint' && (
                <div className="border-b border-gray-200 pb-4">
                  <div className="flex items-center mb-4">
                    <div className="bg-primary/10 p-2 rounded-full mr-3">
                      <Store className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-lg font-medium text-gray-800">Informations du point relais</h2>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="relayName" className="block text-sm font-medium text-gray-700 mb-1">
                      Nom du point relais
                    </label>
                    <input
                      type="text"
                      id="relayName"
                      name="relayName"
                      value={formData.relayName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                      required
                    />
                  </div>
                  
                  <div className="flex items-center mb-4">
                    <div className="bg-primary/10 p-2 rounded-full mr-3">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-md font-medium text-gray-800">Adresse</h3>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Adresse
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                        Ville
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                        Code postal
                      </label>
                      <input
                        type="text"
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center mb-4">
                    <div className="bg-primary/10 p-2 rounded-full mr-3">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-md font-medium text-gray-800">Horaires d'ouverture</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                      const dayNames: Record<string, string> = {
                        monday: 'Lundi',
                        tuesday: 'Mardi',
                        wednesday: 'Mercredi',
                        thursday: 'Jeudi',
                        friday: 'Vendredi',
                        saturday: 'Samedi',
                        sunday: 'Dimanche'
                      };
                      
                      return (
                        <div key={day} className="grid grid-cols-5 gap-2 items-center">
                          <div className="col-span-1">
                            <span className="text-sm font-medium text-gray-700">{dayNames[day]}</span>
                          </div>
                          <div className="col-span-2">
                            <input
                              type="time"
                              value={formData.openingHours[day as keyof OpeningHours]?.open || ''}
                              onChange={(e) => handleOpeningHoursChange(day, 'open', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="time"
                              value={formData.openingHours[day as keyof OpeningHours]?.close || ''}
                              onChange={(e) => handleOpeningHoursChange(day, 'close', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Point relais actif</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Décochez cette case si vous souhaitez temporairement désactiver votre point relais.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Mise à jour en cours...' : 'Mettre à jour mon profil'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
