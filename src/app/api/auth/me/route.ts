import { NextResponse } from 'next/server';
import { createSessionClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createSessionClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ user: null });
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email ?? '',
        role: profile?.role ?? 'accountant',
      },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
