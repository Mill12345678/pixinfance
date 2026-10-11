import { NextRequest } from 'next/server';
import { createSessionClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CategoryInput = {
  name: string;
  direction: 'income' | 'expense';
};

// GET: danh sách phân loại.
export async function GET() {
  try {
    const supabase = await createSessionClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('direction', { ascending: true })
      .order('name');

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data ?? []);
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: tạo phân loại (chỉ admin).
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CategoryInput;
    if (!body.name?.trim() || !['income', 'expense'].includes(body.direction)) {
      return Response.json({ error: 'name và direction (income/expense) là bắt buộc.' }, { status: 400 });
    }

    const supabase = await createSessionClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
      .single();

    if (profile?.role !== 'admin') {
      return Response.json({ error: 'Chỉ admin mới được quản lý phân loại.' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({ name: body.name.trim(), direction: body.direction })
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data, { status: 201 });
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
