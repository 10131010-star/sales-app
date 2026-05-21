-- 営業ダッシュボード Supabase スキーマ
-- 開発用: RLS を有効化しつつ anon キーで読み書き可能なポリシー（本番前に要見直し）

create extension if not exists "uuid-ossp";

-- 店舗
create table if not exists stores (
  id uuid primary key default uuid_generate_v4(),
  name text not null default '',
  area text not null default '',
  address text not null default '',
  business_type text not null default '',
  hours text not null default '',
  phone text not null default '',
  instagram_url text not null default '',
  google_map_url text not null default '',
  review_site_url text not null default '',
  assignee_id text not null check (assignee_id in ('nakata', 'mitsuyama')),
  adoption_status text not null default '未接触',
  priority text not null default '中',
  sales_memo text not null default '',
  rejection_reason text not null default '',
  next_action text not null default '',
  next_contact_date date,
  last_contact_date date,
  transcription_text text not null default '',
  ai_memo_raw text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 営業目標
create table if not exists sales_targets (
  id uuid primary key default uuid_generate_v4(),
  period_type text not null check (period_type in ('day', 'week', 'month')),
  period_key text not null,
  member_id text not null check (member_id in ('nakata', 'mitsuyama', 'team')),
  visits_target int not null default 0,
  front_ok_target int not null default 0,
  met_manager_target int not null default 0,
  full_talk_target int not null default 0,
  prospect_target int not null default 0,
  appointment_target int not null default 0,
  verbal_ok_target int not null default 0,
  won_target int not null default 0,
  updated_at timestamptz not null default now(),
  unique (period_type, period_key, member_id)
);

-- 営業実績
create table if not exists sales_records (
  id uuid primary key default uuid_generate_v4(),
  record_date date not null,
  member_id text not null check (member_id in ('nakata', 'mitsuyama')),
  store_id uuid references stores(id) on delete set null,
  area text not null default '',
  visits int not null default 0,
  front_ok int not null default 0,
  met_manager int not null default 0,
  full_talk int not null default 0,
  prospect int not null default 0,
  appointment int not null default 0,
  verbal_ok int not null default 0,
  won int not null default 0,
  quick_memo text not null default '',
  negotiation_memo text not null default '',
  transcription_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ナレッジ（共同編集・5カテゴリ）
create table if not exists knowledge_items (
  id text primary key,
  category text not null check (
    category in ('初回訪問', '切り返し', '提案', 'クロージング', '成功事例')
  ),
  title text not null,
  summary text not null default '',
  talk_script text not null default '',
  customer_psychology text not null default '',
  ng_example text not null default '',
  success_point text not null default '',
  next_action text not null default '',
  tags text[] not null default '{}',
  favorite boolean not null default false,
  created_by text not null default 'system',
  updated_by text,
  view_count int not null default 0,
  used_count int not null default 0,
  win_rate numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category, title)
);

create index if not exists idx_stores_area on stores(area);
create index if not exists idx_stores_assignee on stores(assignee_id);
create index if not exists idx_sales_records_date on sales_records(record_date);
create index if not exists idx_sales_records_member on sales_records(member_id);
create index if not exists idx_knowledge_category on knowledge_items(category);

alter table stores enable row level security;
alter table sales_targets enable row level security;
alter table sales_records enable row level security;
alter table knowledge_items enable row level security;

create policy "dev_all_stores" on stores for all using (true) with check (true);
create policy "dev_all_targets" on sales_targets for all using (true) with check (true);
create policy "dev_all_records" on sales_records for all using (true) with check (true);
create policy "dev_all_knowledge" on knowledge_items for all using (true) with check (true);
