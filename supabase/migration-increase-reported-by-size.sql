-- Migration: Augmenter la taille de la colonne 'reported_by' dans la table incidents
-- Exécutez ce script dans l'éditeur SQL de Supabase

DO $$ 
BEGIN
  -- Vérifier la taille actuelle et l'augmenter si nécessaire
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' 
    AND column_name = 'reported_by'
    AND character_maximum_length < 50
  ) THEN
    -- Augmenter la taille à 50 caractères pour accommoder les numéros WhatsApp complets
    ALTER TABLE incidents 
    ALTER COLUMN reported_by TYPE VARCHAR(50);
    
    RAISE NOTICE '✅ Colonne "reported_by" agrandie à VARCHAR(50)';
  ELSE
    RAISE NOTICE 'ℹ️  La colonne "reported_by" a déjà une taille suffisante (>= 50)';
  END IF;
END $$;

