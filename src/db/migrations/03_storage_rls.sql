-- 03_storage_rls.sql
-- Script de configuration du stockage et des politiques de sécurité RLS

-- Configuration des buckets de stockage
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES
  ('repair-images', 'Repair Images', false, false, 10485760, '{image/png,image/jpeg,image/gif,image/webp}'),
  ('repair-documents', 'Repair Documents', false, false, 20971520, '{application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain}'),
  ('chat-attachments', 'Chat Attachments', false, false, 15728640, '{image/png,image/jpeg,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain}'),
  ('profile-avatars', 'Profile Avatars', true, false, 5242880, '{image/png,image/jpeg,image/gif,image/webp}');

-- Politiques RLS pour les profils utilisateurs
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leur propre profil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Les administrateurs peuvent voir tous les profils"
  ON public.profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Les administrateurs peuvent modifier tous les profils"
  ON public.profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Politiques RLS pour les demandes de réparation
ALTER TABLE public.repair_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les clients peuvent voir leurs propres demandes"
  ON public.repair_requests FOR SELECT
  USING (client_id = auth.uid() OR 
         EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'technician')));

CREATE POLICY "Les clients peuvent créer des demandes"
  ON public.repair_requests FOR INSERT
  WITH CHECK (client_id = auth.uid() OR 
              EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Les techniciens peuvent modifier les demandes assignées"
  ON public.repair_requests FOR UPDATE
  USING (technician_id = auth.uid() OR 
         EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Politiques RLS pour les messages de chat
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir les messages des réparations auxquelles ils sont associés"
  ON public.chat_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.repair_requests 
    WHERE repair_requests.id = chat_messages.repair_id 
    AND (repair_requests.client_id = auth.uid() OR repair_requests.technician_id = auth.uid())
  ) OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Les utilisateurs peuvent envoyer des messages pour les réparations auxquelles ils sont associés"
  ON public.chat_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.repair_requests 
    WHERE repair_requests.id = chat_messages.repair_id 
    AND (repair_requests.client_id = auth.uid() OR repair_requests.technician_id = auth.uid())
  ) OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Politiques RLS pour les notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leurs propres notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Les utilisateurs peuvent marquer leurs notifications comme lues"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Note: Dans Supabase, nous ne pouvons pas utiliser OLD et NEW dans les politiques RLS
-- Pour restreindre les champs modifiables, nous utiliserons un déclencheur à la place

CREATE OR REPLACE FUNCTION check_notification_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier que seul le champ is_read est modifié
  IF (OLD.title != NEW.title) OR
     (OLD.message != NEW.message) OR
     (OLD.type != NEW.type) OR
     (OLD.link != NEW.link) OR
     (OLD.related_id != NEW.related_id) OR
     (OLD.related_type != NEW.related_type) OR
     (OLD.user_id != NEW.user_id) THEN
    RAISE EXCEPTION 'Seul le champ is_read peut être modifié';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_notification_update_trigger
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION check_notification_update();

-- Politiques RLS pour les fichiers de réparation
ALTER TABLE public.repair_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir les fichiers des réparations auxquelles ils sont associés"
  ON public.repair_files FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.repair_requests 
    WHERE repair_requests.id = repair_files.repair_id 
    AND (repair_requests.client_id = auth.uid() OR repair_requests.technician_id = auth.uid())
  ) OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ) OR is_public = true);

CREATE POLICY "Les utilisateurs peuvent télécharger des fichiers pour les réparations auxquelles ils sont associés"
  ON public.repair_files FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.repair_requests 
    WHERE repair_requests.id = repair_files.repair_id 
    AND (repair_requests.client_id = auth.uid() OR repair_requests.technician_id = auth.uid())
  ) OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Politiques de stockage
CREATE POLICY "Les utilisateurs authentifiés peuvent télécharger des images de réparation"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'repair-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

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
      EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

CREATE POLICY "Les utilisateurs authentifiés peuvent télécharger des documents de réparation"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'repair-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

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
      EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

CREATE POLICY "Les utilisateurs authentifiés peuvent télécharger des pièces jointes de chat"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'chat-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

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
      EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

CREATE POLICY "Les utilisateurs authentifiés peuvent télécharger leurs avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Tout le monde peut voir les avatars"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'profile-avatars'
  );
