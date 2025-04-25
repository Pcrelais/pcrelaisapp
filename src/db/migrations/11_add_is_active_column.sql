-- Ajouter la colonne is_active à la table profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Créer une politique permettant aux administrateurs de mettre à jour le statut des techniciens
CREATE POLICY update_technician_status ON profiles
    FOR UPDATE
    USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
    WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin') AND (role = 'technician'));

-- Ajouter une colonne specialization pour les techniciens
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialization TEXT;
