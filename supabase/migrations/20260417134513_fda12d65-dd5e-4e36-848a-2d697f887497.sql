ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS date_reception_lettre date;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS date_limite date;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS statut_workflow text NOT NULL DEFAULT 'a_planifier';
-- valeurs attendues : 'a_planifier' | 'planifiee' | 'terminee'