import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin as supabase } from "@/integrations/supabase/client.server";

export type StatutWorkflow = "a_planifier" | "planifiee" | "terminee";

export type Inspection = {
  id: string;
  unite_id: string;
  date_inspection: string | null;
  type_inspection: string;
  effectuee_par: string | null;
  resultat: string;
  notes_inspection: string | null;
  prochaine_inspection: string | null;
  document_url: string | null;
  created_at: string;
  date_reception_lettre: string | null;
  date_limite: string | null;
  statut_workflow: StatutWorkflow;
};

export type InspectionWithUnite = Inspection & {
  unite: {
    id: string;
    numero_unite: string;
    entite: string;
    marque: string | null;
    modele: string | null;
    categorie: string | null;
  } | null;
};

export const TYPES_INSPECTION = [
  "Annuelle SAAQ",
  "Pré-saison",
  "Maintenance préventive",
  "Mécanique",
  "Autre",
] as const;

export const RESULTATS = ["Passé", "Échoué", "En attente"] as const;

export const getInspections = createServerFn({ method: "GET" }).handler(
  async () => {
    const { data, error } = await supabase
      .from("inspections")
      .select(
        "*, unite:unites(id, numero_unite, entite, marque, modele, categorie)"
      )
      .order("date_limite", { ascending: true, nullsFirst: false });
    if (error) throw new Error(error.message);
    return data as InspectionWithUnite[];
  }
);

export const getInspectionsForUnite = createServerFn({ method: "GET" })
  .inputValidator((data: { uniteId: string }) => data)
  .handler(async ({ data }) => {
    const { data: inspections, error } = await supabase
      .from("inspections")
      .select("*")
      .eq("unite_id", data.uniteId)
      .order("date_inspection", { ascending: false, nullsFirst: false });
    if (error) throw new Error(error.message);
    return inspections as Inspection[];
  });

export const createInspection = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      unite_id: string;
      type_inspection: string;
      date_reception_lettre?: string | null;
      date_limite?: string | null;
      effectuee_par?: string | null;
      document_url?: string | null;
    }) => data
  )
  .handler(async ({ data }) => {
    const { data: inserted, error } = await supabase
      .from("inspections")
      .insert({
        unite_id: data.unite_id,
        type_inspection: data.type_inspection,
        date_reception_lettre: data.date_reception_lettre ?? null,
        date_limite: data.date_limite ?? null,
        prochaine_inspection: data.date_limite ?? null,
        effectuee_par: data.effectuee_par ?? null,
        document_url: data.document_url ?? null,
        statut_workflow: "a_planifier",
        resultat: "En attente",
      })
      .select("*, unite:unites(numero_unite, marque, modele, entite)")
      .single();
    if (error) throw new Error(error.message);

    // Notifier le garage par courriel (best-effort)
    try {
      const { sendInspectionNotification } = await import("./notifications.functions");
      await sendInspectionNotification({ data: { inspection: inserted as any } });
    } catch (e) {
      console.error("Échec envoi courriel notification:", e);
    }

    return { success: true };
  });

export const planifierInspection = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; date_inspection: string }) => data)
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from("inspections")
      .update({
        date_inspection: data.date_inspection,
        prochaine_inspection: data.date_inspection,
        statut_workflow: "planifiee",
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const terminerInspection = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { id: string; resultat?: string; effectuee_par?: string | null }) => data
  )
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from("inspections")
      .update({
        statut_workflow: "terminee",
        resultat: data.resultat ?? "Passé",
        effectuee_par: data.effectuee_par ?? null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const updateInspection = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { id: string; updates: Partial<Inspection> }) => data
  )
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from("inspections")
      .update(data.updates)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteInspection = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from("inspections")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });
