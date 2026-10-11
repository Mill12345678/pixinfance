import { redirect } from 'next/navigation';
import { createSessionClient } from '@/lib/supabase/server';
import AdminSettingsClient from '@/components/AdminSettingsClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/dashboard');

  return (
    <div style={{ maxWidth: '860px' }}>
      <h1 className="card-title" style={{ fontSize: '1.6rem', marginBottom: '4px' }}>
        Admin Settings
      </h1>
      <p className="card-sub" style={{ marginBottom: '24px' }}>
        Phân loại thu/chi &amp; ngưỡng cảnh báo
      </p>
      <AdminSettingsClient />
    </div>
  );
}
