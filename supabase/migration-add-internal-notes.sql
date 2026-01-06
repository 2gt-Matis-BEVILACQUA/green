-- Migration: Ajouter la colonne internal_note à la table incidents
-- Exécutez ce script dans l'éditeur SQL de Supabase

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' AND column_name = 'internal_note'
  ) THEN
    ALTER TABLE incidents ADD COLUMN internal_note TEXT;
  END IF;
END $$;

