-- ============================================================
-- Table : entites
-- Stocke les entités juridiques gérées dans la flotte
-- ============================================================

CREATE TABLE IF NOT EXISTS entites (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  nom        text        NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Données initiales
INSERT INTO entites (nom) VALUES
  ('CSTG'),
  ('T1C'),
  ('9487-6216')
ON CONFLICT (nom) DO NOTHING;

-- -------- RLS --------
ALTER TABLE entites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture entites"
  ON entites FOR SELECT TO authenticated USING (true);

CREATE POLICY "Insertion entites"
  ON entites FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Suppression entites"
  ON entites FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));
