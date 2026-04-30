import { createClient } from '@supabase/supabase-js';
import { getRequest } from '@tanstack/react-start/server';
import type { Database } from './types';

// Extrait le token depuis le cookie sb-access-token (synchronisé par client.ts côté navigateur)
export function getAccessTokenFromRequest(): string | null {
  const request = getRequest();
  const cookieHeader = request?.headers.get('cookie') ?? '';
  const match = cookieHeader.match(/(?:^|;\s*)sb-access-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// Crée un client Supabase avec le token de l'utilisateur (pour validation côté serveur)
export function createSupabaseServerClient(token: string) {
  const SUPABASE_URL = process.env.SUPABASE_URL!;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}
