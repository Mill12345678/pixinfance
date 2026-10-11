'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Landmark, LogIn, UserPlus } from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/dashboard';

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/auth/${mode === 'signin' ? 'signin' : 'signup'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error ?? 'Đã có lỗi xảy ra.' });
        return;
      }

      if (mode === 'signup') {
        setMessage({ type: 'success', text: 'Đã tạo tài khoản. Đăng nhập ngay.' });
        setMode('signin');
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setMessage({ type: 'error', text: 'Không thể kết nối tới máy chủ.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <div className="sidebar-logo" style={{ width: '44px', height: '44px' }}>
          <Landmark size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Finance HQ</h1>
          <p className="card-sub" style={{ marginBottom: '0' }}>Đăng nhập hệ thống</p>
        </div>
      </div>

      <div className="type-switch" role="group" aria-label="Auth mode">
        <button
          type="button"
          className={`type-btn ${mode === 'signin' ? 'active primary' : ''}`}
          onClick={() => {
            setMode('signin');
            setMessage(null);
          }}
        >
          <LogIn size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          Đăng nhập
        </button>
        <button
          type="button"
          className={`type-btn ${mode === 'signup' ? 'active success' : ''}`}
          onClick={() => {
            setMode('signup');
            setMessage(null);
          }}
        >
          <UserPlus size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          Tạo tài khoản
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div>
          <label>Email</label>
          <input
            type="email"
            className="input-field"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Mật khẩu</label>
          <input
            type="password"
            className="input-field"
            placeholder={mode === 'signup' ? 'Ít nhất 6 ký tự' : '••••••••'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        {message && (
          <p style={{ color: message.type === 'success' ? 'var(--success)' : 'var(--danger)', fontSize: '0.9rem' }}>
            {message.text}
          </p>
        )}

        <button type="submit" className="btn" disabled={submitting}>
          {submitting
            ? 'Đang xử lý…'
            : mode === 'signin'
              ? 'Đăng nhập'
              : 'Tạo tài khoản'}
        </button>
      </form>
    </div>
  );
}
