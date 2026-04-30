import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Accès réservé aux administrateurs");
}

export type Unite = {
  id: string;
  numero_unite: string;
  entite: string;
  categorie: string | null;
  marque: string | null;
  modele: string | null;
  annee: number | null;
  numero_serie: string | null;
  plaque: string | null;
  poids: string | null;
  pnvb: string | null;
  nb_essieux: string | null;
  couleur: string | null;
  reservoir: boolean | null;
  statut: string;
  date_remisage: string | null;
  date_deremisage: string | null;
  demande_par: string | null;
  assurance_expiration: string | null;
  immatriculation_expiration: string | null;
  date_acquisition: string | null;
  date_disposition: string | null;
  prix_achat: number | null;
  km_achat: number | null;
  km_actuel: number | null;
  date_maj_km: string | null;
  notes: string | null;
  utilisateur: string | null;
  created_at: string;
};

export const getUnites = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("unites")
    .select("*")
    .order("numero_unite");
  if (error) throw new Error(error.message);
  return data as Unite[];
});

export const getUnite = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { data: unite, error } = await supabaseAdmin
      .from("unites")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return unite as Unite;
  });

export const updateUnite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; updates: Partial<Unite> }) => data)
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("unites")
      .update(data.updates)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const createUnite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: Partial<Unite> & { numero_unite: string; entite: string }) => data)
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("unites").insert(data);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteUnite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    // Supprimer les inspections liées d'abord (pas de FK cascade)
    await supabaseAdmin.from("inspections").delete().eq("unite_id", data.id);
    const { error } = await supabaseAdmin.from("unites").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });
