import { createSessionClient } from '@/lib/supabase/server';
import AnalyticsClient from '@/components/AnalyticsClient';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  let rows: TxnRow[] = [];
  let error: string | null = null;

  try {
    const supabase = await createSessionClient();
    const { data, error: dbError } = await supabase
      .from('transactions')
      .select('id, transaction_date, transaction_type, niche, actual_amount')
      .is('deleted_at', null);

    if (dbError) throw dbError;
    rows = (data ?? []) as TxnRow[];
  } catch (err) {
    error = err instanceof Error ? err.message : 'Không thể tải dữ liệu';
  }

  return <AnalyticsClient rows={rows} error={error} />;
}

type TxnRow = {
  id: string;
  transaction_date: string;
  transaction_type: string;
  niche: string;
  actual_amount: number;
};
