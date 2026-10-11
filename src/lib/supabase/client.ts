'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

// Lazily validated so the app still builds with placeholder env.
export function createBrowserSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('YOUR-')) {
    throw new Error(
      'Missing Supabase env vars. Check .env.local (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY).'
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
