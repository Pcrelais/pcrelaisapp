import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabaseConfig';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Partial<User>, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

// Fonction pour convertir un utilisateur Supabase en utilisateur de notre application
const mapSupabaseUser = async (supabaseUser: SupabaseUser): Promise<User | null> => {
  console.log('mapSupabaseUser appelé avec:', supabaseUser?.id);
  
  try {
    // Essayer d'abord de récupérer le profil utilisateur depuis Supabase
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();
    
    if (error) {
      console.error('Erreur lors de la récupération du profil:', error.message);
      throw error;
    }
    
    if (profile) {
      console.log('Profil récupéré avec succès:', profile);
      return {
        id: profile.id,
        email: profile.email || supabaseUser.email || '',
        phoneNumber: profile.phone_number || '',
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        role: profile.role as UserRole,
        createdAt: profile.created_at,
      };
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du profil, utilisation du profil par défaut:', error);
  }
  
  // Créer un utilisateur par défaut si la récupération du profil a échoué
  const defaultUser: User = {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    phoneNumber: '',
    firstName: '',
    lastName: '',
    role: 'client' as UserRole, // Toujours utiliser le rôle client par défaut pour la sécurité
    createdAt: new Date().toISOString(),
  };
  
  console.log('Utilisation d\'un utilisateur créé localement (fallback):', defaultUser);
  return defaultUser;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Nous stockons la session pour pouvoir l'utiliser si nécessaire dans le futur
  const [, setSession] = useState<Session | null>(null);

  // Écouter les changements d'authentification
  useEffect(() => {
    console.log('Initialisation de l\'authentification');
    setLoading(true);

    // Récupérer la session actuelle
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Session récupérée:', session);
      setSession(session);

      if (session?.user) {
        try {
          const mappedUser = await mapSupabaseUser(session.user);
          console.log('Utilisateur mappé lors de l\'initialisation:', mappedUser);
          setUser(mappedUser);
        } catch (error) {
          console.error('Erreur lors du mappage initial de l\'utilisateur:', error);
          // Créer un utilisateur par défaut en cas d'erreur
          const defaultUser = {
            id: session.user.id,
            email: session.user.email || '',
            phoneNumber: '',
            firstName: '',
            lastName: '',
            role: 'client' as UserRole,
            createdAt: new Date().toISOString(),
          };
          setUser(defaultUser);
          console.log('Utilisateur par défaut utilisé lors de l\'initialisation:', defaultUser);
        }
      }
      setLoading(false);
    }).catch(error => {
      console.error('Erreur lors de la récupération de la session:', error);
      setLoading(false);
    });

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Changement d\'authentification détecté:', event, session);
        setSession(session);

        // Ne pas mettre à jour l'utilisateur lors de la connexion, car nous le faisons manuellement
        // dans la fonction login pour éviter les problèmes
        if (event !== 'SIGNED_IN') {
          if (session?.user) {
            try {
              const mappedUser = await mapSupabaseUser(session.user);
              setUser(mappedUser);
            } catch (error) {
              console.error('Erreur lors du mappage de l\'utilisateur après changement d\'authentification:', error);
              // Laisser l'utilisateur tel quel en cas d'erreur
            }
          } else {
            setUser(null);
          }
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    console.log('Tentative de connexion avec:', { email });

    try {
      console.log('Appel à supabase.auth.signInWithPassword');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      console.log('Réponse de signInWithPassword:', { data, error });

      if (error) {
        console.error('Erreur d\'authentification:', error);
        setLoading(false);
        throw error;
      }

      console.log('Authentification réussie, utilisateur:', data.user);
      
      // Forcer la mise à jour de l'utilisateur directement plutôt que d'attendre l'écouteur
      try {
        const mappedUser = await mapSupabaseUser(data.user);
        setUser(mappedUser);
        console.log('Utilisateur mis à jour manuellement:', mappedUser);
      } catch (profileError) {
        console.error('Erreur lors de la récupération du profil:', profileError);
        // Créer un utilisateur par défaut si le profil ne peut pas être récupéré
        const defaultUser = {
          id: data.user.id,
          email: data.user.email || '',
          phoneNumber: '',
          firstName: '',
          lastName: '',
          role: 'client' as UserRole,
          createdAt: new Date().toISOString(),
        };
        setUser(defaultUser);
        console.log('Utilisateur par défaut utilisé:', defaultUser);
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('Exception lors de la connexion:', error);
      setLoading(false);
      throw error;
    }
  };

  const register = async (userData: Partial<User>, password: string): Promise<void> => {
    setLoading(true);

    try {
      // 1. Créer l'utilisateur dans Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email || '',
        password: password,
      });

      if (authError || !authData.user) {
        throw authError || new Error('Échec de la création du compte');
      }

      // 2. Ajouter les informations supplémentaires dans la table profiles
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email: userData.email || '',
        phone: userData.phoneNumber || null,
        first_name: userData.firstName || '',
        last_name: userData.lastName || '',
        role: userData.role || 'client',
        created_at: new Date().toISOString(),
      });

      if (profileError) {
        // Si l'insertion du profil échoue, on supprime l'utilisateur créé
        console.error('Erreur lors de la création du profil:', profileError);
        throw profileError;
      }

      // L'utilisateur sera mis à jour via l'écouteur onAuthStateChange
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      // L'utilisateur sera mis à jour via l'écouteur onAuthStateChange
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};