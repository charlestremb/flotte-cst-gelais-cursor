import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type DocumentType = "immatriculation" | "assurance";

export type DocumentVehicule = {
  id: string;
  unite_id: string;
  type: DocumentType;
  date_echeance: string | null;
  document_url: string | null;
  nom_fichier: string | null;
  created_at: string;
};

export const getDocumentsVehicule = createServerFn({ method: "GET" })
  .inputValidator((data: { uniteId: string }) => data)
  .handler(async ({ data }) => {
    const { data: docs, error } = await supabaseAdmin
      .from("documents_vehicule")
      .select("*")
      .eq("unite_id", data.uniteId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (docs ?? []) as DocumentVehicule[];
  });

export const createDocumentVehicule = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      unite_id: string;
      type: DocumentType;
      date_echeance: string | null;
      document_url: string | null;
      nom_fichier: string | null;
    }) => data
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("documents_vehicule")
      .insert(data);
    if (error) throw new Error(error.message);
  });

export const deleteDocumentVehicule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("documents_vehicule")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
  });
