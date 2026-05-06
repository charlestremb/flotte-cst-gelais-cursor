-- ============================================================
-- Table : documents_vehicule
-- Stocke les PDF d'assurance et d'immatriculation par unité
-- ============================================================

CREATE TABLE IF NOT EXISTS documents_vehicule (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  unite_id     uuid        NOT NULL,
  type         text        NOT NULL CHECK (type IN ('immatriculation', 'assurance')),
  date_echeance date,
  document_url text,
  nom_fichier  text,
  created_at   timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_documents_vehicule_unite_id
  ON documents_vehicule(unite_id);

-- -------- RLS --------
ALTER TABLE documents_vehicule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture documents_vehicule"
  ON documents_vehicule FOR SELECT TO authenticated USING (true);

CREATE POLICY "Insertion documents_vehicule"
  ON documents_vehicule FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Modification documents_vehicule"
  ON documents_vehicule FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Suppression documents_vehicule"
  ON documents_vehicule FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- ============================================================
-- Storage bucket : vehicule-documents  (fichiers publics en lecture)
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicule-documents', 'vehicule-documents', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Lecture publique vehicule-documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vehicule-documents');

CREATE POLICY "Upload vehicule-documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vehicule-documents');

CREATE POLICY "Suppression vehicule-documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'vehicule-documents');
