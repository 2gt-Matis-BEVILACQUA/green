-- Migration: Créer la table chat_sessions pour gérer les conversations WhatsApp
-- Exécutez ce script dans l'éditeur SQL de Supabase

CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number VARCHAR(20) NOT NULL,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  state VARCHAR(50) NOT NULL DEFAULT 'AWAITING_COURSE',
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  hole_number INTEGER CHECK (hole_number >= 1 AND hole_number <= 18),
  description TEXT,
  category VARCHAR(20) CHECK (category IN ('Arrosage', 'Tonte', 'Bunker', 'Signaletique', 'Autre')),
  priority VARCHAR(10) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  photo_url TEXT,
  incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(phone_number, club_id)
);

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_chat_sessions_phone_number ON chat_sessions(phone_number);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_club_id ON chat_sessions(club_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_state ON chat_sessions(state);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_activity ON chat_sessions(last_activity);

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour nettoyer les sessions expirées (30 minutes)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM chat_sessions
  WHERE last_activity < NOW() - INTERVAL '30 minutes'
    AND state != 'COMPLETED';
END;
$$ LANGUAGE plpgsql;

