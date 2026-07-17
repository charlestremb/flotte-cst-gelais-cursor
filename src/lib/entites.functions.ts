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

export type Entite = {
  id: string;
  nom: string;
  created_at: string;
};

export const getEntites = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("entites")
    .select("*")
    .order("nom", { ascending: true });
  if (error) throw new Error(error.message);
  return data as Entite[];
});

export const createEntite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { nom: string }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("entites")
      .insert({ nom: data.nom.trim() });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteEntite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("entites")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });
