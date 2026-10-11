import { NextRequest } from 'next/server';
import { createSessionClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET: trả về map settings (alert_threshold, debt_safe_limit, ...).
export async function GET() {
  try {
    const supabase = await createSessionClient();
    const { data, error } = await supabase.from('admin_settings').select('key, value');
    if (error) return Response.json({ error: error.message }, { status: 500 });

    const map: Record<string, number> = {};
    for (const row of data ?? []) map[row.key] = row.value;
    return Response.json(map);
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: cập nhật 1 hoặc nhiều settings (chỉ admin).
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, number>;

    const supabase = await createSessionClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
      .single();

    if (profile?.role !== 'admin') {
      return Response.json({ error: 'Chỉ admin mới được cấu hình hệ thống.' }, { status: 403 });
    }

    const allowedKeys = ['alert_threshold', 'debt_safe_limit'];
    for (const [key, value] of Object.entries(body)) {
      if (!allowedKeys.includes(key)) continue;
      if (!Number.isFinite(value) || value < 0) continue;
      await supabase
        .from('admin_settings')
        .upsert({ key, value: Math.round(value) }, { onConflict: 'key' });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
