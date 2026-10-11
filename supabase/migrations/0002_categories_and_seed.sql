-- Phân loại (categories) cho F14 Admin Settings
create table categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  direction text check (direction in ('income', 'expense')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table categories enable row level security;

create policy "Admin or accountant can read categories" on categories
  for select using (
    (select role from profiles where id = auth.uid()) in ('admin', 'accountant')
  );

create policy "Only admin can insert categories" on categories
  for insert with check (
    (select role from profiles where id = auth.uid()) = 'admin'
  );

create policy "Only admin can update categories" on categories
  for update using (
    (select role from profiles where id = auth.uid()) = 'admin'
  );

create policy "Only admin can delete categories" on categories
  for delete using (
    (select role from profiles where id = auth.uid()) = 'admin'
  );

-- Seed mặc định
insert into categories (name, direction) values
  ('Học phí tháng', 'income'),
  ('Đóng trọn khoá', 'income'),
  ('Dịch vụ AI', 'income'),
  ('B2B Hợp đồng', 'income'),
  ('Tiền lương', 'expense'),
  ('Vật tư', 'expense'),
  ('Thuê mặt bằng', 'expense'),
  ('Điện nước', 'expense'),
  ('Marketing', 'expense'),
  ('Hạ tầng / Cloud', 'expense');

-- Seed admin_settings mặc định
insert into admin_settings (key, value) values
  ('alert_threshold', 2000000),
  ('debt_safe_limit', 20000000)
on conflict (key) do nothing;
