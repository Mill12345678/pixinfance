'use client';

import { useMemo, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, X, Download } from 'lucide-react';

type Txn = {
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

type Filters = {
  niche: string;
  type: string;
  source: string;
  docStatus: string;
  missingInvoice: boolean;
  missingEvidence: boolean;
  contractId: string;
  search: string;
};

const EMPTY_FILTERS: Filters = {
  niche: '',
  type: '',
  source: '',
  docStatus: '',
  missingInvoice: false,
  missingEvidence: false,
  contractId: '',
  search: '',
};

const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫';

const sourceLabels: Record<string, string> = {
  company_bank: 'Công ty',
  personal_bank: 'Cá nhân',
  cash: 'Tiền mặt',
};

const docLabels: Record<string, string> = {
  has_invoice: 'Đã có hoá đơn',
  pending_invoice: 'Cần xuất hoá đơn',
  no_invoice: 'Chưa có hoá đơn',
};

type Props = {
  initialRows: Txn[];
  isAdmin: boolean;
  alertThreshold: number | null;
};

export default function LedgerClient({ initialRows, isAdmin, alertThreshold }: Props) {
  const [rows, setRows] = useState<Txn[]>(initialRows);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Txn | null>(null);
  const [deleting, setDeleting] = useState<Txn | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(0);
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setPage(0);
  };

  const filtered = useMemo(() => {
    let result = rows;
    const f = filters;

    if (f.niche) result = result.filter((t) => t.niche === f.niche);
    if (f.type) result = result.filter((t) => t.transaction_type === f.type);
    if (f.source) result = result.filter((t) => t.source_account === f.source);
    if (f.docStatus) result = result.filter((t) => t.document_status === f.docStatus);
    if (f.missingInvoice)
      result = result.filter((t) => t.document_status === 'no_invoice');
    if (f.missingEvidence) result = result.filter((t) => t.evidence_pending);
    if (f.contractId)
      result = result.filter((t) => t.contract_id?.toLowerCase().includes(f.contractId.toLowerCase()));
    if (f.search) {
      const q = f.search.toLowerCase();
      result = result.filter(
        (t) =>
          (t.notes ?? '').toLowerCase().includes(q) ||
          String(t.actual_amount).includes(q) ||
          (t.category ?? '').toLowerCase().includes(q) ||
          (t.contract_id ?? '').toLowerCase().includes(q)
      );
    }

    return result.sort(
      (a, b) =>
        b.transaction_date.localeCompare(a.transaction_date) ||
        b.actual_amount - a.actual_amount
    );
  }, [rows, filters]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const showMessage = (text: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccess(text);
      setError(null);
    } else {
      setError(text);
      setSuccess(null);
    }
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 4000);
  };

  const refresh = useCallback(async () => {
    const res = await fetch('/api/transactions');
    if (res.ok) {
      const data = await res.json();
      setRows(data);
    }
  }, []);

  const handleDelete = async () => {
    if (!deleting) return;
    const res = await fetch(`/api/transactions/${deleting.id}`, { method: 'DELETE' });
    if (res.ok) {
      setRows((rows) => rows.filter((r) => r.id !== deleting.id));
      setDeleting(null);
      showMessage('Đã xoá giao dịch.', 'success');
    } else {
      const data = await res.json().catch(() => ({}));
      showMessage(data.error ?? 'Không thể xoá giao dịch.', 'error');
    }
  };

  const threshold = alertThreshold ?? Infinity;
  const isAlertRow = (t: Txn) =>
    t.transaction_type === 'expense' &&
    t.source_account === 'company_bank' &&
    t.document_status === 'no_invoice' &&
    t.actual_amount >= threshold;

  // F8 CSV export — cột khớp Transactions_Template.csv.
  const exportCsv = () => {
    const header = [
      'Date',
      'Transaction_Type',
      'Niche',
      'Actual_Amount',
      'Invoiced_Amount',
      'VAT_Amount',
      'Source_Account',
      'Document_Status',
      'Notes',
      'Involved_Person',
      'Debt_Impact',
    ];

    const nicheLabels: Record<string, string> = { ai: 'AI B2B', stem: 'STEM', chung: 'Chung' };
    const sourceLabelsCSV: Record<string, string> = {
      company_bank: 'Company Bank',
      personal_bank: 'Personal Bank',
      cash: 'Cash',
    };
    const docLabelsCSV: Record<string, string> = {
      has_invoice: 'Has Invoice',
      pending_invoice: 'Pending Invoice',
      no_invoice: 'No Invoice',
    };

    const lines = filtered.map((t) =>
      [
        t.transaction_date,
        t.transaction_type === 'income' ? 'Income' : 'Expense',
        nicheLabels[t.niche] ?? t.niche,
        t.actual_amount,
        t.invoiced_amount || 0,
        t.vat_amount || 0,
        sourceLabelsCSV[t.source_account] ?? t.source_account,
        docLabelsCSV[t.document_status] ?? t.document_status,
        `"${(t.notes ?? '').replace(/"/g, '""')}"`,
        '',
        t.debt_impact ?? 0,
      ].join(',')
    );

    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeFilterCount =
    Object.entries(filters).filter(([, v]) => v).length;

  return (
    <>
      {/* Toolbar */}
      <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn" onClick={() => { setEditing(null); setShowForm(true); }}>
              <Plus size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Thêm Giao Dịch Mới
            </button>
            <button className="btn-secondary" onClick={exportCsv} title="Xuất danh sách đang lọc ra CSV">
              <Download size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Xuất CSV
            </button>
            {activeFilterCount > 0 && (
              <button className="btn-secondary" onClick={resetFilters}>
                <X size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                Xoá tất cả lọc ({activeFilterCount})
              </button>
            )}
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {filtered.length} / {rows.length} giao dịch
          </span>
        </div>

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
          <div>
            <label>Ngách</label>
            <select className="input-field" value={filters.niche} onChange={(e) => setFilter('niche', e.target.value)}>
              <option value="">Tất cả</option>
              <option value="ai">AI</option>
              <option value="stem">STEM</option>
              <option value="chung">Chung</option>
            </select>
          </div>
          <div>
            <label>Loại</label>
            <select className="input-field" value={filters.type} onChange={(e) => setFilter('type', e.target.value)}>
              <option value="">Tất cả</option>
              <option value="income">THU</option>
              <option value="expense">CHI</option>
            </select>
          </div>
          <div>
            <label>Nguồn tiền</label>
            <select className="input-field" value={filters.source} onChange={(e) => setFilter('source', e.target.value)}>
              <option value="">Tất cả</option>
              <option value="company_bank">Công ty</option>
              <option value="personal_bank">Cá nhân</option>
              <option value="cash">Tiền mặt</option>
            </select>
          </div>
          <div>
            <label>Trạng thái hoá đơn</label>
            <select className="input-field" value={filters.docStatus} onChange={(e) => setFilter('docStatus', e.target.value)}>
              <option value="">Tất cả</option>
              <option value="has_invoice">Đã có</option>
              <option value="no_invoice">Chưa có</option>
              <option value="pending_invoice">Cần xuất</option>
            </select>
          </div>
          <div>
            <label>Mã hợp đồng</label>
            <input
              className="input-field"
              placeholder="VD: AI-2024-01"
              value={filters.contractId}
              onChange={(e) => setFilter('contractId', e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
            <label className="checkbox-label">
              <input type="checkbox" checked={filters.missingInvoice} onChange={(e) => setFilter('missingInvoice', e.target.checked)} />
              Chỉ thiếu hoá đơn
            </label>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <label className="checkbox-label">
              <input type="checkbox" checked={filters.missingEvidence} onChange={(e) => setFilter('missingEvidence', e.target.checked)} />
              Chỉ thiếu chứng cứ
            </label>
          </div>
          <div>
            <label>Text search</label>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="input-field"
                style={{ paddingLeft: '32px' }}
                placeholder="Nội dung, số tiền…"
                value={filters.search}
                onChange={(e) => setFilter('search', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: '16px', padding: '14px 20px', color: 'var(--danger)', fontSize: '0.9rem' }}>
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="card" style={{ marginBottom: '16px', padding: '14px 20px', color: 'var(--success)', fontSize: '0.9rem' }}>
          ✓ {success}
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {paged.length === 0 ? (
          <p style={{ padding: '24px', color: 'var(--text-secondary)' }}>Không có giao dịch nào khớp bộ lọc.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table ledger-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Loại</th>
                  <th>Nội dung</th>
                  <th>Phân loại</th>
                  <th>Ngách</th>
                  <th>Nguồn</th>
                  <th style={{ textAlign: 'right' }}>Số tiền thực</th>
                  <th style={{ textAlign: 'right' }}>Tiền hoá đơn</th>
                  <th style={{ textAlign: 'right' }}>VAT</th>
                  <th>HĐ</th>
                  <th>Hợp đồng</th>
                  <th style={{ textAlign: 'center' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((t) => (
                  <tr
                    key={t.id}
                    style={isAlertRow(t) ? { background: 'rgba(229, 62, 62, 0.08)' } : undefined}
                    onDoubleClick={() => { setEditing(t); setShowForm(true); }}
                  >
                    <td>{t.transaction_date}</td>
                    <td>
                      <span className={`badge ${t.transaction_type === 'income' ? 'success' : 'danger'}`}>
                        {t.transaction_type === 'income' ? 'THU' : 'CHI'}
                      </span>
                    </td>
                    <td>{t.notes ?? '—'}</td>
                    <td>{t.category ?? '—'}</td>
                    <td>
                      <span className={`badge niche-${t.niche}`}>{t.niche.toUpperCase()}</span>
                    </td>
                    <td>{sourceLabels[t.source_account] ?? t.source_account}</td>
                    <td style={{ textAlign: 'right' }}>
                      {t.transaction_type === 'income' ? '+' : '-'}
                      {fmt(t.actual_amount)}
                    </td>
                    <td style={{ textAlign: 'right' }}>{t.invoiced_amount ? fmt(t.invoiced_amount) : '—'}</td>
                    <td style={{ textAlign: 'right' }}>{t.vat_amount ? fmt(t.vat_amount) : '—'}</td>
                    <td>
                      <span className={`badge ${t.document_status === 'no_invoice' ? 'warn' : t.document_status === 'has_invoice' ? 'success' : 'info'}`}>
                        {docLabels[t.document_status] ?? t.document_status}
                      </span>
                      {t.evidence_pending && (
                        <span className="badge warn" style={{ marginLeft: '4px' }}>Thiếu chứng cứ</span>
                      )}
                      {isAlertRow(t) && (
                        <span className="badge danger" style={{ marginLeft: '4px' }}>Cảnh báo</span>
                      )}
                    </td>
                    <td>{t.contract_id ?? '—'}</td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button
                        className="icon-btn"
                        title="Sửa"
                        onClick={() => { setEditing(t); setShowForm(true); }}
                      >
                        <Pencil size={15} />
                      </button>
                      {isAdmin && (
                        <button
                          className="icon-btn danger"
                          title="Xoá"
                          onClick={() => setDeleting(t)}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid var(--border-soft)' }}>
          <select
            className="input-field"
            style={{ width: 'auto' }}
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
          >
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
            <option value={100}>100 / trang</option>
          </select>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button className="btn-secondary" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              Trước
            </button>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Trang {page + 1} / {pageCount}
            </span>
            <button className="btn-secondary" disabled={page >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}>
              Sau
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <TransactionForm
          txn={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={async () => {
            setShowForm(false);
            setEditing(null);
            await refresh();
            showMessage(editing ? 'Đã cập nhật giao dịch.' : 'Đã tạo giao dịch mới.', 'success');
          }}
          onError={(msg) => showMessage(msg, 'error')}
        />
      )}

      {deleting && (
        <div className="modal-backdrop" onClick={() => setDeleting(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '12px', fontSize: '1.1rem', fontWeight: 600 }}>
              Bạn có chắc chắn muốn xoá?
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Giao dịch ngày {deleting.transaction_date} — {fmt(deleting.actual_amount)} sẽ được xoá mềm (có thể khôi phục từ DB).
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setDeleting(null)}>Huỷ</button>
              <button className="btn btn-danger" onClick={handleDelete}>
                <Trash2 size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

type FormProps = {
  txn: Txn | null;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
};

function TransactionForm({ txn, onClose, onSaved, onError }: FormProps) {
  const isEdit = Boolean(txn);

  const [transactionType, setTransactionType] = useState<'income' | 'expense'>(txn?.transaction_type ?? 'expense');
  const [niche, setNiche] = useState<'ai' | 'stem' | 'chung'>(txn?.niche ?? 'chung');
  const [sourceAccount, setSourceAccount] = useState<'company_bank' | 'personal_bank' | 'cash'>(txn?.source_account ?? 'personal_bank');
  const [date, setDate] = useState(txn?.transaction_date ?? new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState(txn ? String(txn.actual_amount) : '');
  const [invoicedAmount, setInvoicedAmount] = useState(txn ? String(txn.invoiced_amount || '') : '');
  const [vatAmount, setVatAmount] = useState(txn ? String(txn.vat_amount || '') : '');
  const [category, setCategory] = useState(txn?.category ?? '');
  const [contractId, setContractId] = useState(txn?.contract_id ?? '');
  const [docStatus, setDocStatus] = useState(txn?.document_status ?? 'no_invoice');
  const [notes, setNotes] = useState(txn?.notes ?? '');
  const [fakeInvoiceExcess, setFakeInvoiceExcess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const amountNum = parseInt(amount.replace(/\./g, ''), 10);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      onError('Số tiền phải là số dương.');
      setSubmitting(false);
      return;
    }

    const body = {
      transaction_date: date,
      transaction_type: transactionType,
      niche,
      source_account: sourceAccount,
      actual_amount: amountNum,
      invoiced_amount: invoicedAmount ? parseInt(invoicedAmount, 10) : 0,
      vat_amount: vatAmount ? parseInt(vatAmount, 10) : 0,
      category: category || null,
      contract_id: contractId || null,
      document_status: docStatus,
      notes: notes || null,
      fake_invoice_excess: fakeInvoiceExcess ? parseInt(fakeInvoiceExcess, 10) : undefined,
    };

    const res = await fetch(txn ? `/api/transactions/${txn.id}` : '/api/transactions', {
      method: txn ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      onError(data.error ?? 'Lưu thất bại.');
      return;
    }
    onSaved();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
            {isEdit ? 'Sửa giao dịch' : 'Thêm giao dịch mới'}
          </h3>
          <button className="icon-btn" onClick={onClose} title="Đóng">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="flex-row">
            <div className="flex-1">
              <label>Loại</label>
              <select className="input-field" value={transactionType} onChange={(e) => setTransactionType(e.target.value as 'income' | 'expense')}>
                <option value="expense">CHI</option>
                <option value="income">THU</option>
              </select>
            </div>
            <div className="flex-1">
              <label>Ngày</label>
              <input type="date" className="input-field" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </div>

          <div className="flex-row">
            <div className="flex-1">
              <label>Ngách</label>
              <select className="input-field" value={niche} onChange={(e) => setNiche(e.target.value as 'ai' | 'stem' | 'chung')}>
                <option value="ai">AI</option>
                <option value="stem">STEM</option>
                <option value="chung">Chung</option>
              </select>
            </div>
            <div className="flex-1">
              <label>Nguồn tiền</label>
              <select className="input-field" value={sourceAccount} onChange={(e) => setSourceAccount(e.target.value as 'company_bank' | 'personal_bank' | 'cash')}>
                <option value="personal_bank">Cá nhân</option>
                <option value="company_bank">Công ty</option>
                <option value="cash">Tiền mặt</option>
              </select>
            </div>
          </div>

          <div className="flex-row">
            <div className="flex-1">
              <label>Số tiền thực (₫)</label>
              <input type="number" className="input-field" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1280750" required />
            </div>
            <div className="flex-1">
              <label>Số tiền hoá đơn (₫)</label>
              <input type="number" className="input-field" value={invoicedAmount} onChange={(e) => setInvoicedAmount(e.target.value)} placeholder="0" />
            </div>
            <div className="flex-1">
              <label>VAT (₫)</label>
              <input type="number" className="input-field" value={vatAmount} onChange={(e) => setVatAmount(e.target.value)} placeholder="0" />
            </div>
          </div>

          <div className="flex-row">
            <div className="flex-1">
              <label>Phân loại</label>
              <input className="input-field" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="VD: Học phí tháng, Lương…" />
            </div>
            <div className="flex-1">
              <label>Mã hợp đồng (AI)</label>
              <input className="input-field" value={contractId} onChange={(e) => setContractId(e.target.value)} placeholder="AI-2026-01" />
            </div>
          </div>

          <div className="flex-row">
            <div className="flex-1">
              <label>Trạng thái hoá đơn</label>
              <select className="input-field" value={docStatus} onChange={(e) => setDocStatus(e.target.value as Txn['document_status'])}>
                <option value="no_invoice">Chưa có hoá đơn</option>
                <option value="has_invoice">Đã có hoá đơn</option>
                <option value="pending_invoice">Cần xuất hoá đơn</option>
              </select>
            </div>
            <div className="flex-1">
              <label>Phần thừa hoá đơn khống (F12)</label>
              <input type="number" className="input-field" value={fakeInvoiceExcess} onChange={(e) => setFakeInvoiceExcess(e.target.value)} placeholder="0" />
            </div>
          </div>

          <div>
            <label>Ghi chú</label>
            <input className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Mô tả chi tiết…" />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Huỷ</button>
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? 'Đang lưu…' : isEdit ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
