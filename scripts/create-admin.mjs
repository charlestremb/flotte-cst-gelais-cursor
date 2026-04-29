// Script de création du compte administrateur initial
// Usage : node scripts/create-admin.mjs
// Prérequis : SUPABASE_SERVICE_ROLE_KEY doit être défini dans .env.local

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Charger .env.local et .dev.vars manuellement
function parseEnvFile(filePath) {
  try {
    return Object.fromEntries(
      readFileSync(filePath, "utf-8")
        .split("\n")
        .filter((l) => l && !l.startsWith("#") && l.includes("="))
        .map((l) => {
          const idx = l.indexOf("=");
          return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
        })
    );
  } catch {
    return {};
  }
}

const env = {
  ...parseEnvFile(resolve(__dirname, "../.env.local")),
  ...parseEnvFile(resolve(__dirname, "../.dev.vars")),
};

const SUPABASE_URL = process.env.SUPABASE_URL || env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "❌ SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local\n" +
    "   Ajoute cette ligne dans .env.local :\n" +
    "   SUPABASE_SERVICE_ROLE_KEY=<ta-clé-service-role>"
  );
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const EMAIL = "c.tremblay@cstgelais.com";
const PASSWORD = "Cstg2017!";
const FULL_NAME = "C. Tremblay";

async function main() {
  console.log(`Création du compte administrateur : ${EMAIL}`);

  // Chercher si l'utilisateur existe déjà
  const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
  const existing = listData?.users?.find((u) => u.email === EMAIL);

  let userId;
  if (existing) {
    userId = existing.id;
    console.log(`ℹ️  Utilisateur déjà existant (id: ${userId})`);
  } else {
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: FULL_NAME },
    });
    if (error) {
      console.error("❌ Erreur création utilisateur :", error.message);
      process.exit(1);
    }
    userId = created.user.id;
    console.log(`✅ Utilisateur créé (id: ${userId})`);
  }

  // Créer le profil s'il n'existe pas (le trigger n'a pas pu s'exécuter si l'user existait avant la migration)
  const { data: existingProfile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existingProfile) {
    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .insert({ user_id: userId, email: EMAIL, full_name: FULL_NAME });
    if (profileErr) {
      console.error("❌ Erreur création profil :", profileErr.message);
      process.exit(1);
    }
    console.log("✅ Profil créé");
  } else {
    console.log("ℹ️  Profil déjà existant");
  }

  // Assigner le rôle admin
  await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
  const { error: roleErr } = await supabaseAdmin
    .from("user_roles")
    .insert({ user_id: userId, role: "admin" });

  if (roleErr) {
    console.error("❌ Erreur assignation rôle admin :", roleErr.message);
    process.exit(1);
  }

  console.log("✅ Rôle admin assigné");
  console.log("\n=== Compte configuré avec succès ===");
  console.log(`   Email    : ${EMAIL}`);
  console.log(`   Rôle     : admin`);
  console.log("=====================================\n");
}

main();
