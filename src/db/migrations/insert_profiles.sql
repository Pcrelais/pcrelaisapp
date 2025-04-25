-- Script pour insérer les profils des utilisateurs déjà créés dans Supabase Auth
-- Utilise les UUID exacts des utilisateurs créés

-- Insérer les profils avec les UUID correspondants
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
)
VALUES
  -- Client (UUID exact de la base de données)
  ('c76451eb-2260-405a-9562-447d1e0786bf', 'Jean', 'Dupont', 'client@pcrelais.fr', '0612345678', '15 Rue de la Paix', 'Paris', '75001', 'client'),
  
  -- Technicien (UUID exact de la base de données)
  ('58644658-16d8-41f8-8aab-23b396987c21', 'Pierre', 'Martin', 'tech@pcrelais.fr', '0623456789', '25 Avenue des Champs-Élysées', 'Paris', '75008', 'technician'),
  
  -- Administrateur (UUID exact de la base de données)
  ('ae591011-2bfa-4dd2-a5f6-a7be9773c9c8', 'Sophie', 'Lefebvre', 'admin@pcrelais.fr', '0634567890', '10 Rue de Rivoli', 'Paris', '75004', 'admin'),
  
  -- Point Relais (UUID exact de la base de données)
  ('ceaf4d77-71f4-4e06-8d0b-d92e01efc255', 'Marc', 'Dubois', 'relais@pcrelais.fr', '0645678901', '30 Boulevard Haussmann', 'Paris', '75009', 'relayPoint');
