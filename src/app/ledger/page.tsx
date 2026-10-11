import { createSessionClient } from '@/lib/supabase/server';
import { FileSearch } from 'lucide-react';
import LedgerClient from '@/components/LedgerClient';

export const dynamic = 'force-dynamic';

export default async function LedgerPage() {
  let rows: LedgerRow[] = [];
  let isAdmin = false;
  let alertThreshold: number | null = null;
  let error: string | null = null;

  try {
    const supabase = await createSessionClient();
    const { data, error: dbError } = await supabase
      .from('transactions')
      .select(
        'id, transaction_date, transaction_type, niche, actual_amount, invoiced_amount, vat_amount, source_account, document_status, category, contract_id, notes, evidence_pending, debt_impact'
      )
      .is('deleted_at', null)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1000);

    if (dbError) throw dbError;
    rows = (data ?? []) as LedgerRow[];

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      isAdmin = profile?.role === 'admin';
    }

    const { data: threshold } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'alert_threshold')
      .maybeSingle();
    alertThreshold = threshold?.value ?? null;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Không thể tải dữ liệu';
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="card-title" style={{ fontSize: '1.6rem', marginBottom: '4px' }}>
            Ledger (Sổ Cái)
          </h1>
          <p className="card-sub" style={{ marginBottom: '0' }}>
            Toàn bộ giao dịch thu chi
          </p>
        </div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--primary-soft-bg)',
            color: 'var(--primary-strong)',
            borderRadius: '9999px',
            padding: '6px 14px',
            fontSize: '0.8rem',
            fontWeight: '600',
          }}
        >
          <FileSearch size={14} />
          {rows.length} giao dịch
        </span>
      </div>

      {error ? (
        <div className="card" style={{ color: 'var(--danger)' }}>
          <p>⚠️ {error}</p>
          <p style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>
            Kiểm tra .env.local (Supabase keys) và bảng transactions đã được tạo chưa.
          </p>
        </div>
      ) : (
        <LedgerClient initialRows={rows} isAdmin={isAdmin} alertThreshold={alertThreshold} />
      )}
    </div>
  );
}

type LedgerRow = {
  id: string;
  transaction_date: string;
  transaction_type: 'income' | 'expense';
  niche: 'ai' | 'stem' | 'chung';
  actual_amount: number;
  invoiced_amount: number;
  vat_amount: number;
  source_account: 'company_bank' | 'personal_bank' | 'cash';
  document_status: 'has_invoice' | 'pending_invoice' | 'no_invoice';
  category: string | null;
  contract_id: string | null;
  notes: string | null;
  evidence_pending: boolean;
  debt_impact: number;
};
