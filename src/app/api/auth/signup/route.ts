import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return Response.json({ error: 'Email và mật khẩu là bắt buộc.' }, { status: 400 });
  }
  if (password.length < 6) {
    return Response.json({ error: 'Mật khẩu phải có ít nhất 6 ký tự.' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // ignore
          }
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  if (data.user) {
    // Create profile row (role defaults to 'accountant' in schema).
    const admin = await createAdminClient();
    await admin.from('profiles').insert({ id: data.user.id, email: data.user.email ?? '' });
  }

  return Response.json({ ok: true, user: data.user });
}
