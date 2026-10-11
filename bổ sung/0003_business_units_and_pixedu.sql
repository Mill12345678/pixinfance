-- PiXerse is the only legal entity. PiXedu is an internal business unit.

create table if not exists business_units (
  id uuid default gen_random_uuid() primary key,
  code text not null unique check (code in ('pixerse_core', 'pixedu', 'shared')),
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table business_units enable row level security;

create policy "Users can read business units" on business_units
  for select using (
    (select role from profiles where id = auth.uid()) in ('admin', 'accountant')
  );

create policy "Only admin can manage business units" on business_units
  for all using (
    (select role from profiles where id = auth.uid()) = 'admin'
  );

insert into business_units (code, name, description) values
  ('pixerse_core', 'PiXerse Core', 'AI R&D, software, outsourcing, consulting and SaaS'),
  ('pixedu', 'PiXedu', 'Education, STEM classes, workshops and education kits'),
  ('shared', 'Shared', 'Shared costs and central administration')
on conflict (code) do nothing;

alter table transactions
  add column if not exists business_unit_id uuid references business_units(id),
  add column if not exists payment_status text not null default 'paid'
    check (payment_status in ('unpaid', 'partial', 'paid', 'overdue')),
  add column if not exists cost_type text not null default 'direct'
    check (cost_type in ('direct', 'shared')),
  add column if not exists allocation_method text
    check (allocation_method in ('revenue_ratio', 'headcount', 'area', 'hours', 'fixed_percent'));

create index if not exists transactions_business_unit_idx
  on transactions (business_unit_id);

create index if not exists transactions_payment_status_idx
  on transactions (payment_status);

-- Existing transactions are assigned to PiXerse core for a safe migration.
update transactions
set business_unit_id = (select id from business_units where code = 'pixerse_core')
where business_unit_id is null;

alter table transactions
  alter column business_unit_id set not null;

create table if not exists cost_allocations (
  id uuid default gen_random_uuid() primary key,
  transaction_id uuid references transactions(id) on delete cascade not null,
  business_unit_id uuid references business_units(id) not null,
  allocation_percent numeric(7,4) not null check (allocation_percent > 0 and allocation_percent <= 100),
  allocated_amount bigint not null check (allocated_amount >= 0),
  allocation_method text not null
    check (allocation_method in ('revenue_ratio', 'headcount', 'area', 'hours', 'fixed_percent')),
  notes text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table cost_allocations enable row level security;

create policy "Admin or accountant can read cost allocations" on cost_allocations
  for select using (
    (select role from profiles where id = auth.uid()) in ('admin', 'accountant')
  );

create policy "Admin or accountant can insert cost allocations" on cost_allocations
  for insert with check (
    (select role from profiles where id = auth.uid()) in ('admin', 'accountant')
  );

create table if not exists courses (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  course_type text not null check (course_type in ('class', 'workshop', 'summer_camp', 'kit', 'school_program')),
  price bigint not null default 0 check (price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table courses enable row level security;

create policy "Admin or accountant can read courses" on courses
  for select using (
    (select role from profiles where id = auth.uid()) in ('admin', 'accountant')
  );

create policy "Only admin can manage courses" on courses
  for all using (
    (select role from profiles where id = auth.uid()) = 'admin'
  );
