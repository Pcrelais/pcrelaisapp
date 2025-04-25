-- 07_add_relay_columns.sql
-- Ajouter les colonnes pour les points relais de dépôt et de récupération

-- Vérifier si les colonnes existent déjà
DO $$
BEGIN
    -- Ajouter la colonne drop_off_relay_id si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'repair_requests' 
        AND column_name = 'drop_off_relay_id'
    ) THEN
        ALTER TABLE public.repair_requests 
        ADD COLUMN drop_off_relay_id UUID REFERENCES public.profiles(id);
        
        -- Créer un index pour améliorer les performances
        CREATE INDEX IF NOT EXISTS repair_requests_drop_off_relay_id_idx 
        ON public.repair_requests(drop_off_relay_id);
    END IF;

    -- Ajouter la colonne pickup_relay_id si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'repair_requests' 
        AND column_name = 'pickup_relay_id'
    ) THEN
        ALTER TABLE public.repair_requests 
        ADD COLUMN pickup_relay_id UUID REFERENCES public.profiles(id);
        
        -- Créer un index pour améliorer les performances
        CREATE INDEX IF NOT EXISTS repair_requests_pickup_relay_id_idx 
        ON public.repair_requests(pickup_relay_id);
    END IF;
END $$;

-- Ajouter des politiques RLS pour les nouvelles colonnes
ALTER TABLE public.repair_requests ENABLE ROW LEVEL SECURITY;

-- Vérifier si la politique existe déjà
DO $$
BEGIN
    -- Politique permettant aux points relais de voir les réparations associées à eux via drop_off_relay_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'repair_requests' 
        AND policyname = 'Les points relais peuvent voir les réparations associées à eux via drop_off_relay_id'
    ) THEN
        EXECUTE 'CREATE POLICY "Les points relais peuvent voir les réparations associées à eux via drop_off_relay_id"
                ON public.repair_requests
                FOR SELECT
                TO authenticated
                USING (
                    auth.uid() = drop_off_relay_id OR 
                    auth.jwt() ->> ''role'' = ''admin'' OR 
                    auth.jwt() ->> ''role'' = ''technician''
                )';
    END IF;
    
    -- Politique permettant aux points relais de voir les réparations associées à eux via pickup_relay_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'repair_requests' 
        AND policyname = 'Les points relais peuvent voir les réparations associées à eux via pickup_relay_id'
    ) THEN
        EXECUTE 'CREATE POLICY "Les points relais peuvent voir les réparations associées à eux via pickup_relay_id"
                ON public.repair_requests
                FOR SELECT
                TO authenticated
                USING (
                    auth.uid() = pickup_relay_id OR 
                    auth.jwt() ->> ''role'' = ''admin'' OR 
                    auth.jwt() ->> ''role'' = ''technician''
                )';
    END IF;
END $$;
