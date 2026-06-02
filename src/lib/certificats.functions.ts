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

export type CertificatMecanique = {
  id: string;
  unite_id: string;
  date_certificat: string;
  effectuee_par: string | null;
  notes: string | null;
  document_url: string | null;
  nom_fichier: string | null;
  created_at: string;
};

export const getCertificatsForUnite = createServerFn({ method: "GET" })
  .inputValidator((data: { uniteId: string }) => data)
  .handler(async ({ data }) => {
    const { data: certificats, error } = await supabaseAdmin
      .from("certificats_mecanique")
      .select("*")
      .eq("unite_id", data.uniteId)
      .order("date_certificat", { ascending: false });
    if (error) throw new Error(error.message);
    return certificats as CertificatMecanique[];
  });

export const createCertificat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      unite_id: string;
      date_certificat: string;
      effectuee_par?: string | null;
      notes?: string | null;
      document_url?: string | null;
      nom_fichier?: string | null;
    }) => data
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("certificats_mecanique")
      .insert({
        unite_id: data.unite_id,
        date_certificat: data.date_certificat,
        effectuee_par: data.effectuee_par ?? null,
        notes: data.notes ?? null,
        document_url: data.document_url ?? null,
        nom_fichier: data.nom_fichier ?? null,
      });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteCertificat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("certificats_mecanique")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });
