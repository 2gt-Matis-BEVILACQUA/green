-- Script SQL pour insérer 40 incidents de test
-- ⚠️ IMPORTANT : Cette requête fonctionne si vous avez au moins un club et les parcours nommés exactement
-- 'L'Océan', 'La Forêt', et 'Le Magnolia'

-- Si vos parcours ont des noms différents, modifiez les noms dans les sous-requêtes ci-dessous

INSERT INTO incidents (
  club_id,
  course_id,
  hole_number,
  loop,
  category,
  description,
  priority,
  status,
  created_at,
  reported_by,
  photo_url
)
VALUES
  -- L'Océan (20 incidents) - Trou 4 (7 fois) et Trou 12 (5 fois)
  -- Trou 4 - 7 occurrences
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'L''Océan' LIMIT 1), 4, 'Aller', 'Bunker', 'Bunker à ratisser', 'Medium', 'Resolved', NOW() - INTERVAL '5 days' - (RANDOM() * INTERVAL '12 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'L''Océan' LIMIT 1), 4, 'Aller', 'Arrosage', 'Fuite arrosage détectée sur le trou 4', 'High', 'Resolved', NOW() - INTERVAL '8 days' - (RANDOM() * INTERVAL '12 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'L''Océan' LIMIT 1), 4, 'Aller', 'Tonte', 'Tonte nécessaire sur le green', 'Low', 'Resolved', NOW() - INTERVAL '12 days' - (RANDOM() * INTERVAL '12 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'L''Océan' LIMIT 1), 4, 'Aller', 'Bunker', 'Bunker envahi par les mauvaises herbes', 'Medium', 'In_Progress', NOW() - INTERVAL '3 days' - (RANDOM() * INTERVAL '8 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'L''Océan' LIMIT 1), 4, 'Aller', 'Autre', 'Présence de sangliers', 'High', 'Open', NOW() - INTERVAL '2 days' - (RANDOM() * INTERVAL '4 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'L''Océan' LIMIT 1), 4, 'Aller', 'Arrosage', 'Système d''arrosage défaillant', 'Medium', 'Resolved', NOW() - INTERVAL '15 days' - (RANDOM() * INTERVAL '12 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'L''Océan' LIMIT 1), 4, 'Aller', 'Signaletique', 'Panneau de signalisation cassé', 'Low', 'Resolved', NOW() - INTERVAL '20 days' - (RANDOM() * INTERVAL '12 hours'), '+33612345678', NULL),
  
  -- Trou 12 - 5 occurrences
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'L''Océan' LIMIT 1), 12, 'Retour', 'Tonte', 'Green nécessite une tonte', 'Medium', 'Resolved', NOW() - INTERVAL '6 days' - (RANDOM() * INTERVAL '12 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'L''Océan' LIMIT 1), 12, 'Retour', 'Bunker', 'Bunker à nettoyer', 'Low', 'Resolved', NOW() - INTERVAL '9 days' - (RANDOM() * INTERVAL '12 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'L''Océan' LIMIT 1), 12, 'Retour', 'Arrosage', 'Fuite sur arroseur principal', 'High', 'In_Progress', NOW() - INTERVAL '4 days' - (RANDOM() * INTERVAL '8 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'L''Océan' LIMIT 1), 12, 'Retour', 'Autre', 'Trou dans le green', 'Medium', 'Resolved', NOW() - INTERVAL '11 days' - (RANDOM() * INTERVAL '12 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'L''Océan' LIMIT 1), 12, 'Retour', 'Tonte', 'Herbe trop haute sur fairway', 'Low', 'Resolved', NOW() - INTERVAL '18 days' - (RANDOM() * INTERVAL '12 hours'), '+33612345678', NULL),
  
  -- L'Océan - autres trous (8 incidents)
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'L''Océan' LIMIT 1), 2, 'Aller', 'Arrosage', 'Arroseur bloqué', 'Medium', 'Resolved', NOW() - INTERVAL '7 days' - (RANDOM() * INTERVAL '12 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'L''Océan' LIMIT 1), 7, 'Aller', 'Bunker', 'Nécessite ratissage', 'Low', 'Resolved', NOW() - INTERVAL '10 days' - (RANDOM() * INTERVAL '12 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'L''Océan' LIMIT 1), 9, 'Aller', 'Tonte', 'Tonte urgente requise', 'Medium', 'Resolved', NOW() - INTERVAL '3 days' - (RANDOM() * INTERVAL '8 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'L''Océan' LIMIT 1), 11, 'Retour', 'Signaletique', 'Flèche directionnelle manquante', 'Low', 'In_Progress', NOW() - INTERVAL '4 days' - (RANDOM() * INTERVAL '8 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'L''Océan' LIMIT 1), 15, 'Retour', 'Arrosage', 'Système d''arrosage à vérifier', 'High', 'Open', NOW() - INTERVAL '1 day' - (RANDOM() * INTERVAL '4 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'L''Océan' LIMIT 1), 16, 'Retour', 'Bunker', 'Sable à remplacer', 'Medium', 'Resolved', NOW() - INTERVAL '14 days' - (RANDOM() * INTERVAL '12 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'L''Océan' LIMIT 1), 17, 'Retour', 'Autre', 'Obstacle sur le parcours', 'Low', 'Resolved', NOW() - INTERVAL '22 days' - (RANDOM() * INTERVAL '12 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'L''Océan' LIMIT 1), 18, 'Retour', 'Tonte', 'Rough à tondre', 'Medium', 'Resolved', NOW() - INTERVAL '25 days' - (RANDOM() * INTERVAL '12 hours'), '+33612345678', NULL),
  
  -- La Forêt (12 incidents)
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'La Forêt' LIMIT 1), 1, 'Aller', 'Arrosage', 'Fuite détectée sur arroseur', 'High', 'Resolved', NOW() - INTERVAL '6 days' - (RANDOM() * INTERVAL '12 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'La Forêt' LIMIT 1), 2, 'Aller', 'Bunker', 'Bunker nécessite attention', 'Medium', 'In_Progress', NOW() - INTERVAL '3 days' - (RANDOM() * INTERVAL '8 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'La Forêt' LIMIT 1), 3, 'Aller', 'Tonte', 'Green à entretenir', 'Low', 'Resolved', NOW() - INTERVAL '9 days' - (RANDOM() * INTERVAL '12 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'La Forêt' LIMIT 1), 4, 'Aller', 'Autre', 'Branche tombée sur le parcours', 'Medium', 'Resolved', NOW() - INTERVAL '4 days' - (RANDOM() * INTERVAL '8 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'La Forêt' LIMIT 1), 5, 'Aller', 'Arrosage', 'Arroseur défaillant', 'High', 'Open', NOW() - INTERVAL '2 days' - (RANDOM() * INTERVAL '4 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'La Forêt' LIMIT 1), 6, 'Aller', 'Signaletique', 'Panneau endommagé', 'Low', 'Resolved', NOW() - INTERVAL '13 days' - (RANDOM() * INTERVAL '12 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'La Forêt' LIMIT 1), 7, 'Aller', 'Tonte', 'Tonte régulière nécessaire', 'Medium', 'Resolved', NOW() - INTERVAL '8 days' - (RANDOM() * INTERVAL '12 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'La Forêt' LIMIT 1), 8, 'Aller', 'Bunker', 'Bunker à ratisser', 'Low', 'In_Progress', NOW() - INTERVAL '3 days' - (RANDOM() * INTERVAL '8 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'La Forêt' LIMIT 1), 9, 'Aller', 'Arrosage', 'Système à vérifier', 'Medium', 'Resolved', NOW() - INTERVAL '16 days' - (RANDOM() * INTERVAL '12 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'La Forêt' LIMIT 1), 1, 'Aller', 'Tonte', 'Herbe trop haute', 'Low', 'Resolved', NOW() - INTERVAL '19 days' - (RANDOM() * INTERVAL '12 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'La Forêt' LIMIT 1), 5, 'Aller', 'Autre', 'Présence de taupes', 'High', 'Resolved', NOW() - INTERVAL '11 days' - (RANDOM() * INTERVAL '12 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'La Forêt' LIMIT 1), 7, 'Aller', 'Bunker', 'Sable dispersé par le vent', 'Medium', 'Resolved', NOW() - INTERVAL '24 days' - (RANDOM() * INTERVAL '12 hours'), '+33612345678', NULL),
  
  -- Le Magnolia (8 incidents)
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'Le Magnolia' LIMIT 1), 1, 'Aller', 'Arrosage', 'Fuite importante sur arroseur', 'High', 'Resolved', NOW() - INTERVAL '5 days' - (RANDOM() * INTERVAL '12 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'Le Magnolia' LIMIT 1), 2, 'Aller', 'Tonte', 'Green nécessite tonte', 'Medium', 'In_Progress', NOW() - INTERVAL '3 days' - (RANDOM() * INTERVAL '8 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'Le Magnolia' LIMIT 1), 3, 'Aller', 'Bunker', 'Bunker à nettoyer', 'Low', 'Resolved', NOW() - INTERVAL '7 days' - (RANDOM() * INTERVAL '12 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'Le Magnolia' LIMIT 1), 4, 'Aller', 'Signaletique', 'Panneau à remplacer', 'Medium', 'Resolved', NOW() - INTERVAL '4 days' - (RANDOM() * INTERVAL '8 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'Le Magnolia' LIMIT 1), 5, 'Aller', 'Autre', 'Obstacle sur fairway', 'Low', 'Open', NOW() - INTERVAL '1 day' - (RANDOM() * INTERVAL '4 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'Le Magnolia' LIMIT 1), 6, 'Aller', 'Arrosage', 'Arroseur bloqué', 'High', 'Resolved', NOW() - INTERVAL '10 days' - (RANDOM() * INTERVAL '12 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'Le Magnolia' LIMIT 1), 7, 'Aller', 'Tonte', 'Rough à entretenir', 'Medium', 'Resolved', NOW() - INTERVAL '15 days' - (RANDOM() * INTERVAL '12 hours'), '+33612345678', NULL),
  ((SELECT id FROM clubs LIMIT 1), (SELECT id FROM courses WHERE name = 'Le Magnolia' LIMIT 1), 8, 'Aller', 'Bunker', 'Bunker envahi', 'Low', 'Resolved', NOW() - INTERVAL '21 days' - (RANDOM() * INTERVAL '12 hours'), '+33612345678', NULL);

-- Vérification : Compter les incidents insérés
SELECT COUNT(*) as total_incidents FROM incidents;
