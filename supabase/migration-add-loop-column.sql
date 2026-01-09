-- Migration: Ajouter la colonne 'loop' à la table incidents
-- Exécutez ce script dans l'éditeur SQL de Supabase

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' AND column_name = 'loop'
  ) THEN
    -- Ajouter la colonne loop
    ALTER TABLE incidents 
    ADD COLUMN loop VARCHAR(10) CHECK (loop IN ('Aller', 'Retour'));
    
    RAISE NOTICE '✅ Colonne "loop" ajoutée à la table incidents';
  ELSE
    RAISE NOTICE 'ℹ️  La colonne "loop" existe déjà dans la table incidents';
  END IF;
END $$;

