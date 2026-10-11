import NotificationsClient from '@/components/NotificationsClient';

export const dynamic = 'force-dynamic';

export default function NotificationsPage() {
  return (
    <div style={{ maxWidth: '720px' }}>
      <h1 className="card-title" style={{ fontSize: '1.6rem', marginBottom: '4px' }}>
        Thông báo
      </h1>
      <p className="card-sub" style={{ marginBottom: '24px' }}>
        Giao dịch mới &amp; cảnh báo hệ thống
      </p>
      <NotificationsClient />
    </div>
  );
}
