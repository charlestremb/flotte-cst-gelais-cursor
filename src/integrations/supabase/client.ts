import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

function createSupabaseClient() {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Variables d'environnement Supabase manquantes. Assurez-vous que VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont définis dans votre fichier .env.local."
    );
  }

  // Côté serveur (SSR) : pas de session, les loaders utilisent supabaseAdmin
  if (typeof window === 'undefined') {
    return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
  }

  // Côté navigateur : localStorage + synchronisation du access_token dans un cookie
  // Le cookie permet au serveur de vérifier l'auth sans header Authorization explicite.
  const cookieSyncStorage = {
    getItem: (key: string): string | null => localStorage.getItem(key),
    setItem: (key: string, value: string): void => {
      localStorage.setItem(key, value);
      try {
        const session = JSON.parse(value) as { access_token?: string } | null;
        if (session?.access_token) {
          document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=604800; SameSite=Lax`;
        }
      } catch { /* valeur non-JSON, ignorer */ }
    },
    removeItem: (key: string): void => {
      localStorage.removeItem(key);
      document.cookie = 'sb-access-token=; path=/; max-age=0; SameSite=Lax';
    },
  };

  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { storage: cookieSyncStorage, persistSession: true, autoRefreshToken: true },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

// import { supabase } from "@/integrations/supabase/client";
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
