-- 05_test_users.sql
-- Script pour créer des utilisateurs de test pour chaque rôle

-- Note: La création d'utilisateurs dans Supabase nécessite des étapes spéciales
-- car les mots de passe doivent être hashés correctement et les entrées doivent être
-- créées à la fois dans auth.users et dans public.profiles

-- Activer l'extension uuid-ossp si elle n'est pas déjà activée
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fonction pour créer un utilisateur de test complet
CREATE OR REPLACE FUNCTION create_test_user(
  email TEXT,
  password TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT,
  phone TEXT DEFAULT NULL,
  address TEXT DEFAULT NULL,
  city TEXT DEFAULT NULL,
  postal_code TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Insérer l'utilisateur dans auth.users
  -- Note: Nous utilisons la fonction d'API de Supabase pour créer l'utilisateur correctement
  INSERT INTO auth.users (
    id,
    email,
    raw_user_meta_data,
    email_confirmed_at,
    created_at,
    updated_at,
    last_sign_in_at,
    raw_app_meta_data
  ) VALUES (
    uuid_generate_v4(),
    email,
    jsonb_build_object('first_name', first_name, 'last_name', last_name),
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email'])
  )
  RETURNING id INTO user_id;

  -- Mettre à jour le mot de passe hashé
  -- Note: Dans un environnement réel, vous devriez utiliser l'API Supabase pour cela
  -- car elle gère correctement le hachage des mots de passe
  UPDATE auth.users
  SET encrypted_password = crypt(password, gen_salt('bf'))
  WHERE id = user_id;

  -- Insérer les informations du profil
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    email,
    phone,
    address,
    city,
    postal_code,
    role
  ) VALUES (
    user_id,
    first_name,
    last_name,
    email,
    phone,
    address,
    city,
    postal_code,
    role
  );

  RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- Créer des utilisateurs de test pour chaque rôle
DO $$
BEGIN
  -- Client
  PERFORM create_test_user(
    'client@pcrelais.fr',
    'password123',
    'Jean',
    'Dupont',
    'client',
    '0612345678',
    '15 Rue de la Paix',
    'Paris',
    '75001'
  );

  -- Technicien
  PERFORM create_test_user(
    'tech@pcrelais.fr',
    'password123',
    'Pierre',
    'Martin',
    'technician',
    '0623456789',
    '25 Avenue des Champs-Élysées',
    'Paris',
    '75008'
  );

  -- Administrateur
  PERFORM create_test_user(
    'admin@pcrelais.fr',
    'password123',
    'Sophie',
    'Lefebvre',
    'admin',
    '0634567890',
    '10 Rue de Rivoli',
    'Paris',
    '75004'
  );

  -- Point Relais
  PERFORM create_test_user(
    'relais@pcrelais.fr',
    'password123',
    'Marc',
    'Dubois',
    'relayPoint',
    '0645678901',
    '30 Boulevard Haussmann',
    'Paris',
    '75009'
  );
END;
$$;

-- Supprimer la fonction temporaire
DROP FUNCTION IF EXISTS create_test_user;

-- Note importante: Ce script est fourni à titre d'exemple et peut nécessiter des ajustements
-- en fonction de la configuration spécifique de Supabase. Dans un environnement de production,
-- il est recommandé d'utiliser l'API Supabase ou l'interface d'administration pour créer des utilisateurs.
