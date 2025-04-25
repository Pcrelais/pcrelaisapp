-- fix_rls_recursion.sql
-- Script pour corriger la récursion infinie dans les politiques RLS

-- Suppression des politiques problématiques
DROP POLICY IF EXISTS "Les administrateurs peuvent voir tous les profils" ON public.profiles;
DROP POLICY IF EXISTS "Les administrateurs peuvent modifier tous les profils" ON public.profiles;

-- Création d'une fonction pour vérifier si un utilisateur est administrateur sans causer de récursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Utiliser directement auth.uid() pour éviter la récursion
  -- Cette fonction vérifie le rôle directement dans la table profiles sans passer par les politiques RLS
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréation des politiques en utilisant la fonction is_admin()
CREATE POLICY "Les administrateurs peuvent voir tous les profils"
  ON public.profiles FOR SELECT
  USING (public.is_admin() OR auth.uid() = id);

CREATE POLICY "Les administrateurs peuvent modifier tous les profils"
  ON public.profiles FOR UPDATE
  USING (public.is_admin() OR auth.uid() = id);

-- Mise à jour des autres politiques qui utilisent la même vérification
-- Repair Requests
DROP POLICY IF EXISTS "Les clients peuvent voir leurs propres demandes" ON public.repair_requests;
CREATE POLICY "Les clients peuvent voir leurs propres demandes"
  ON public.repair_requests FOR SELECT
  USING (client_id = auth.uid() OR technician_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Les clients peuvent créer des demandes" ON public.repair_requests;
CREATE POLICY "Les clients peuvent créer des demandes"
  ON public.repair_requests FOR INSERT
  WITH CHECK (client_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Les techniciens peuvent modifier les demandes assignées" ON public.repair_requests;
CREATE POLICY "Les techniciens peuvent modifier les demandes assignées"
  ON public.repair_requests FOR UPDATE
  USING (technician_id = auth.uid() OR public.is_admin());

-- Chat Messages
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir les messages des réparations auxquelles ils sont associés" ON public.chat_messages;
CREATE POLICY "Les utilisateurs peuvent voir les messages des réparations auxquelles ils sont associés"
  ON public.chat_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.repair_requests 
    WHERE repair_requests.id = chat_messages.repair_id 
    AND (repair_requests.client_id = auth.uid() OR repair_requests.technician_id = auth.uid())
  ) OR public.is_admin());

DROP POLICY IF EXISTS "Les utilisateurs peuvent envoyer des messages pour les réparations auxquelles ils sont associés" ON public.chat_messages;
CREATE POLICY "Les utilisateurs peuvent envoyer des messages pour les réparations auxquelles ils sont associés"
  ON public.chat_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.repair_requests 
    WHERE repair_requests.id = chat_messages.repair_id 
    AND (repair_requests.client_id = auth.uid() OR repair_requests.technician_id = auth.uid())
  ) OR public.is_admin());

-- Repair Files
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir les fichiers des réparations auxquelles ils sont associés" ON public.repair_files;
CREATE POLICY "Les utilisateurs peuvent voir les fichiers des réparations auxquelles ils sont associés"
  ON public.repair_files FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.repair_requests 
    WHERE repair_requests.id = repair_files.repair_id 
    AND (repair_requests.client_id = auth.uid() OR repair_requests.technician_id = auth.uid())
  ) OR public.is_admin() OR is_public = true);

DROP POLICY IF EXISTS "Les utilisateurs peuvent télécharger des fichiers pour les réparations auxquelles ils sont associés" ON public.repair_files;
CREATE POLICY "Les utilisateurs peuvent télécharger des fichiers pour les réparations auxquelles ils sont associés"
  ON public.repair_files FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.repair_requests 
    WHERE repair_requests.id = repair_files.repair_id 
    AND (repair_requests.client_id = auth.uid() OR repair_requests.technician_id = auth.uid())
  ) OR public.is_admin());

-- Mise à jour des politiques de stockage
-- Repair Images
DROP POLICY IF EXISTS "Les utilisateurs peuvent accéder à leurs propres images de réparation" ON storage.objects;
CREATE POLICY "Les utilisateurs peuvent accéder à leurs propres images de réparation"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'repair-images' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      EXISTS (
        SELECT 1 FROM public.repair_requests
        WHERE repair_requests.id::text = (storage.foldername(name))[2]
        AND (repair_requests.client_id = auth.uid() OR repair_requests.technician_id = auth.uid())
      ) OR
      public.is_admin()
    )
  );

-- Repair Documents
DROP POLICY IF EXISTS "Les utilisateurs peuvent accéder à leurs propres documents de réparation" ON storage.objects;
CREATE POLICY "Les utilisateurs peuvent accéder à leurs propres documents de réparation"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'repair-documents' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      EXISTS (
        SELECT 1 FROM public.repair_requests
        WHERE repair_requests.id::text = (storage.foldername(name))[2]
        AND (repair_requests.client_id = auth.uid() OR repair_requests.technician_id = auth.uid())
      ) OR
      public.is_admin()
    )
  );

-- Chat Attachments
DROP POLICY IF EXISTS "Les utilisateurs peuvent accéder aux pièces jointes de chat des conversations auxquelles ils participent" ON storage.objects;
CREATE POLICY "Les utilisateurs peuvent accéder aux pièces jointes de chat des conversations auxquelles ils participent"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'chat-attachments' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      EXISTS (
        SELECT 1 FROM public.repair_requests
        WHERE repair_requests.id::text = (storage.foldername(name))[2]
        AND (repair_requests.client_id = auth.uid() OR repair_requests.technician_id = auth.uid())
      ) OR
      public.is_admin()
    )
  );
