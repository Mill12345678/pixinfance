'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Save } from 'lucide-react';

type Category = { id: string; name: string; direction: 'income' | 'expense' };
type Settings = Record<string, number>;

export default function AdminSettingsClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newName, setNewName] = useState('');
  const [newDirection, setNewDirection] = useState<'income' | 'expense'>('income');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const [threshold, setThreshold] = useState('');
  const [debtLimit, setDebtLimit] = useState('');

  const load = useCallback(() => {
    Promise.all([fetch('/api/admin/categories'), fetch('/api/admin/settings')])
      .then(async ([catRes, setRes]) => {
        if (catRes.ok) {
          const cats = (await catRes.json()) as Category[];
          setCategories(cats);
        }
        if (setRes.ok) {
          const map = (await setRes.json()) as Settings;
          if (map.alert_threshold !== undefined) setThreshold(String(map.alert_threshold));
          if (map.debt_safe_limit !== undefined) setDebtLimit(String(map.debt_safe_limit));
        }
      })
      .catch(() => setMessage({ type: 'error', text: 'Không thể tải dữ liệu cấu hình.' }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  };

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), direction: newDirection }),
    });
    if (res.ok) {
      setNewName('');
      await load();
      showMessage('Đã thêm phân loại.', 'success');
    } else {
      const d = await res.json().catch(() => ({}));
      showMessage(d.error ?? 'Không thể thêm.', 'error');
    }
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return;
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim() }),
    });
    if (res.ok) {
      setEditingId(null);
      await load();
      showMessage('Đã cập nhật phân loại.', 'success');
    } else {
      const d = await res.json().catch(() => ({}));
      showMessage(d.error ?? 'Không thể cập nhật.', 'error');
    }
  };

  const deleteCategory = async (id: string) => {
    const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await load();
      showMessage('Đã xoá phân loại.', 'success');
    } else {
      const d = await res.json().catch(() => ({}));
      showMessage(d.error ?? 'Không thể xoá.', 'error');
    }
  };

  const saveSettings = async () => {
    const body: Record<string, number> = {};
    if (threshold !== '') body.alert_threshold = Number(threshold);
    if (debtLimit !== '') body.debt_safe_limit = Number(debtLimit);

    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      showMessage('Đã lưu cấu hình.', 'success');
    } else {
      const d = await res.json().catch(() => ({}));
      showMessage(d.error ?? 'Không thể lưu cấu hình.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="card">
        <p style={{ color: 'var(--text-muted)' }}>Đang tải…</p>
      </div>
    );
  }

  const incomeCategories = categories.filter((c) => c.direction === 'income');
  const expenseCategories = categories.filter((c) => c.direction === 'expense');

  const renderCategoryList = (title: string, list: Category[]) => (
    <div>
      <h3 style={{ fontWeight: 600, marginBottom: '10px', fontSize: '1rem' }}>{title}</h3>
      {list.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Chưa có phân loại.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {list.map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px' }}>
              {editingId === c.id ? (
                <input
                  className="input-field"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit(c.id)}
                />
              ) : (
                <span style={{ flex: 1, fontWeight: 500 }}>{c.name}</span>
              )}
              {editingId === c.id ? (
                <button className="btn-secondary" onClick={() => saveEdit(c.id)}>
                  <Save size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  Lưu
                </button>
              ) : (
                <>
                  <button
                    className="icon-btn"
                    title="Sửa"
                    onClick={() => {
                      setEditingId(c.id);
                      setEditName(c.name);
                    }}
                  >
                    <Pencil size={15} />
                  </button>
                  <button className="icon-btn danger" title="Xoá" onClick={() => deleteCategory(c.id)}>
                    <Trash2 size={15} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {message && (
        <div
          className="card"
          style={{ padding: '12px 20px', color: message.type === 'success' ? 'var(--success)' : 'var(--danger)', fontSize: '0.9rem' }}
        >
          {message.type === 'success' ? '✓ ' : '⚠️ '}
          {message.text}
        </div>
      )}

      <div className="card">
        <h2 className="card-title" style={{ marginBottom: '16px' }}>Ngưỡng cảnh báo</h2>
        <div className="flex-row">
          <div className="flex-1">
            <label>Ngưỡng cảnh báo hoá đơn (₫)</label>
            <input type="number" className="input-field" value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder="2000000" />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Chi từ công ty ≥ ngưỡng và chưa có hoá đơn → bôi đỏ (F9).
            </p>
          </div>
          <div className="flex-1">
            <label>Mức an toàn công nợ (₫)</label>
            <input type="number" className="input-field" value={debtLimit} onChange={(e) => setDebtLimit(e.target.value)} placeholder="20000000" />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              |Công nợ| vượt mức → banner đỏ trên Dashboard (F9).
            </p>
          </div>
        </div>
        <button className="btn mt-4" onClick={saveSettings}>
          <Save size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          Lưu cấu hình
        </button>
      </div>

      <div className="card">
        <h2 className="card-title" style={{ marginBottom: '16px' }}>Phân loại</h2>
        <form onSubmit={addCategory} className="flex-row" style={{ marginBottom: '20px' }}>
          <div className="flex-1">
            <label>Tên phân loại mới</label>
            <input className="input-field" placeholder="VD: Học cụ STEM" value={newName} onChange={(e) => setNewName(e.target.value)} />
          </div>
          <div className="flex-1">
            <label>Loại</label>
            <select className="input-field" value={newDirection} onChange={(e) => setNewDirection(e.target.value as 'income' | 'expense')}>
              <option value="income">THU</option>
              <option value="expense">CHI</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" className="btn">
              <Plus size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Thêm
            </button>
          </div>
        </form>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {renderCategoryList('Phân loại THU', incomeCategories)}
          {renderCategoryList('Phân loại CHI', expenseCategories)}
        </div>
      </div>
    </div>
  );
}
