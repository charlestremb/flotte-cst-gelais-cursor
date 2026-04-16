import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

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
};

export type InspectionWithUnite = Inspection & {
  unite: {
    id: string;
    numero_unite: string;
    entite: string;
    marque: string | null;
    modele: string | null;
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
        "*, unite:unites(id, numero_unite, entite, marque, modele)"
      )
      .order("prochaine_inspection", { ascending: true, nullsFirst: false });
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
      date_inspection?: string | null;
      effectuee_par?: string | null;
      resultat?: string;
      notes_inspection?: string | null;
      prochaine_inspection?: string | null;
      document_url?: string | null;
    }) => data
  )
  .handler(async ({ data }) => {
    const { data: inserted, error } = await supabase
      .from("inspections")
      .insert(data)
      .select("*, unite:unites(numero_unite, marque, modele, entite)")
      .single();
    if (error) throw new Error(error.message);

    // Notifier le garage par courriel (best-effort, n'arrête pas l'enregistrement)
    try {
      const { sendInspectionNotification } = await import("./notifications.functions");
      await sendInspectionNotification({ data: { inspection: inserted as any } });
    } catch (e) {
      console.error("Échec envoi courriel notification:", e);
    }

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
