-- Migration : Ajouter le champ in_progress_at à la table incidents
-- Ce champ enregistre la date et l'heure à laquelle un incident est pris en charge (statut = IN_PROGRESS)

ALTER TABLE incidents 
ADD COLUMN IF NOT EXISTS in_progress_at TIMESTAMPTZ;

-- Commentaire pour documentation
COMMENT ON COLUMN incidents.in_progress_at IS 'Date et heure à laquelle l''incident a été pris en charge (statut changé à IN_PROGRESS)';

