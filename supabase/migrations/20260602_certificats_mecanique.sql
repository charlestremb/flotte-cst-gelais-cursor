-- ============================================================
-- Table : certificats_mecanique
-- Stocke les certificats de vérification mécanique par unité
-- Indépendant du module inspections (le contremaitre peut
-- ajouter un certificat sans créer d'inspection dans le système)
-- ============================================================

CREATE TABLE IF NOT EXISTS certificats_mecanique (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  unite_id       uuid        NOT NULL,
  date_certificat date       NOT NULL,
  effectuee_par  text,
  notes          text,
  document_url   text,
  nom_fichier    text,
  created_at     timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_certificats_mecanique_unite_id
  ON certificats_mecanique(unite_id);

-- -------- RLS --------
ALTER TABLE certificats_mecanique ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture certificats_mecanique"
  ON certificats_mecanique FOR SELECT TO authenticated USING (true);

CREATE POLICY "Insertion certificats_mecanique"
  ON certificats_mecanique FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Modification certificats_mecanique"
  ON certificats_mecanique FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Suppression certificats_mecanique"
  ON certificats_mecanique FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- ============================================================
-- Storage : policies sur le bucket certificat-verification-mecanique
-- (le bucket a été créé manuellement dans le dashboard Supabase)
-- ============================================================

CREATE POLICY "Lecture publique certificat-verification-mecanique"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certificat-verification-mecanique');

CREATE POLICY "Upload certificat-verification-mecanique"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'certificat-verification-mecanique');

CREATE POLICY "Suppression certificat-verification-mecanique"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'certificat-verification-mecanique');
