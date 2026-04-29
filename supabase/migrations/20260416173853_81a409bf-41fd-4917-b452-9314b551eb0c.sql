
CREATE TABLE public.inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unite_id UUID NOT NULL REFERENCES public.unites(id) ON DELETE CASCADE,
  date_inspection DATE,
  type_inspection TEXT NOT NULL,
  effectuee_par TEXT,
  resultat TEXT NOT NULL DEFAULT 'En attente',
  notes_inspection TEXT,
  prochaine_inspection DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_inspections_unite_id ON public.inspections(unite_id);
CREATE INDEX idx_inspections_prochaine ON public.inspections(prochaine_inspection);

ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on inspections" ON public.inspections FOR SELECT USING (true);
CREATE POLICY "Allow public insert on inspections" ON public.inspections FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on inspections" ON public.inspections FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on inspections" ON public.inspections FOR DELETE USING (true);
