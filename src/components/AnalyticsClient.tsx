'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, Layers } from 'lucide-react';

type TxnRow = {
  id: string;
  transaction_date: string;
  transaction_type: string;
  niche: string;
  actual_amount: number;
};

type Props = {
  rows: TxnRow[];
  error: string | null;
};

const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫';

export default function AnalyticsClient({ rows, error }: Props) {
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    const byMonth = new Map<string, { income: number; expense: number }>();
    const byNiche = { ai: { income: 0, expense: 0 }, stem: { income: 0, expense: 0 }, chung: { income: 0, expense: 0 } };

    for (const r of rows) {
      const amount = r.actual_amount;
      const month = r.transaction_date.slice(0, 7); // YYYY-MM
      if (!byMonth.has(month)) byMonth.set(month, { income: 0, expense: 0 });
      const m = byMonth.get(month)!;

      const niche = (r.niche as keyof typeof byNiche) in byNiche ? (r.niche as keyof typeof byNiche) : 'chung';

      if (r.transaction_type === 'income') {
        income += amount;
        m.income += amount;
        byNiche[niche].income += amount;
      } else if (r.transaction_type === 'expense') {
        expense += amount;
        m.expense += amount;
        byNiche[niche].expense += amount;
      }
    }

    const monthly = [...byMonth.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12);

    const maxBar = Math.max(1, ...monthly.map(([, v]) => Math.max(v.income, v.expense)));

    return { income, expense, balance: income - expense, monthly, maxBar, byNiche };
  }, [rows]);

  if (error) {
    return (
      <div className="card" style={{ color: 'var(--danger)' }}>
        <p>⚠️ {error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon success">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="stat-label">Tổng thu</p>
            <p className="stat-value" style={{ color: 'var(--success)' }}>{fmt(stats.income)}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger">
            <TrendingDown size={22} />
          </div>
          <div>
            <p className="stat-label">Tổng chi</p>
            <p className="stat-value" style={{ color: 'var(--danger)' }}>{fmt(stats.expense)}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon primary">
            <Wallet size={22} />
          </div>
          <div>
            <p className="stat-label">Lợi nhuận</p>
            <p className="stat-value" style={{ color: stats.balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {fmt(stats.balance)}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly bar chart */}
      <div className="card" style={{ marginTop: '24px' }}>
        <h2 className="card-title" style={{ marginBottom: '20px' }}>Thu / Chi theo tháng</h2>
        {stats.monthly.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Chưa có dữ liệu.</p>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '220px', overflowX: 'auto', paddingBottom: '4px' }}>
            {stats.monthly.map(([month, v]) => {
              const hIncome = Math.round((v.income / stats.maxBar) * 160);
              const hExpense = Math.round((v.expense / stats.maxBar) * 160);
              const label = month.slice(5) + '/' + month.slice(0, 4).slice(2);
              return (
                <div key={month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: '44px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '170px' }}>
                    <div
                      title={`Thu: ${fmt(v.income)}`}
                      style={{
                        width: '16px',
                        height: Math.max(2, hIncome),
                        background: 'linear-gradient(180deg, #22c55e, #38a169)',
                        borderRadius: '6px 6px 2px 2px',
                      }}
                    />
                    <div
                      title={`Chi: ${fmt(v.expense)}`}
                      style={{
                        width: '16px',
                        height: Math.max(2, hExpense),
                        background: 'linear-gradient(180deg, #ef4444, #e53e3e)',
                        borderRadius: '6px 6px 2px 2px',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{label}</span>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--success)', display: 'inline-block' }} />
            Thu
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--danger)', display: 'inline-block' }} />
            Chi
          </span>
        </div>
      </div>

      {/* By niche */}
      <div className="card" style={{ marginTop: '24px' }}>
        <h2 className="card-title" style={{ marginBottom: '16px' }}>Theo ngách</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {(['ai', 'stem', 'chung'] as const).map((niche) => {
            const n = stats.byNiche[niche];
            return (
              <div key={niche} style={{ border: '1px solid var(--border)', borderRadius: '14px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Layers size={16} />
                  <span className={`badge niche-${niche}`}>{niche.toUpperCase()}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Thu</p>
                <p style={{ fontWeight: 700, color: 'var(--success)' }}>{fmt(n.income)}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>Chi</p>
                <p style={{ fontWeight: 700, color: 'var(--danger)' }}>{fmt(n.expense)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
