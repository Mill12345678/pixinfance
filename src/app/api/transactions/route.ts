import { NextRequest } from 'next/server';
import { createSessionClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TransactionInput = {
  transaction_date: string;
  transaction_type: 'income' | 'expense';
  niche: 'ai' | 'stem' | 'chung';
  actual_amount: number;
  invoiced_amount?: number;
  vat_amount?: number;
  source_account: 'company_bank' | 'personal_bank' | 'cash';
  category?: string | null;
  contract_id?: string | null;
  notes?: string | null;
  document_url?: string | null;
  fake_invoice_excess?: number; // PRD v2 F12: phần thừa cá nhân nhận (hoá đơn khống)
  require_evidence?: boolean; // Desktop full-form flag: upload bắt buộc theo nhánh
};

const VALID_TYPES = ['income', 'expense'] as const;
const VALID_NICHES = ['ai', 'stem', 'chung'] as const;
const VALID_SOURCES = ['company_bank', 'personal_bank', 'cash'] as const;

/**
 * Compute document_status + debt_impact per PRD v2 (section 3, 5.4).
 */
function computeLedger(input: TransactionInput) {
  const amount = Math.round(input.actual_amount);
  let debtImpact = 0;
  let documentStatus: 'has_invoice' | 'pending_invoice' | 'no_invoice' = 'no_invoice';
  const hasProof = Boolean(input.document_url);

  if (input.transaction_type === 'expense') {
    if (input.source_account === 'personal_bank') {
      // Cá nhân chi hộ công ty -> công ty nợ cá nhân
      debtImpact = -amount;
      documentStatus = hasProof ? 'has_invoice' : 'no_invoice';
    } else if (input.source_account === 'company_bank') {
      documentStatus = hasProof ? 'has_invoice' : 'no_invoice';
      if (input.fake_invoice_excess) {
        // Phần thừa hoá đơn khống -> cá nhân giữ thêm tiền công ty
        debtImpact += Math.round(input.fake_invoice_excess);
      }
    } else {
      // cash: no debt impact
      documentStatus = hasProof ? 'has_invoice' : 'no_invoice';
    }
  } else {
    // income
    if (input.source_account === 'personal_bank') {
      // Thu hộ công ty vào TK cá nhân -> cá nhân đang giữ tiền công ty
      debtImpact = amount;
      documentStatus = hasProof ? 'has_invoice' : 'no_invoice';
    } else if (input.source_account === 'company_bank') {
      // Thu vào công ty -> cần xuất hoá đơn cho khách
      documentStatus = 'pending_invoice';
    } else {
      documentStatus = hasProof ? 'has_invoice' : 'no_invoice';
    }
  }

  return { debtImpact, documentStatus };
}

function validate(input: TransactionInput) {
  const errors: string[] = [];

  if (!input.transaction_date) errors.push('transaction_date is required');
  if (!VALID_TYPES.includes(input.transaction_type)) errors.push('transaction_type is required');
  if (!VALID_NICHES.includes(input.niche)) errors.push('niche is required');
  if (!VALID_SOURCES.includes(input.source_account)) errors.push('source_account is required');
  if (!Number.isFinite(input.actual_amount) || input.actual_amount <= 0) {
    errors.push('actual_amount must be a positive integer');
  }
  if (input.invoiced_amount !== undefined && input.invoiced_amount < 0) {
    errors.push('invoiced_amount must be >= 0');
  }
  if (input.vat_amount !== undefined && input.vat_amount < 0) {
    errors.push('vat_amount must be >= 0');
  }
  if (input.fake_invoice_excess !== undefined && input.fake_invoice_excess < 0) {
    errors.push('fake_invoice_excess must be >= 0');
  }
  // PRD v2 §5.6: không cho ngày tương lai > hôm nay.
  const today = new Date().toISOString().slice(0, 10);
  if (input.transaction_date > today) {
    errors.push('transaction_date cannot be in the future');
  }
  return errors;
}

/**
 * PRD v2 R4: xác định evidence_pending.
 * - Quick Add bỏ trống chứng cứ -> true (cần bổ sung).
 * - Desktop (require_evidence) + thiếu chứng cứ theo nhánh -> chặn lưu.
 */
function computeEvidencePending(input: TransactionInput, documentStatus: string) {
  const hasProof = Boolean(input.document_url);

  if (input.require_evidence && !hasProof) {
    const requiresProof =
      (input.transaction_type === 'expense' &&
        (input.source_account === 'personal_bank' || input.source_account === 'company_bank')) ||
      (input.transaction_type === 'income' &&
        (input.source_account === 'personal_bank' || input.source_account === 'company_bank'));
    if (requiresProof) {
      throw new Error('Bắt buộc upload chứng cứ theo nhánh giao dịch (PRD v2 §3).');
    }
  }

  const branchRequiresProof =
    (input.transaction_type === 'expense' &&
      (input.source_account === 'personal_bank' || input.source_account === 'company_bank')) ||
    (input.transaction_type === 'income' &&
      (input.source_account === 'personal_bank' || input.source_account === 'company_bank'));

  // Income vào công ty: pending_invoice không cần evidence_pending.
  if (documentStatus === 'pending_invoice') return false;
  return branchRequiresProof && !hasProof;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TransactionInput;

    const errors = validate(body);
    if (errors.length) {
      return Response.json({ error: errors.join('; ') }, { status: 400 });
    }

    const supabase = await createSessionClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { debtImpact, documentStatus } = computeLedger(body);
    const evidencePending = computeEvidencePending(body, documentStatus);

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        transaction_date: body.transaction_date,
        transaction_type: body.transaction_type,
        niche: body.niche,
        actual_amount: Math.round(body.actual_amount),
        invoiced_amount: Math.round(body.invoiced_amount ?? 0),
        vat_amount: Math.round(body.vat_amount ?? 0),
        source_account: body.source_account,
        document_status: documentStatus,
        document_url: body.document_url ?? null,
        category: body.category ?? null,
        contract_id: body.contract_id ?? null,
        evidence_pending: evidencePending,
        notes: body.notes ?? null,
        debt_impact: debtImpact,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // F13: notification ngay khi tạo giao dịch.
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'transaction_created',
      title:
        body.transaction_type === 'income'
          ? `Đã thu ${body.actual_amount.toLocaleString('vi-VN')} ₫`
          : `Đã chi ${body.actual_amount.toLocaleString('vi-VN')} ₫`,
      body: body.notes ?? null,
      transaction_id: data.id,
    });

    return Response.json(data, { status: 201 });
  } catch (error) {
    console.error('Create transaction failed:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('Bắt buộc') ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}

export async function GET() {
  try {
    const supabase = await createSessionClient();
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .is('deleted_at', null)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json(data);
  } catch (error) {
    console.error('List transactions failed:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
