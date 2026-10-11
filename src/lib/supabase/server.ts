import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

function env() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || url.includes('YOUR-') || !anon || !service) {
    throw new Error(
      'Missing Supabase env vars. Check .env.local (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY).'
    );
  }
  return { url, anon, service };
}

/**
 * Session-aware client for Server Components / Route Handlers.
 * Respects RLS. Use this when you need the signed-in user's session.
 */
export async function createSessionClient() {
  const { url, anon } = env();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: ignore (middleware refreshes session).
        }
      },
    },
  });
}

/**
 * Service-role client. Bypasses RLS — only for server-side admin ops
 * (e.g. creating a user's profile row). Never import in client components.
 */
export async function createAdminClient() {
  const { url, service } = env();
  return createClient<Database>(url, service);
}
