-- 06_relay_point_rls.sql
-- Script pour ajouter des politiques RLS permettant aux points relais de gérer les réparations

-- Politique permettant aux points relais de voir toutes les réparations
CREATE POLICY "Les points relais peuvent voir toutes les réparations"
  ON public.repair_requests FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'relayPoint'));

-- Politique permettant aux points relais de créer des réparations
CREATE POLICY "Les points relais peuvent créer des réparations"
  ON public.repair_requests FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'relayPoint'));

-- Politique permettant aux points relais de mettre à jour les réparations
CREATE POLICY "Les points relais peuvent mettre à jour les réparations"
  ON public.repair_requests FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'relayPoint'));

-- Politique permettant aux points relais de voir les codes de réparation
CREATE POLICY "Les points relais peuvent voir les codes de réparation"
  ON public.repair_codes FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'relayPoint'));

-- Politique permettant aux points relais de mettre à jour les codes de réparation
CREATE POLICY "Les points relais peuvent mettre à jour les codes de réparation"
  ON public.repair_codes FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'relayPoint'));
