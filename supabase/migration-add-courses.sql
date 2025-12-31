-- Migration: Ajouter la table courses et mettre à jour incidents
-- Exécutez ce script dans l'éditeur SQL de Supabase SI vous avez déjà créé la table incidents

-- 1. Créer la table courses (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  hole_count INTEGER NOT NULL CHECK (hole_count > 0 AND hole_count <= 18),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Créer les index pour courses
CREATE INDEX IF NOT EXISTS idx_courses_club_id ON courses(club_id);
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(is_active);

-- 3. Insérer des parcours par défaut AVANT de modifier incidents
INSERT INTO courses (id, club_id, name, hole_count, is_active)
VALUES 
  ('10000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'L''Océan', 18, true),
  ('10000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'La Forêt', 9, true)
ON CONFLICT (id) DO NOTHING;

-- 4. Ajouter la colonne course_id à incidents (si elle n'existe pas)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' AND column_name = 'course_id'
  ) THEN
    -- Ajouter la colonne comme nullable d'abord
    ALTER TABLE incidents ADD COLUMN course_id UUID;
    
    -- Mettre à jour les incidents existants pour les lier au parcours par défaut
    UPDATE incidents 
    SET course_id = '10000000-0000-0000-0000-000000000001'::uuid
    WHERE course_id IS NULL;
    
    -- Maintenant rendre la colonne NOT NULL
    ALTER TABLE incidents ALTER COLUMN course_id SET NOT NULL;
    
    -- Ajouter la contrainte FOREIGN KEY
    ALTER TABLE incidents 
      ADD CONSTRAINT fk_incidents_course_id FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 5. Créer l'index pour course_id (si nécessaire)
CREATE INDEX IF NOT EXISTS idx_incidents_course_id ON incidents(course_id);

-- 6. Créer le trigger pour courses.updated_at
DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
