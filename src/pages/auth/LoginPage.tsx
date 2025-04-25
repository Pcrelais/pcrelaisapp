import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
      
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
      if (err?.message?.includes('Invalid login credentials')) {
        setError('Email ou mot de passe incorrect');
      } else if (err?.message?.includes('Email not confirmed')) {
        setError('Veuillez confirmer votre email avant de vous connecter');
      } else {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      }
      console.error('Erreur de connexion:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Layout>
      <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Connexion</h1>
          <p className="mt-2 text-gray-600">
            Accédez à votre compte PC Relais
          </p>
        </div>
        
        <Card>
          <Card.Content className="p-6">
            {error && (
              <div className="bg-error/10 text-error p-3 rounded-md mb-4 text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Adresse email"
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                leftIcon={<Mail className="h-5 w-5" />}
                placeholder="nom@exemple.fr"
                fullWidth
              />
              
              <Input
                label="Mot de passe"
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                leftIcon={<Lock className="h-5 w-5" />}
                fullWidth
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Se souvenir de moi
                  </label>
                </div>
                
                <Link to="/forgot-password" className="text-sm text-primary hover:text-primary-dark">
                  Mot de passe oublié ?
                </Link>
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
                Se connecter
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <span className="text-sm text-gray-600">
                Vous n'avez pas de compte ?{' '}
                <Link to="/register" className="text-primary hover:text-primary-dark font-medium">
                  S'inscrire
                </Link>
              </span>
            </div>
            
            <div className="relative mt-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Ou connectez-vous en tant que</span>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Email de test client Supabase
                    setEmail('client@pcrelais.fr');
                    setPassword('password123');
                  }}
                  fullWidth
                >
                  Démo Client
                </Button>
              </div>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Email de test point relais Supabase
                    setEmail('relais@pcrelais.fr');
                    setPassword('password123');
                  }}
                  fullWidth
                >
                  Démo Point Relais
                </Button>
              </div>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Email de test technicien Supabase
                    setEmail('tech@pcrelais.fr');
                    setPassword('password123');
                  }}
                  fullWidth
                >
                  Démo Technicien
                </Button>
              </div>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Email de test administrateur Supabase
                    setEmail('admin@pcrelais.fr');
                    setPassword('password123');
                  }}
                  fullWidth
                >
                  Démo Admin
                </Button>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>
    </Layout>
  );
};

export default LoginPage;