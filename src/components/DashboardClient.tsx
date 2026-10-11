'use client';

import { useMemo, useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, Scale, Search, AlertTriangle } from 'lucide-react';

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

type Props = {
  rows: TxnRow[];
  debtSafeLimit: number | null;
  error: string | null;
};

const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫';

export default function DashboardClient({ rows, debtSafeLimit, error }: Props) {
  const [search, setSearch] = useState('');
  const [showDebtDetail, setShowDebtDetail] = useState(false);

  const stats = useMemo(() => {
    let balance = 0;
    let income = 0;
    let expense = 0;
    let debt = 0;
    for (const r of rows) {
      if (r.transaction_type === 'income') {
        balance += r.actual_amount;
        income += r.actual_amount;
      } else if (r.transaction_type === 'expense') {
        balance -= r.actual_amount;
        expense += r.actual_amount;
      }
      debt += r.debt_impact ?? 0;
    }
    return { balance, income, expense, debt };
  }, [rows]);

  const recent = useMemo(() => {
    const sorted = [...rows].sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));
    if (!search) return sorted.slice(0, 20);
    const q = search.toLowerCase();
    return sorted
      .filter(
        (t) =>
          (t.notes ?? '').toLowerCase().includes(q) ||
          String(t.actual_amount).includes(q) ||
          t.niche.toLowerCase().includes(q) ||
          t.transaction_type.includes(q)
      )
      .slice(0, 20);
  }, [rows, search]);

  const debtPositive = stats.debt > 0;
  const debtOverLimit =
    debtSafeLimit !== null && Math.abs(stats.debt) > debtSafeLimit;

  const debtDetailRows = useMemo(
    () => rows.filter((r) => (r.debt_impact ?? 0) !== 0),
    [rows]
  );

  return (
    <div>
      <h1 className="card-title" style={{ fontSize: '1.6rem', marginBottom: '4px' }}>
        Dashboard
      </h1>
      <p className="card-sub" style={{ marginBottom: '24px' }}>
        Tổng quan dòng tiền cá nhân &amp; công ty
      </p>

      {error ? (
        <div className="card" style={{ color: 'var(--danger)' }}>
          <p>⚠️ {error}</p>
          <p style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>
            Kiểm tra .env.local (Supabase keys) và bảng transactions đã được tạo chưa.
          </p>
        </div>
      ) : (
        <>
          {debtOverLimit && (
            <div className="card" style={{ marginBottom: '20px', border: '1px solid var(--danger)', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--danger)' }}>
              <AlertTriangle size={22} />
              <div>
                <p style={{ fontWeight: 700 }}>Công nợ vượt mức an toàn</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  |Công nợ| {fmt(Math.abs(stats.debt))} vượt mức cho phép {fmt(debtSafeLimit!)}. Xem xét đối soát ngay.
                </p>
              </div>
            </div>
          )}

          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-icon primary">
                <Wallet size={22} />
              </div>
              <div>
                <p className="stat-label">Số dư hiện tại</p>
                <p className="stat-value">{fmt(stats.balance)}</p>
                <p className="stat-note">Tổng thu − tổng chi</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon success">
                <TrendingUp size={22} />
              </div>
              <div>
                <p className="stat-label">Tổng thu</p>
                <p className="stat-value" style={{ color: 'var(--success)' }}>
                  {fmt(stats.income)}
                </p>
                <p className="stat-note">Toàn hệ thống</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon danger">
                <TrendingDown size={22} />
              </div>
              <div>
                <p className="stat-label">Tổng chi</p>
                <p className="stat-value" style={{ color: 'var(--danger)' }}>
                  {fmt(stats.expense)}
                </p>
                <p className="stat-note">Toàn hệ thống</p>
              </div>
            </div>
          </div>

          <div
            className="card"
            style={{ marginTop: '24px', cursor: 'pointer', border: debtOverLimit ? '1px solid var(--danger)' : undefined }}
            onClick={() => setShowDebtDetail((v) => !v)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div className={`stat-icon ${debtPositive ? 'danger' : 'success'}`}>
                <Scale size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <p className="stat-label">Công Nợ Cá Nhân – Công Ty</p>
                <p className="stat-value" style={{ color: debtPositive ? 'var(--danger)' : 'var(--success)' }}>
                  {debtPositive
                    ? `Bạn đang giữ ${fmt(stats.debt)} của Công ty`
                    : `Công ty đang nợ bạn ${fmt(-stats.debt)}`}
                </p>
                <p className="stat-note">Tính từ debt_impact của toàn bộ giao dịch — bấm để xem chi tiết</p>
              </div>
            </div>
          </div>

          {showDebtDetail && (
            <div className="card" style={{ marginTop: '16px' }}>
              <h3 style={{ fontWeight: 600, marginBottom: '12px', fontSize: '1rem' }}>
                Các giao dịch cấu thành công nợ
              </h3>
              {debtDetailRows.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Không có giao dịch ảnh hưởng công nợ.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ngày</th>
                      <th>Loại</th>
                      <th>Ngách</th>
                      <th>Nội dung</th>
                      <th style={{ textAlign: 'right' }}>debt_impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debtDetailRows.map((t) => (
                      <tr key={t.id}>
                        <td>{t.transaction_date}</td>
                        <td>
                          <span className={`badge ${t.transaction_type === 'income' ? 'success' : 'danger'}`}>
                            {t.transaction_type === 'income' ? 'THU' : 'CHI'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge niche-${t.niche}`}>{t.niche.toUpperCase()}</span>
                        </td>
                        <td>{t.notes ?? '—'}</td>
                        <td style={{ textAlign: 'right' }}>
                          {t.debt_impact > 0 ? '+' : ''}
                          {fmt(t.debt_impact)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          <div className="card" style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <h2 className="card-title" style={{ fontSize: '1.1rem' }}>Giao dịch gần đây (20)</h2>
              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="input-field"
                  style={{ paddingLeft: '32px' }}
                  placeholder="Tìm nhanh…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {recent.length === 0 ? (
              <p style={{ padding: '16px 0', color: 'var(--text-secondary)' }}>
                {search ? 'Không có giao dịch khớp.' : 'Chưa có giao dịch nào.'}
              </p>
            ) : (
              <table className="data-table" style={{ marginTop: '16px' }}>
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Loại</th>
                    <th>Ngách</th>
                    <th>Nội dung</th>
                    <th style={{ textAlign: 'right' }}>Số tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((t) => (
                    <tr key={t.id}>
                      <td>{t.transaction_date}</td>
                      <td>
                        <span className={`badge ${t.transaction_type === 'income' ? 'success' : 'danger'}`}>
                          {t.transaction_type === 'income' ? 'THU' : 'CHI'}
                        </span>
                        {t.evidence_pending && (
                          <span className="badge warn" style={{ marginLeft: '4px' }}>Thiếu chứng cứ</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge niche-${t.niche}`}>{t.niche.toUpperCase()}</span>
                      </td>
                      <td>{t.notes ?? '—'}</td>
                      <td style={{ textAlign: 'right' }}>
                        {t.transaction_type === 'income' ? '+' : '-'}
                        {fmt(t.actual_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
