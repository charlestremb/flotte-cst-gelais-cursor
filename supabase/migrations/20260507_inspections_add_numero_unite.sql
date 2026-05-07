-- Ajout de la colonne numero_unite dans la table inspections
-- Permet d'avoir le numéro d'unité directement dans le payload des webhooks Supabase

ALTER TABLE inspections
  ADD COLUMN IF NOT EXISTS numero_unite text;

-- Remplir les valeurs existantes depuis la table unites
UPDATE inspections i
SET numero_unite = u.numero_unite
FROM unites u
WHERE i.unite_id = u.id
  AND i.numero_unite IS NULL;
