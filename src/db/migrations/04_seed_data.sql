-- 04_seed_data.sql
-- Script d'insertion des données initiales

-- Activer l'extension uuid-ossp si elle n'est pas déjà activée
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Déclaration des variables pour stocker les UUID générés
DO $$
DECLARE
  -- Rôles utilisateur
  role_client_id UUID := uuid_generate_v4();
  role_technician_id UUID := uuid_generate_v4();
  role_admin_id UUID := uuid_generate_v4();
  role_relay_point_id UUID := uuid_generate_v4();
  
  -- Statuts de réparation
  status_submitted_id UUID;
  status_received_id UUID;
  status_diagnosing_id UUID;
  status_waiting_approval_id UUID;
  status_repairing_id UUID;
  status_repaired_id UUID;
  status_ready_for_pickup_id UUID;
  status_delivered_id UUID;
  status_cancelled_id UUID;
  status_unrepairable_id UUID;
  
  -- Types d'appareils
  device_laptop_id UUID;
  device_desktop_id UUID;
  device_smartphone_id UUID;
  device_tablet_id UUID;
  device_printer_id UUID;
  device_console_id UUID;
  device_monitor_id UUID;
  device_network_id UUID;

BEGIN
  -- Insertion des rôles utilisateur
  INSERT INTO public.roles (id, name, description)
  VALUES
    (role_client_id, 'client', 'Utilisateur client qui soumet des demandes de réparation'),
    (role_technician_id, 'technician', 'Technicien qui effectue les réparations'),
    (role_admin_id, 'admin', 'Administrateur avec accès complet au système'),
    (role_relay_point_id, 'relayPoint', 'Gestionnaire de point relais');

  -- Insertion des statuts de réparation
  status_submitted_id := uuid_generate_v4();
  status_received_id := uuid_generate_v4();
  status_diagnosing_id := uuid_generate_v4();
  status_waiting_approval_id := uuid_generate_v4();
  status_repairing_id := uuid_generate_v4();
  status_repaired_id := uuid_generate_v4();
  status_ready_for_pickup_id := uuid_generate_v4();
  status_delivered_id := uuid_generate_v4();
  status_cancelled_id := uuid_generate_v4();
  status_unrepairable_id := uuid_generate_v4();
  
  INSERT INTO public.repair_statuses (id, code, label, description, color, order_index)
  VALUES
    (status_submitted_id, 'SUBMITTED', 'Soumise', 'La demande a été soumise par le client', '#3498db', 1),
    (status_received_id, 'RECEIVED', 'Reçue', 'L''appareil a été reçu par le point relais ou le technicien', '#f39c12', 2),
    (status_diagnosing_id, 'DIAGNOSING', 'En diagnostic', 'Le technicien est en train de diagnostiquer le problème', '#9b59b6', 3),
    (status_waiting_approval_id, 'WAITING_APPROVAL', 'En attente d''approbation', 'En attente de l''approbation du client pour les réparations', '#e74c3c', 4),
    (status_repairing_id, 'REPAIRING', 'En réparation', 'La réparation est en cours', '#f1c40f', 5),
    (status_repaired_id, 'REPAIRED', 'Réparée', 'La réparation est terminée', '#2ecc71', 6),
    (status_ready_for_pickup_id, 'READY_FOR_PICKUP', 'Prêt pour récupération', 'L''appareil est prêt à être récupéré', '#1abc9c', 7),
    (status_delivered_id, 'DELIVERED', 'Livré', 'L''appareil a été remis au client', '#27ae60', 8),
    (status_cancelled_id, 'CANCELLED', 'Annulée', 'La demande a été annulée', '#7f8c8d', 9),
    (status_unrepairable_id, 'UNREPAIRABLE', 'Non réparable', 'L''appareil ne peut pas être réparé', '#c0392b', 10);

  -- Insertion des types d'appareils
  device_laptop_id := uuid_generate_v4();
  device_desktop_id := uuid_generate_v4();
  device_smartphone_id := uuid_generate_v4();
  device_tablet_id := uuid_generate_v4();
  device_printer_id := uuid_generate_v4();
  device_console_id := uuid_generate_v4();
  device_monitor_id := uuid_generate_v4();
  device_network_id := uuid_generate_v4();
  
  INSERT INTO public.device_types (id, name, description, icon)
  VALUES
    (device_laptop_id, 'Ordinateur portable', 'Ordinateurs portables de toutes marques', 'laptop'),
    (device_desktop_id, 'Ordinateur de bureau', 'Ordinateurs fixes et tours', 'desktop'),
    (device_smartphone_id, 'Smartphone', 'Téléphones intelligents', 'smartphone'),
    (device_tablet_id, 'Tablette', 'Tablettes tactiles', 'tablet'),
    (device_printer_id, 'Imprimante', 'Imprimantes et scanners', 'printer'),
    (device_console_id, 'Console de jeu', 'Consoles de jeux vidéo', 'gamepad'),
    (device_monitor_id, 'Écran', 'Moniteurs et écrans', 'monitor'),
    (device_network_id, 'Périphérique réseau', 'Routeurs, modems et switches', 'wifi');

  -- Insertion des catégories de problèmes
  -- Pour les ordinateurs portables
  INSERT INTO public.problem_categories (id, name, description, device_type_id)
  VALUES
    (uuid_generate_v4(), 'Problème de démarrage', 'L''appareil ne s''allume pas ou ne démarre pas correctement', device_laptop_id),
    (uuid_generate_v4(), 'Écran cassé', 'L''écran est fissuré ou ne fonctionne pas', device_laptop_id),
    (uuid_generate_v4(), 'Batterie défectueuse', 'La batterie ne tient pas la charge ou ne se charge pas', device_laptop_id),
    (uuid_generate_v4(), 'Problème de surchauffe', 'L''appareil chauffe anormalement', device_laptop_id),
    (uuid_generate_v4(), 'Problème de disque dur', 'Le disque dur fait du bruit ou ne fonctionne pas', device_laptop_id),
    (uuid_generate_v4(), 'Problème de clavier', 'Certaines touches ne fonctionnent pas', device_laptop_id),
    (uuid_generate_v4(), 'Problème de connexion WiFi', 'La connexion WiFi ne fonctionne pas', device_laptop_id),
    (uuid_generate_v4(), 'Virus ou logiciel malveillant', 'L''appareil est infecté par un virus', device_laptop_id);
  
  -- Pour les ordinateurs de bureau
  INSERT INTO public.problem_categories (id, name, description, device_type_id)
  VALUES
    (uuid_generate_v4(), 'Problème d''alimentation', 'L''ordinateur ne s''allume pas', device_desktop_id),
    (uuid_generate_v4(), 'Carte graphique défectueuse', 'Problèmes d''affichage ou artefacts visuels', device_desktop_id),
    (uuid_generate_v4(), 'Problème de RAM', 'L''ordinateur est lent ou plante fréquemment', device_desktop_id),
    (uuid_generate_v4(), 'Ventilateur bruyant', 'Le ventilateur fait un bruit anormal', device_desktop_id);
  
  -- Pour les smartphones
  INSERT INTO public.problem_categories (id, name, description, device_type_id)
  VALUES
    (uuid_generate_v4(), 'Écran cassé', 'L''écran est fissuré ou ne fonctionne pas', device_smartphone_id),
    (uuid_generate_v4(), 'Batterie défectueuse', 'La batterie se décharge rapidement', device_smartphone_id),
    (uuid_generate_v4(), 'Problème de charge', 'Le téléphone ne se charge pas', device_smartphone_id),
    (uuid_generate_v4(), 'Problème de son', 'Les haut-parleurs ou le microphone ne fonctionnent pas', device_smartphone_id);

  -- Insertion des points relais
  INSERT INTO public.relay_points (id, name, address, city, postal_code, phone, email, opening_hours)
  VALUES
    (uuid_generate_v4(), 'PC Relais Paris Centre', '15 Rue de Rivoli', 'Paris', '75001', '0123456789', 'paris-centre@pcrelais.fr', 
     '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "10:00", "close": "17:00"}, "sunday": {"open": null, "close": null}}'),
    
    (uuid_generate_v4(), 'PC Relais Lyon', '25 Rue de la République', 'Lyon', '69002', '0234567890', 'lyon@pcrelais.fr', 
     '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "10:00", "close": "17:00"}, "sunday": {"open": null, "close": null}}'),
    
    (uuid_generate_v4(), 'PC Relais Marseille', '30 La Canebière', 'Marseille', '13001', '0345678901', 'marseille@pcrelais.fr', 
     '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "10:00", "close": "17:00"}, "sunday": {"open": null, "close": null}}'),
    
    (uuid_generate_v4(), 'PC Relais Bordeaux', '45 Cours de l''Intendance', 'Bordeaux', '33000', '0456789012', 'bordeaux@pcrelais.fr', 
     '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "10:00", "close": "17:00"}, "sunday": {"open": null, "close": null}}'),
    
    (uuid_generate_v4(), 'PC Relais Lille', '10 Rue Faidherbe', 'Lille', '59000', '0567890123', 'lille@pcrelais.fr', 
     '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "10:00", "close": "17:00"}, "sunday": {"open": null, "close": null}}');

  -- Insertion des pièces détachées
  INSERT INTO public.spare_parts (id, name, reference, price, stock, description)
  VALUES
    (uuid_generate_v4(), 'Batterie pour MacBook Pro 13"', 'BAT-MBP13-2019', 89.99, 15, 'Batterie de remplacement pour MacBook Pro 13" 2019-2020'),
    (uuid_generate_v4(), 'Écran LCD 15.6" Full HD', 'LCD-156-FHD', 129.99, 8, 'Écran de remplacement 15.6" Full HD pour ordinateurs portables'),
    (uuid_generate_v4(), 'Disque SSD 500GB', 'SSD-500GB', 79.99, 25, 'Disque SSD 500GB SATA III'),
    (uuid_generate_v4(), 'Mémoire RAM 8GB DDR4', 'RAM-8GB-DDR4', 45.99, 30, 'Barrette mémoire 8GB DDR4 2666MHz'),
    (uuid_generate_v4(), 'Ventilateur CPU', 'FAN-CPU', 29.99, 12, 'Ventilateur de remplacement pour processeur'),
    (uuid_generate_v4(), 'Clavier AZERTY pour HP', 'KB-HP-FR', 49.99, 10, 'Clavier AZERTY pour ordinateurs portables HP'),
    (uuid_generate_v4(), 'Écran iPhone 12', 'SCR-IP12', 149.99, 7, 'Écran de remplacement pour iPhone 12'),
    (uuid_generate_v4(), 'Batterie Samsung Galaxy S21', 'BAT-SGS21', 39.99, 18, 'Batterie de remplacement pour Samsung Galaxy S21');

END;
$$;

-- Création d'un déclencheur pour mettre à jour les timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le déclencheur à toutes les tables avec un champ updated_at
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT table_name 
    FROM information_schema.columns 
    WHERE column_name = 'updated_at' 
    AND table_schema = 'public'
  LOOP
    EXECUTE format('
      CREATE TRIGGER update_%I_timestamp
      BEFORE UPDATE ON public.%I
      FOR EACH ROW
      EXECUTE FUNCTION update_timestamp();
    ', t, t);
  END LOOP;
END;
$$;
