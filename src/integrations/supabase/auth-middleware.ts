import { createMiddleware } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

function extractToken(request: Request): string | null {
  // 1. Header Authorization: Bearer <token>  (appels serveur-à-serveur)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7) || null;
  }

  // 2. Cookie sb-access-token  (appels depuis le navigateur — synchronisé par client.ts)
  const cookieHeader = request.headers.get('cookie') ?? '';
  const match = cookieHeader.match(/(?:^|;\s*)sb-access-token=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);

  return null;
}

export const requireSupabaseAuth = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Response(
        "Variables d'environnement Supabase manquantes (SUPABASE_URL, SUPABASE_ANON_KEY).",
        { status: 500 }
      );
    }

    const request = getRequest();
    if (!request?.headers) {
      throw new Response('Unauthorized', { status: 401 });
    }

    const token = extractToken(request);
    if (!token) {
      throw new Response('Unauthorized: aucun token trouvé (header ou cookie)', { status: 401 });
    }

    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.auth.getClaims(token);
    if (error || !data?.claims?.sub) {
      throw new Response('Unauthorized: token invalide', { status: 401 });
    }

    return next({
      context: {
        supabase,
        userId: data.claims.sub as string,
        claims: data.claims,
      },
    });
  }
);
