import { NextRequest } from 'next/server';
import { createSessionClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/admin/categories/[id]'>) {
  try {
    const { id } = await ctx.params;
    const body = await request.json();

    const supabase = await createSessionClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
      .single();

    if (profile?.role !== 'admin') {
      return Response.json({ error: 'Chỉ admin mới được quản lý phân loại.' }, { status: 403 });
    }

    const { data, error } = await supabase.from('categories').update(body).eq('id', id).select().single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!data) return Response.json({ error: 'Không tìm thấy phân loại.' }, { status: 404 });
    return Response.json(data);
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, ctx: RouteContext<'/api/admin/categories/[id]'>) {
  try {
    const { id } = await ctx.params;

    const supabase = await createSessionClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
      .single();

    if (profile?.role !== 'admin') {
      return Response.json({ error: 'Chỉ admin mới được quản lý phân loại.' }, { status: 403 });
    }

    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
