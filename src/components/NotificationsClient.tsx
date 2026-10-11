'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCheck, Bell, AlertTriangle, ReceiptText, Info } from 'lucide-react';

type Notification = {
  id: string;
  type: 'transaction_created' | 'invoice_alert' | 'debt_alert' | 'system';
  title: string;
  body: string | null;
  transaction_id: string | null;
  is_read: boolean;
  created_at: string;
};

const iconMap = {
  transaction_created: { Icon: ReceiptText, cls: 'primary' },
  invoice_alert: { Icon: AlertTriangle, cls: 'warn' },
  debt_alert: { Icon: AlertTriangle, cls: 'danger' },
  system: { Icon: Info, cls: 'info' },
};

const typeLabels: Record<string, string> = {
  transaction_created: 'Giao dịch',
  invoice_alert: 'Cảnh báo hoá đơn',
  debt_alert: 'Cảnh báo công nợ',
  system: 'Hệ thống',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

export default function NotificationsClient() {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    fetch('/api/notifications')
      .then(async (res) => {
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setError(d.error ?? 'Không thể tải thông báo.');
          return;
        }
        setItems((await res.json()) as Notification[]);
      })
      .catch(() => setError('Không thể tải thông báo.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    setItems((items) => items.map((n) => ({ ...n, is_read: true })));
  };

  const markRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    });
    setItems((items) => items.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const unreadCount = items.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="card">
        <p style={{ color: 'var(--text-muted)' }}>Đang tải…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ color: 'var(--danger)' }}>
        <p>⚠️ {error}</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {unreadCount > 0 ? `${unreadCount} chưa đọc` : 'Tất cả đã đọc'}
        </span>
        {unreadCount > 0 && (
          <button className="btn-secondary" onClick={markAllRead}>
            <CheckCheck size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Bell size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Chưa có thông báo nào.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items.map((n) => {
            const { Icon, cls } = iconMap[n.type] ?? iconMap.system;
            return (
              <div
                key={n.id}
                className="card"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  gap: '14px',
                  cursor: n.transaction_id ? 'pointer' : undefined,
                  opacity: n.is_read ? 0.65 : 1,
                }}
                onClick={() => {
                  if (!n.is_read) void markRead(n.id);
                  if (n.transaction_id) router.push('/ledger');
                }}
              >
                <div className={`stat-icon ${cls}`} style={{ width: '38px', height: '38px' }}>
                  <Icon size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.92rem' }}>{n.title}</p>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  {n.body && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>{n.body}</p>}
                  <span className="badge primary" style={{ marginTop: '6px' }}>
                    {typeLabels[n.type] ?? n.type}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
