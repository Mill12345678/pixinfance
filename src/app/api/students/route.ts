import { NextRequest } from 'next/server';
import { createSessionClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// F11: tìm học sinh có sẵn trong DB (không cho tạo mới tại form).
export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
    if (!q || q.length < 2) {
      return Response.json([]);
    }

    const supabase = await createSessionClient();
    const { data, error } = await supabase
      .from('students')
      .select('id, name, parent_phone, parent_name')
      .ilike('name', `%${q}%`)
      .order('name')
      .limit(10);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json(data ?? []);
  } catch (error) {
    console.error('Search students failed:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
