-- Add document_url column to inspections to store the PDF link
ALTER TABLE public.inspections
ADD COLUMN IF NOT EXISTS document_url text;

-- Create a public storage bucket for inspection PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection-documents', 'inspection-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read + public write (no auth in this app)
CREATE POLICY "Public read inspection documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'inspection-documents');

CREATE POLICY "Public upload inspection documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'inspection-documents');

CREATE POLICY "Public update inspection documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'inspection-documents');

CREATE POLICY "Public delete inspection documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'inspection-documents');