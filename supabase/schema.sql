-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Clubs table
CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom VARCHAR(255) NOT NULL,
  adresse TEXT,
  logo TEXT,
  whatsapp_number VARCHAR(20),
  api_key VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  hole_count INTEGER NOT NULL CHECK (hole_count > 0 AND hole_count <= 18),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  hole_number INTEGER NOT NULL CHECK (hole_number >= 1),
  loop VARCHAR(10) CHECK (loop IN ('Aller', 'Retour')),
  category VARCHAR(20) NOT NULL CHECK (category IN ('Arrosage', 'Tonte', 'Bunker', 'Signaletique', 'Autre')),
  description TEXT,
  photo_url TEXT,
  priority VARCHAR(10) NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  status VARCHAR(20) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In_Progress', 'Resolved')),
  reported_by VARCHAR(20),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_club_id ON courses(club_id);
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(is_active);
CREATE INDEX IF NOT EXISTS idx_incidents_club_id ON incidents(club_id);
CREATE INDEX IF NOT EXISTS idx_incidents_course_id ON incidents(course_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);

-- Enable Row Level Security (RLS) - À configurer selon vos besoins
-- ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- Enable Realtime for incidents table (Supabase Feature)
-- ALTER PUBLICATION supabase_realtime ADD TABLE incidents;

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for clubs.updated_at
CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON clubs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for courses.updated_at
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert a default club for testing (optional)
-- Utilisez un UUID fixe pour faciliter les tests
INSERT INTO clubs (id, nom, adresse, api_key)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'Golf de Résonance', 'Adresse du golf', 'default-api-key')
ON CONFLICT (id) DO NOTHING;

-- Insert default courses for testing
INSERT INTO courses (id, club_id, name, hole_count, is_active)
VALUES 
  ('10000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'L''Océan', 18, true),
  ('10000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'La Forêt', 9, true)
ON CONFLICT (id) DO NOTHING;

