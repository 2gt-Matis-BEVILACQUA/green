-- Script SQL pour supprimer tous les incidents de la base de données
-- ⚠️ ATTENTION : Cette requête supprime TOUS les incidents de manière définitive
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Supprimer tous les incidents
DELETE FROM incidents;

-- Optionnel : Réinitialiser aussi les sessions de chat (si vous voulez repartir de zéro)
-- DELETE FROM chat_sessions;

-- Optionnel : Réinitialiser le compteur d'ID (si vous voulez repartir de 1)
-- Note: Cela n'est généralement pas nécessaire avec UUID, mais utile pour le debug
-- ALTER SEQUENCE incidents_id_seq RESTART WITH 1;

-- Vérification : Compter les incidents restants (devrait retourner 0)
SELECT COUNT(*) as total_incidents FROM incidents;

