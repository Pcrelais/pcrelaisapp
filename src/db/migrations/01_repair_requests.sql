-- 01_repair_requests.sql
-- Script de création des tables liées aux demandes de réparation

-- Table des demandes de réparation
CREATE TABLE IF NOT EXISTS public.repair_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.profiles(id),
  technician_id UUID REFERENCES public.profiles(id),
  relay_point_id UUID REFERENCES public.relay_points(id),
  status_id UUID NOT NULL REFERENCES public.repair_statuses(id),
  device_type_id UUID REFERENCES public.device_types(id),
  problem_category_id UUID REFERENCES public.problem_categories(id),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT,
  purchase_date DATE,
  problem_description TEXT NOT NULL,
  diagnostic TEXT,
  solution TEXT,
  estimated_cost DECIMAL(10, 2),
  final_cost DECIMAL(10, 2),
  warranty_applicable BOOLEAN DEFAULT FALSE,
  estimated_completion_date DATE,
  completion_date DATE,
  drop_off_date TIMESTAMP WITH TIME ZONE,
  pickup_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des pièces détachées
CREATE TABLE IF NOT EXISTS public.spare_parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  reference TEXT,
  price DECIMAL(10, 2),
  stock INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de liaison entre réparations et pièces détachées
CREATE TABLE IF NOT EXISTS public.repair_spare_parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repair_id UUID NOT NULL REFERENCES public.repair_requests(id) ON DELETE CASCADE,
  spare_part_id UUID NOT NULL REFERENCES public.spare_parts(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(repair_id, spare_part_id)
);

-- Table des historiques de statut
CREATE TABLE IF NOT EXISTS public.repair_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repair_id UUID NOT NULL REFERENCES public.repair_requests(id) ON DELETE CASCADE,
  status_id UUID NOT NULL REFERENCES public.repair_statuses(id),
  changed_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des fichiers associés aux réparations
CREATE TABLE IF NOT EXISTS public.repair_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repair_id UUID NOT NULL REFERENCES public.repair_requests(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  thumbnail_path TEXT,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS repair_requests_client_id_idx ON public.repair_requests(client_id);
CREATE INDEX IF NOT EXISTS repair_requests_technician_id_idx ON public.repair_requests(technician_id);
CREATE INDEX IF NOT EXISTS repair_requests_relay_point_id_idx ON public.repair_requests(relay_point_id);
CREATE INDEX IF NOT EXISTS repair_requests_status_id_idx ON public.repair_requests(status_id);
CREATE INDEX IF NOT EXISTS repair_files_repair_id_idx ON public.repair_files(repair_id);
CREATE INDEX IF NOT EXISTS repair_status_history_repair_id_idx ON public.repair_status_history(repair_id);
