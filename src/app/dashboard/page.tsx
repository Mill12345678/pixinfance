import { createSessionClient } from '@/lib/supabase/server';
import DashboardClient from '@/components/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  let rows: TxnRow[] = [];
  let debtSafeLimit: number | null = null;
  let error: string | null = null;

  try {
    const supabase = await createSessionClient();
    const { data, error: dbError } = await supabase
      .from('transactions')
      .select('id, transaction_date, transaction_type, niche, actual_amount, debt_impact, notes, evidence_pending')
      .is('deleted_at', null)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (dbError) throw dbError;
    rows = (data ?? []) as TxnRow[];

    const { data: limitRow } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'debt_safe_limit')
      .maybeSingle();
    debtSafeLimit = limitRow?.value ?? null;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Không thể tải dữ liệu';
  }

  return <DashboardClient rows={rows} debtSafeLimit={debtSafeLimit} error={error} />;
}

type TxnRow = {
  id: string;
  transaction_date: string;
  transaction_type: string;
  niche: string;
  actual_amount: number;
  debt_impact: number;
  notes: string | null;
  evidence_pending: boolean;
};
