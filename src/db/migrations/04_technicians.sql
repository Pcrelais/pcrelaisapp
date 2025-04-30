-- Create technicians table
CREATE TABLE technicians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  speciality TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  profile_id UUID REFERENCES profiles(id),
  hourly_rate DECIMAL(10, 2),
  availability TEXT,
  notes TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  assigned_relay_id UUID REFERENCES relay_points(id),
  service_radius_km INTEGER DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read technicians
CREATE POLICY "Technicians are viewable by everyone" ON technicians
  FOR SELECT USING (true);

-- Allow authenticated users with admin role to insert/update/delete
CREATE POLICY "Admins can manage technicians" ON technicians
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Insert initial technician (Pierre Martin)
INSERT INTO technicians (
  id, first_name, last_name, email, phone, speciality, 
  hourly_rate, availability, notes, is_active, 
  address, city, postal_code, latitude, longitude, 
  assigned_relay_id, service_radius_km, 
  profile_id, created_at, updated_at
)
VALUES (
  '58644658-16d8-41f8-8aab-23b396987c21', 'Pierre', 'Martin', 'pierre.martin@pcrelais.fr', '+33612345678', 'Réparation PC', 
  45.00, 'Lundi-Vendredi, 9h-18h', 'Technicien principal', TRUE, 
  '34 Rue de la République', 'Le Grand-Lemps', '38690', 45.395309, 5.418730, 
  'ceaf4d77-71f4-4e06-8d0b-d92e01efc255', 25, 
  NULL, NOW(), NOW()
);

-- Create function to get technician by ID
CREATE OR REPLACE FUNCTION get_technician_by_id(technician_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT json_build_object(
    'id', id,
    'first_name', first_name,
    'last_name', last_name,
    'email', email,
    'phone', phone,
    'speciality', speciality,
    'hourly_rate', hourly_rate,
    'availability', availability,
    'notes', notes,
    'is_active', is_active,
    'profile_id', profile_id,
    'address', address,
    'city', city,
    'postal_code', postal_code,
    'latitude', latitude,
    'longitude', longitude,
    'assigned_relay_id', assigned_relay_id,
    'service_radius_km', service_radius_km
  ) INTO result
  FROM technicians
  WHERE id = technician_id;
  
  RETURN result;
END;
$$;
