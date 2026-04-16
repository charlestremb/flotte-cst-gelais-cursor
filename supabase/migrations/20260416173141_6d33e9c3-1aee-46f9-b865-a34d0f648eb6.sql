
CREATE TABLE public.unites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_unite TEXT NOT NULL,
  entite TEXT NOT NULL,
  categorie TEXT,
  marque TEXT,
  modele TEXT,
  annee INTEGER,
  numero_serie TEXT,
  plaque TEXT,
  poids TEXT,
  pnvb TEXT,
  nb_essieux TEXT,
  couleur TEXT,
  reservoir BOOLEAN DEFAULT false,
  statut TEXT NOT NULL DEFAULT 'actif',
  date_remisage DATE,
  date_deremisage DATE,
  demande_par TEXT,
  assurance_expiration DATE,
  immatriculation_expiration DATE,
  date_acquisition DATE,
  date_disposition DATE,
  prix_achat NUMERIC,
  km_achat INTEGER,
  km_actuel INTEGER,
  date_maj_km DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.unites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on unites" ON public.unites FOR SELECT USING (true);
CREATE POLICY "Allow public insert on unites" ON public.unites FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on unites" ON public.unites FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on unites" ON public.unites FOR DELETE USING (true);
