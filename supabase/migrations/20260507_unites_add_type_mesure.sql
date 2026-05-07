-- Ajout de la colonne type_mesure pour les unités de type Laser
ALTER TABLE unites
  ADD COLUMN IF NOT EXISTS type_mesure text;

COMMENT ON COLUMN unites.type_mesure IS 'Type d''unité de mesure (ex: Laser, Égout, Règle, Détecteur de métal, Prisme)';
