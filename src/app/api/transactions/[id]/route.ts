import { NextRequest } from 'next/server';
import { createSessionClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Soft delete (PRD v2 F6) — sets deleted_at/deleted_by; row stays for audit.
export async function DELETE(request: NextRequest, ctx: RouteContext<'/api/transactions/[id]'>) {
  try {
    const { id } = await ctx.params;

    const supabase = await createSessionClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Soft-delete restricted to admin by DB trigger; deleted_by = session user.
    const { data, error } = await supabase
      .from('transactions')
      .update({ deleted_at: new Date().toISOString(), deleted_by: user.id })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }
    return Response.json(data);
  } catch (error) {
    console.error('Delete transaction failed:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/transactions/[id]'>) {
  try {
    const { id } = await ctx.params;
    const body = await request.json();

    const supabase = await createSessionClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // F7: chuyển no_invoice -> has_invoice bắt buộc có chứng cứ.
    if (body.document_status === 'has_invoice') {
      const { data: existing } = await supabase
        .from('transactions')
        .select('document_status, document_url')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      const hasNewProof = Boolean(body.document_url) || Array.isArray(body.document_urls);
      if (existing?.document_status !== 'has_invoice' && !hasNewProof && !existing?.document_url) {
        return Response.json(
          { error: 'Bắt buộc tải lên chứng cứ khi chuyển sang "Đã có hoá đơn" (PRD v2 F7).' },
          { status: 400 }
        );
      }
    }

    // Chặn revert has_invoice -> no_invoice trừ admin (kiểm tra role).
    if (body.document_status === 'no_invoice') {
      const { data: existing } = await supabase
        .from('transactions')
        .select('document_status')
        .eq('id', id)
        .is('deleted_at', null)
        .single();
      if (existing?.document_status === 'has_invoice') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile?.role !== 'admin') {
          return Response.json(
            { error: 'Chỉ admin mới được revert trạng thái "Đã có hoá đơn" (PRD v2 F7).' },
            { status: 403 }
          );
        }
      }
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(body)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }
    return Response.json(data);
  } catch (error) {
    console.error('Update transaction failed:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
