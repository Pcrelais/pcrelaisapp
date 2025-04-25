import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, ArrowRight } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: 'client' as UserRole,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation des données du formulaire
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    if (!formData.email || !formData.firstName || !formData.lastName) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    setLoading(true);
    
    try {
      const { confirmPassword, ...userData } = formData;
      
      // Appel à la fonction d'inscription du contexte d'authentification
      await register(userData, formData.password);
      
      // Vérifier s'il y a une redirection à effectuer (depuis l'URL)
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get('redirect');
      
      if (redirectTo) {
        navigate(`/${redirectTo}`);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      // Gestion des erreurs spécifiques à Supabase
      if (err?.message?.includes('already registered')) {
        setError('Cette adresse email est déjà utilisée');
      } else if (err?.message?.includes('weak password')) {
        setError('Le mot de passe est trop faible. Utilisez une combinaison de lettres, chiffres et caractères spéciaux.');
      } else {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'inscription');
      }
      console.error('Erreur d\'inscription:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Layout>
      <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Créer un compte</h1>
          <p className="mt-2 text-gray-600">
            Rejoignez PC Relais pour bénéficier de nos services
          </p>
        </div>
        
        <Card>
          <Card.Content className="p-6">
            {error && (
              <div className="bg-error/10 text-error p-3 rounded-md mb-4 text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Prénom"
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  autoComplete="given-name"
                  leftIcon={<User className="h-5 w-5" />}
                  fullWidth
                />
                
                <Input
                  label="Nom"
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  autoComplete="family-name"
                  leftIcon={<User className="h-5 w-5" />}
                  fullWidth
                />
              </div>
              
              <Input
                label="Adresse email"
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                leftIcon={<Mail className="h-5 w-5" />}
                placeholder="nom@exemple.fr"
                fullWidth
              />
              
              <Input
                label="Numéro de téléphone"
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                autoComplete="tel"
                leftIcon={<Phone className="h-5 w-5" />}
                placeholder="06 12 34 56 78"
                fullWidth
              />
              
              <Input
                label="Mot de passe"
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                leftIcon={<Lock className="h-5 w-5" />}
                helperText="8 caractères minimum, avec majuscules, chiffres et caractères spéciaux"
                fullWidth
              />
              
              <Input
                label="Confirmer le mot de passe"
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
                leftIcon={<Lock className="h-5 w-5" />}
                fullWidth
              />
              
              <div className="mt-2">
                <div className="flex items-center">
                  <input
                    id="terms"
                    type="checkbox"
                    required
                    className="h-4 w-4 text-primary border-gray-300 rounded"
                  />
                  <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                    J'accepte les{' '}
                    <Link to="/terms" className="text-primary hover:text-primary-dark">
                      conditions d'utilisation
                    </Link>{' '}
                    et la{' '}
                    <Link to="/privacy" className="text-primary hover:text-primary-dark">
                      politique de confidentialité
                    </Link>
                    <span className="block mt-1 text-xs text-gray-500">
                      Note: Avec Supabase, vous recevrez un email de confirmation pour activer votre compte.
                    </span>
                  </label>
                </div>
              </div>
              
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                fullWidth
                icon={<ArrowRight className="h-5 w-5" />}
                iconPosition="right"
              >
                Créer mon compte
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <span className="text-sm text-gray-600">
                Vous avez déjà un compte ?{' '}
                <Link to="/login" className="text-primary hover:text-primary-dark font-medium">
                  Se connecter
                </Link>
              </span>
            </div>
          </Card.Content>
        </Card>
      </div>
    </Layout>
  );
};

export default RegisterPage;