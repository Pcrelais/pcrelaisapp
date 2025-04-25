-- 08_client_visibility_rls.sql
-- Ajouter des politiques RLS pour permettre aux points relais de voir les informations des clients

-- Vérifier si la politique existe déjà
DO $$
BEGIN
    -- Politique permettant aux points relais de voir les informations des clients
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Les points relais peuvent voir les informations des clients'
    ) THEN
        EXECUTE 'CREATE POLICY "Les points relais peuvent voir les informations des clients"
                ON public.profiles
                FOR SELECT
                TO authenticated
                USING (
                    auth.jwt() ->> ''role'' = ''relayPoint'' OR 
                    auth.jwt() ->> ''role'' = ''admin'' OR 
                    auth.jwt() ->> ''role'' = ''technician'' OR
                    auth.uid() = id
                )';
    END IF;
END $$;
