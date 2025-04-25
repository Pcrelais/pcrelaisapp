-- 10_add_client_name_columns.sql
-- Ajouter les colonnes pour stocker directement le nom et prénom du client dans la table repair_requests

-- Vérifier si les colonnes existent déjà
DO $$
BEGIN
    -- Ajouter la colonne client_first_name si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'repair_requests' 
        AND column_name = 'client_first_name'
    ) THEN
        ALTER TABLE public.repair_requests 
        ADD COLUMN client_first_name VARCHAR(255);
    END IF;

    -- Ajouter la colonne client_last_name si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'repair_requests' 
        AND column_name = 'client_last_name'
    ) THEN
        ALTER TABLE public.repair_requests 
        ADD COLUMN client_last_name VARCHAR(255);
    END IF;
END $$;

-- Mettre à jour les colonnes client_first_name et client_last_name pour les réparations existantes
UPDATE public.repair_requests r
SET 
    client_first_name = p.first_name,
    client_last_name = p.last_name
FROM public.profiles p
WHERE r.client_id = p.id
AND (r.client_first_name IS NULL OR r.client_last_name IS NULL);

-- Ajouter un trigger pour mettre à jour automatiquement client_first_name et client_last_name lors de l'insertion ou la mise à jour
CREATE OR REPLACE FUNCTION update_client_names()
RETURNS TRIGGER AS $$
BEGIN
    -- Récupérer les noms du client depuis la table profiles
    IF NEW.client_id IS NOT NULL THEN
        SELECT first_name, last_name INTO NEW.client_first_name, NEW.client_last_name
        FROM public.profiles
        WHERE id = NEW.client_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS update_client_names_trigger ON public.repair_requests;

-- Créer le trigger
CREATE TRIGGER update_client_names_trigger
BEFORE INSERT OR UPDATE OF client_id ON public.repair_requests
FOR EACH ROW
EXECUTE FUNCTION update_client_names();
