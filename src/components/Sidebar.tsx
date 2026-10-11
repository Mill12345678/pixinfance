'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Wallet,
  BookOpenText,
  Landmark,
  LogOut,
  Bell,
  Settings,
  BarChart3,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Quick Add', icon: Wallet },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ledger', label: 'Ledger', icon: BookOpenText },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

type SessionUser = { email?: string; role?: string } | null;

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data ?? null))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    const loadUnread = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (!res.ok) return;
        const items = (await res.json()) as Array<{ is_read: boolean }>;
        setUnread(items.filter((n) => !n.is_read).length);
      } catch {
        // ignore
      }
    };
    loadUnread();
    const interval = setInterval(loadUnread, 30000);
    return () => clearInterval(interval);
  }, [pathname]);

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Landmark size={20} />
        </div>
        <div>
          <div className="sidebar-brand-text">Finance HQ</div>
          <div className="sidebar-brand-sub">Dual-book Finance</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`sidebar-link ${active ? 'active' : ''}`}>
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto' }}>
        <Link href="/notifications" className="sidebar-link" style={{ position: 'relative' }}>
          <Bell size={18} />
          <span>Thông báo</span>
          {unread > 0 && <span className="unread-badge">{unread}</span>}
        </Link>
        {user?.role === 'admin' && (
          <Link href="/admin" className="sidebar-link">
            <Settings size={18} />
            <span>Admin Settings</span>
          </Link>
        )}
        {user && (
          <div style={{ padding: '12px 14px', marginBottom: '8px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-on-dark)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.email}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-on-dark-muted)' }}>
              {user.role === 'admin' ? 'Admin' : 'Kế toán'}
            </div>
          </div>
        )}
        <button type="button" className="sidebar-link" onClick={handleSignOut} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
          <LogOut size={18} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
