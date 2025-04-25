-- Création de la table files pour stocker les fichiers liés aux réparations
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repair_id UUID NOT NULL REFERENCES repair_requests(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter les politiques RLS pour la table files
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux administrateurs de voir tous les fichiers
CREATE POLICY admin_select_files ON files
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Politique pour permettre aux techniciens de voir les fichiers des réparations qui leur sont assignées
CREATE POLICY technician_select_files ON files
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM repair_requests
      WHERE repair_requests.id = files.repair_id
      AND repair_requests.technician_id = auth.uid()
    )
  );

-- Politique pour permettre aux points relais de voir les fichiers des réparations déposées ou à récupérer chez eux
CREATE POLICY relay_select_files ON files
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM repair_requests
      WHERE repair_requests.id = files.repair_id
      AND (
        repair_requests.drop_off_relay_id = auth.uid()
        OR repair_requests.pickup_relay_id = auth.uid()
      )
    )
  );

-- Politique pour permettre aux clients de voir leurs propres fichiers
CREATE POLICY client_select_files ON files
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM repair_requests
      WHERE repair_requests.id = files.repair_id
      AND repair_requests.client_id = auth.uid()
    )
  );

-- Politique pour permettre aux administrateurs et techniciens d'insérer des fichiers
CREATE POLICY admin_technician_insert_files ON files
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'technician')
    )
  );

-- Politique pour permettre aux administrateurs et techniciens de supprimer des fichiers
CREATE POLICY admin_technician_delete_files ON files
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'technician')
    )
  );

-- Créer un index sur repair_id pour accélérer les recherches
CREATE INDEX idx_files_repair_id ON files(repair_id);

-- Autoriser l'accès à la table files pour les utilisateurs authentifiés
GRANT ALL ON files TO authenticated;
