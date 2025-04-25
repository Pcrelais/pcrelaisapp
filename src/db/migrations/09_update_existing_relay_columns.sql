-- 09_update_existing_relay_columns.sql
-- Mettre à jour les colonnes drop_off_relay_id et pickup_relay_id pour les réparations existantes

-- Mettre à jour drop_off_relay_id avec relay_point_id pour les réparations existantes où drop_off_relay_id est null
UPDATE public.repair_requests
SET drop_off_relay_id = relay_point_id
WHERE drop_off_relay_id IS NULL AND relay_point_id IS NOT NULL;

-- Pour les réparations avec un statut READY_FOR_PICKUP ou DELIVERED, mettre à jour pickup_relay_id avec relay_point_id
UPDATE public.repair_requests
SET pickup_relay_id = relay_point_id
WHERE pickup_relay_id IS NULL 
AND relay_point_id IS NOT NULL
AND status_id IN (
    SELECT id FROM public.repair_statuses 
    WHERE code IN ('READY_FOR_PICKUP', 'DELIVERED')
);

-- Ajouter une politique pour permettre aux points relais de mettre à jour les réparations
DO $$
BEGIN
    -- Politique permettant aux points relais de mettre à jour les réparations
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'repair_requests' 
        AND policyname = 'Les points relais peuvent mettre à jour les réparations'
    ) THEN
        EXECUTE 'CREATE POLICY "Les points relais peuvent mettre à jour les réparations"
                ON public.repair_requests
                FOR UPDATE
                TO authenticated
                USING (
                    auth.uid() = relay_point_id OR
                    auth.uid() = drop_off_relay_id OR
                    auth.uid() = pickup_relay_id OR
                    auth.jwt() ->> ''role'' = ''admin'' OR
                    auth.jwt() ->> ''role'' = ''technician''
                )';
    END IF;
    
    -- Politique permettant aux points relais d'insérer des réparations
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'repair_requests' 
        AND policyname = 'Les points relais peuvent insérer des réparations'
    ) THEN
        EXECUTE 'CREATE POLICY "Les points relais peuvent insérer des réparations"
                ON public.repair_requests
                FOR INSERT
                TO authenticated
                WITH CHECK (
                    auth.jwt() ->> ''role'' = ''relayPoint'' OR
                    auth.jwt() ->> ''role'' = ''admin'' OR
                    auth.jwt() ->> ''role'' = ''technician''
                )';
    END IF;
END $$;
