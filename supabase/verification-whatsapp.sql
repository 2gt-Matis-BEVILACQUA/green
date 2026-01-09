-- ============================================
-- SCRIPT DE VÉRIFICATION SUPABASE WHATSAPP
-- ============================================
-- Exécutez ce script dans l'éditeur SQL de Supabase
-- pour vérifier que tout est correctement configuré
-- ============================================

-- 1. VÉRIFICATION DES TABLES OBLIGATOIRES
-- ============================================

-- Vérifier que la table 'clubs' existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clubs') THEN
    RAISE EXCEPTION '❌ ERREUR: La table "clubs" n''existe pas. Exécutez d''abord schema.sql';
  ELSE
    RAISE NOTICE '✅ Table "clubs" existe';
  END IF;
END $$;

-- Vérifier que la table 'courses' existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'courses') THEN
    RAISE EXCEPTION '❌ ERREUR: La table "courses" n''existe pas. Exécutez d''abord schema.sql';
  ELSE
    RAISE NOTICE '✅ Table "courses" existe';
  END IF;
END $$;

-- Vérifier que la table 'incidents' existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'incidents') THEN
    RAISE EXCEPTION '❌ ERREUR: La table "incidents" n''existe pas. Exécutez d''abord schema.sql';
  ELSE
    RAISE NOTICE '✅ Table "incidents" existe';
  END IF;
END $$;

-- Vérifier que la table 'chat_sessions' existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chat_sessions') THEN
    RAISE EXCEPTION '❌ ERREUR: La table "chat_sessions" n''existe pas. Exécutez migration-chat-sessions.sql';
  ELSE
    RAISE NOTICE '✅ Table "chat_sessions" existe';
  END IF;
END $$;

-- 2. VÉRIFICATION DES COLONNES DE LA TABLE 'clubs'
-- ============================================

DO $$
DECLARE
  missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Vérifier les colonnes obligatoires
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'id') THEN
    missing_columns := array_append(missing_columns, 'id');
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'whatsapp_number') THEN
    missing_columns := array_append(missing_columns, 'whatsapp_number');
  END IF;
  
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION '❌ ERREUR: Colonnes manquantes dans "clubs": %', array_to_string(missing_columns, ', ');
  ELSE
    RAISE NOTICE '✅ Toutes les colonnes requises existent dans "clubs"';
  END IF;
END $$;

-- 3. VÉRIFICATION DES COLONNES DE LA TABLE 'courses'
-- ============================================

DO $$
DECLARE
  missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'id') THEN
    missing_columns := array_append(missing_columns, 'id');
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'club_id') THEN
    missing_columns := array_append(missing_columns, 'club_id');
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'name') THEN
    missing_columns := array_append(missing_columns, 'name');
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'hole_count') THEN
    missing_columns := array_append(missing_columns, 'hole_count');
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'is_active') THEN
    missing_columns := array_append(missing_columns, 'is_active');
  END IF;
  
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION '❌ ERREUR: Colonnes manquantes dans "courses": %', array_to_string(missing_columns, ', ');
  ELSE
    RAISE NOTICE '✅ Toutes les colonnes requises existent dans "courses"';
  END IF;
END $$;

-- 4. VÉRIFICATION DES COLONNES DE LA TABLE 'incidents'
-- ============================================

DO $$
DECLARE
  missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'id') THEN
    missing_columns := array_append(missing_columns, 'id');
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'club_id') THEN
    missing_columns := array_append(missing_columns, 'club_id');
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'course_id') THEN
    missing_columns := array_append(missing_columns, 'course_id');
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'hole_number') THEN
    missing_columns := array_append(missing_columns, 'hole_number');
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'category') THEN
    missing_columns := array_append(missing_columns, 'category');
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'description') THEN
    missing_columns := array_append(missing_columns, 'description');
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'photo_url') THEN
    missing_columns := array_append(missing_columns, 'photo_url');
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'priority') THEN
    missing_columns := array_append(missing_columns, 'priority');
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'status') THEN
    missing_columns := array_append(missing_columns, 'status');
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'reported_by') THEN
    missing_columns := array_append(missing_columns, 'reported_by');
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'loop') THEN
    missing_columns := array_append(missing_columns, 'loop');
  END IF;
  
  -- Vérifier la colonne internal_note (optionnelle mais recommandée)
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'internal_note') THEN
    RAISE NOTICE '⚠️  ATTENTION: La colonne "internal_note" n''existe pas. Exécutez migration-add-internal-notes.sql';
  ELSE
    RAISE NOTICE '✅ Colonne "internal_note" existe dans "incidents"';
  END IF;
  
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION '❌ ERREUR: Colonnes manquantes dans "incidents": %', array_to_string(missing_columns, ', ');
  ELSE
    RAISE NOTICE '✅ Toutes les colonnes requises existent dans "incidents"';
  END IF;
END $$;

-- 5. VÉRIFICATION DES COLONNES DE LA TABLE 'chat_sessions'
-- ============================================

DO $$
DECLARE
  missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'chat_sessions' AND column_name = 'id') THEN
    missing_columns := array_append(missing_columns, 'id');
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'chat_sessions' AND column_name = 'phone_number') THEN
    missing_columns := array_append(missing_columns, 'phone_number');
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'chat_sessions' AND column_name = 'club_id') THEN
    missing_columns := array_append(missing_columns, 'club_id');
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'chat_sessions' AND column_name = 'state') THEN
    missing_columns := array_append(missing_columns, 'state');
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'chat_sessions' AND column_name = 'course_id') THEN
    missing_columns := array_append(missing_columns, 'course_id');
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'chat_sessions' AND column_name = 'hole_number') THEN
    missing_columns := array_append(missing_columns, 'hole_number');
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'chat_sessions' AND column_name = 'description') THEN
    missing_columns := array_append(missing_columns, 'description');
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'chat_sessions' AND column_name = 'category') THEN
    missing_columns := array_append(missing_columns, 'category');
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'chat_sessions' AND column_name = 'priority') THEN
    missing_columns := array_append(missing_columns, 'priority');
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'chat_sessions' AND column_name = 'photo_url') THEN
    missing_columns := array_append(missing_columns, 'photo_url');
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'chat_sessions' AND column_name = 'last_activity') THEN
    missing_columns := array_append(missing_columns, 'last_activity');
  END IF;
  
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION '❌ ERREUR: Colonnes manquantes dans "chat_sessions": %', array_to_string(missing_columns, ', ');
  ELSE
    RAISE NOTICE '✅ Toutes les colonnes requises existent dans "chat_sessions"';
  END IF;
END $$;

-- 6. VÉRIFICATION DES CONTRAINTES ET INDEX
-- ============================================

-- Vérifier l'index unique sur (phone_number, club_id) dans chat_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'chat_sessions' 
    AND indexname LIKE '%phone_number%club_id%'
  ) THEN
    RAISE NOTICE '⚠️  ATTENTION: Index unique sur (phone_number, club_id) manquant dans chat_sessions';
  ELSE
    RAISE NOTICE '✅ Index unique sur (phone_number, club_id) existe';
  END IF;
END $$;

-- 7. VÉRIFICATION DES DONNÉES DE TEST
-- ============================================

-- Vérifier qu'il y a au moins un club
DO $$
DECLARE
  club_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO club_count FROM clubs;
  IF club_count = 0 THEN
    RAISE NOTICE '⚠️  ATTENTION: Aucun club dans la base de données. Créez un club avec un numéro WhatsApp.';
  ELSE
    RAISE NOTICE '✅ % club(s) trouvé(s)', club_count;
  END IF;
END $$;

-- Vérifier qu'il y a au moins un parcours actif
DO $$
DECLARE
  course_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO course_count FROM courses WHERE is_active = true;
  IF course_count = 0 THEN
    RAISE NOTICE '⚠️  ATTENTION: Aucun parcours actif. Créez au moins un parcours avec is_active = true.';
  ELSE
    RAISE NOTICE '✅ % parcours actif(s) trouvé(s)', course_count;
  END IF;
END $$;

-- Vérifier que les clubs ont un numéro WhatsApp configuré
DO $$
DECLARE
  clubs_without_whatsapp INTEGER;
BEGIN
  SELECT COUNT(*) INTO clubs_without_whatsapp 
  FROM clubs 
  WHERE whatsapp_number IS NULL OR whatsapp_number = '';
  
  IF clubs_without_whatsapp > 0 THEN
    RAISE NOTICE '⚠️  ATTENTION: % club(s) sans numéro WhatsApp configuré. Configurez whatsapp_number dans la table clubs.', clubs_without_whatsapp;
  ELSE
    RAISE NOTICE '✅ Tous les clubs ont un numéro WhatsApp configuré';
  END IF;
END $$;

-- 8. AFFICHER UN RÉSUMÉ DES CLUBS ET PARCOURS
-- ============================================

SELECT 
  '📊 RÉSUMÉ DES CLUBS' AS info,
  id,
  nom,
  whatsapp_number,
  CASE 
    WHEN whatsapp_number IS NULL OR whatsapp_number = '' THEN '❌ Non configuré'
    ELSE '✅ Configuré'
  END AS whatsapp_status
FROM clubs;

SELECT 
  '📊 RÉSUMÉ DES PARCOURS' AS info,
  c.id,
  c.name,
  c.hole_count,
  c.is_active,
  cl.nom AS club_name
FROM courses c
JOIN clubs cl ON c.club_id = cl.id
ORDER BY cl.nom, c.name;

-- 9. VÉRIFICATION DES TRIGGERS
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_chat_sessions_updated_at'
  ) THEN
    RAISE NOTICE '✅ Trigger update_chat_sessions_updated_at existe';
  ELSE
    RAISE NOTICE '⚠️  ATTENTION: Trigger update_chat_sessions_updated_at manquant';
  END IF;
END $$;

-- 10. VÉRIFICATION DU REALTIME
-- ============================================

DO $$
DECLARE
  realtime_enabled BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'incidents'
  ) INTO realtime_enabled;
  
  IF realtime_enabled THEN
    RAISE NOTICE '✅ Realtime est activé pour la table "incidents"';
  ELSE
    RAISE NOTICE '⚠️  ATTENTION: Realtime n''est PAS activé pour la table "incidents"';
    RAISE NOTICE '   → Activez-le dans Database > Replication > incidents';
    RAISE NOTICE '   → Ou exécutez: ALTER PUBLICATION supabase_realtime ADD TABLE incidents;';
  END IF;
END $$;

-- 11. MESSAGE FINAL
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ VÉRIFICATION TERMINÉE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 PROCHAINES ÉTAPES:';
  RAISE NOTICE '1. Vérifiez le bucket Supabase Storage "incident-photos"';
  RAISE NOTICE '2. Configurez les numéros WhatsApp dans la table clubs';
  RAISE NOTICE '3. Activez Realtime pour la table "incidents" (Database > Replication)';
  RAISE NOTICE '4. Testez le webhook avec un message WhatsApp';
  RAISE NOTICE '';
END $$;

