-- gen_random_uuid() built-in tu PostgreSQL 13+, khong can extension

-- Bảng: profiles (Quản lý User/Auth)
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  role text check (role in ('admin', 'accountant')) default 'accountant',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tự tạo profile khi user đăng ký (auth.users insert). Role mặc định = accountant.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Bảng: transactions (Quản lý Thu Chi)
create table transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  transaction_date date not null,
  transaction_type text check (transaction_type in ('income', 'expense', 'transfer')) not null, -- 'transfer' dành cho Phase 2 (UI v1 tắt)
  niche text check (niche in ('ai', 'stem', 'chung')) not null,
  actual_amount bigint not null, -- VND, bat buoc > 0
  invoiced_amount bigint not null default 0, -- So tien tren hoa don (>= 0)
  vat_amount bigint not null default 0, -- Thue (>= 0)
  source_account text check (source_account in ('company_bank', 'personal_bank', 'cash')) not null,
  -- Mapping document_status: no_invoice = "Chua co hoa don" (dang no), has_invoice = "Da co hoa don", pending_invoice = "Can xuat hoa don" (THU vao cong ty)
  document_status text check (document_status in ('has_invoice', 'pending_invoice', 'no_invoice')) not null,
  document_url text, -- Link chinh (chu y) cua hoa don; cac file phu nam o bang documents
  category text, -- Phan loai (F10/F14). Co the chuyen sang FK cua bang categories o F14
  contract_id text, -- Ma Hop Dong (F10 - chi ngach AI)
  evidence_pending boolean not null default false, -- R4: Quick Add bo qua upload bat buoc -> cho bo sung chung cu
  notes text,
  debt_impact bigint not null default 0, -- Nguon chan ly duy nhat tinh Cong No (xem PRD v2 muc 5.4)
  -- Soft delete (audit, khong mat so lieu)
  deleted_at timestamp with time zone,
  deleted_by uuid references profiles(id)
);

-- Tính năng: Security (Bảo mật Row Level Security để người nào chỉ xem dữ liệu người đó nếu cần, Admin xem tất cả)
alter table profiles enable row level security;
alter table transactions enable row level security;

create policy "Users can view their own profile or admin can view all" on profiles
  for select using (auth.uid() = id or (select role from profiles where id = auth.uid()) = 'admin');

create policy "Admin or accountant can view all transactions" on transactions
  for select using (
    (select role from profiles where id = auth.uid()) in ('admin', 'accountant')
  );

-- R9: admin va accountant deu duoc insert/update (ke toan nhap ho goc nhin ca cong ty)
create policy "Admin or accountant can insert transactions" on transactions
  for insert with check (
    (select role from profiles where id = auth.uid()) in ('admin', 'accountant')
  );

-- Update (bao gom soft delete) chi danh cho admin
create policy "Admin can update transactions" on transactions
  for update using (
    (select role from profiles where id = auth.uid()) = 'admin'
  );

-- Accountant duoc update (ngoai tru soft-delete duoc chan boi trigger ben duoi)
create policy "Accountant can update transactions" on transactions
  for update using (
    (select role from profiles where id = auth.uid()) = 'accountant'
  );

-- Chan account (role <> admin) set cot soft-delete (deleted_at/deleted_by).
-- Security definer de tranh RLS profiles chan cau subquery.
create or replace function enforce_soft_delete_admin_only()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller_role text;
begin
  caller_role := (select role from profiles where id = auth.uid());
  -- Service role (khong co JWT, auth.uid() null) duoc phep; user JWT thi phai la admin
  if caller_role is null or caller_role = 'admin' then
    return new;
  end if;
  if new.deleted_at is distinct from old.deleted_at
     or new.deleted_by is distinct from old.deleted_by then
    raise exception 'Only admin can soft-delete transactions';
  end if;
  return new;
end;
$$;

create trigger trg_transactions_soft_delete_admin_only
  before update on transactions
  for each row execute function enforce_soft_delete_admin_only();

-- Bảng: documents (Chứng từ đính kèm - hỗ trợ nhiều file cho 1 giao dịch, PRD v2 R3/F2)
create table documents (
  id uuid default gen_random_uuid() primary key,
  transaction_id uuid references transactions(id) on delete cascade not null,
  url text not null, -- Link Google Drive / Supabase Storage
  file_type text check (file_type in ('image', 'pdf', 'link')) not null,
  uploaded_by uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table documents enable row level security;

create policy "Admin or accountant can read documents" on documents
  for select using (
    (select role from profiles where id = auth.uid()) in ('admin', 'accountant')
  );

create policy "Admin or accountant can insert documents" on documents
  for insert with check (
    (select role from profiles where id = auth.uid()) in ('admin', 'accountant')
  );

-- Bảng: students (Phase 1 tối giản - đủ cho luồng THU STEM; LMS đầy đủ ở Phase 2)
create table students (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  parent_phone text,
  parent_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table students enable row level security;

create policy "Admin or accountant can read students" on students
  for select using (
    (select role from profiles where id = auth.uid()) in ('admin', 'accountant')
  );

create policy "Only admin can insert students" on students
  for insert with check (
    (select role from profiles where id = auth.uid()) = 'admin'
  );

-- Bảng: notifications (Trung tâm thông báo, PRD v2 F13)
create table notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) not null,
  type text check (type in ('transaction_created', 'invoice_alert', 'debt_alert', 'system')) not null,
  title text not null,
  body text,
  transaction_id uuid references transactions(id) on delete set null,
  is_read boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table notifications enable row level security;

create policy "Users can read their own notifications" on notifications
  for select using (user_id = auth.uid());

create policy "Users can update their own notifications" on notifications
  for update using (user_id = auth.uid());

-- Bảng: admin_settings (Cấu hình hệ thống, PRD v2 F14)
create table admin_settings (
  key text primary key, -- alert_threshold | debt_safe_limit
  value bigint not null
);
alter table admin_settings enable row level security;

create policy "Admin or accountant can read settings" on admin_settings
  for select using (
    (select role from profiles where id = auth.uid()) in ('admin', 'accountant')
  );

create policy "Only admin can write settings" on admin_settings
  for all using (
    (select role from profiles where id = auth.uid()) = 'admin'
  );
