import { NextRequest } from 'next/server';
import { createSessionClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET: danh sách thông báo của user hiện tại.
export async function GET() {
  try {
    const supabase = await createSessionClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data ?? []);
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST { ids: [...] } hoặc { all: true }: đánh dấu đã đọc.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createSessionClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let updateQuery = supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    if (body?.all) {
      updateQuery = updateQuery.is('is_read', false);
    } else if (Array.isArray(body?.ids) && body.ids.length) {
      updateQuery = updateQuery.in('id', body.ids);
    } else {
      return Response.json({ error: 'Thiếu ids hoặc all.' }, { status: 400 });
    }

    const { error } = await updateQuery;
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
