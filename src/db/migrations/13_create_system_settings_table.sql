-- Création de la table des paramètres système
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Création d'une fonction pour vérifier si une table existe
CREATE OR REPLACE FUNCTION check_table_exists(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = $1
  ) INTO table_exists;
  
  RETURN table_exists;
END;
$$;

-- Autoriser l'accès à cette fonction pour tous les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION check_table_exists TO authenticated;

-- Ajouter des paramètres par défaut
INSERT INTO system_settings (key, value, description)
VALUES
  ('company_name', 'PC Relais', 'Nom de l''entreprise'),
  ('contact_email', 'contact@pcrelais.fr', 'Email de contact'),
  ('contact_phone', '01 23 45 67 89', 'Téléphone de contact'),
  ('default_repair_price', '49.99', 'Prix par défaut d''une réparation (€)'),
  ('max_repair_days', '14', 'Nombre maximum de jours pour une réparation')
ON CONFLICT (key) DO NOTHING;

-- Ajouter les politiques RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Politique pour les administrateurs (lecture et écriture)
CREATE POLICY admin_system_settings ON system_settings
  FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Politique pour les autres utilisateurs (lecture seule)
CREATE POLICY read_system_settings ON system_settings
  FOR SELECT
  USING (true);
