-- RAG用テーブル（店舗分析AI）
-- Supabase SQL Editor に貼り付けて実行してください。
-- 既存の stores / knowledge_items はそのまま利用し、RAG用に拡張テーブルを追加します。

create extension if not exists "uuid-ossp";

-- 1. ベンチマーク（エリア×業態）※ stores とは別管理
create table if not exists benchmarks (
  id uuid primary key default uuid_generate_v4(),
  area text not null,
  business_type text not null,
  sample_size int not null default 0,
  avg_unit_price int not null default 0,
  avg_product_count int not null default 0,
  avg_set_rate int not null default 0,
  avg_late_night_rate int not null default 0,
  avg_review_score numeric(3,2) not null default 0,
  data_source_note text not null default '',
  segment text not null default 'standard',
  segment_label text not null default '',
  search_text text not null default '',
  updated_at timestamptz not null default now(),
  unique (area, business_type, segment)
);

-- 2. 営業履歴ログ（訪問・商談単位）
create table if not exists sales_logs (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid references stores(id) on delete set null,
  member_id text not null default 'nakata',
  visited_at timestamptz not null default now(),
  area text not null default '',
  business_type text not null default '',
  visits int not null default 1,
  front_ok boolean not null default false,
  met_manager boolean not null default false,
  full_talk boolean not null default false,
  prospect boolean not null default false,
  outcome text not null default '保留',
  objection_heard text not null default '',
  hit_proposal text not null default '',
  disliked_point text not null default '',
  owner_reaction text not null default '',
  next_action text not null default '',
  quick_memo text not null default '',
  negotiation_memo text not null default '',
  search_text text not null default '',
  created_at timestamptz not null default now()
);

-- 3. 断り文句・切り返し（ナレッジとは別に検索最適化）
create table if not exists objections (
  id text primary key,
  objection text not null,
  rebuttal text not null default '',
  business_types text[] not null default '{}',
  tags text[] not null default '{}',
  success_rate numeric,
  search_text text not null default '',
  created_by text not null default 'system',
  updated_at timestamptz not null default now()
);

-- 4. 営業ナレッジ（RAG検索用。knowledge_items と同期可能）
create table if not exists knowledge (
  id text primary key,
  category text not null,
  title text not null,
  summary text not null default '',
  talk_script text not null default '',
  tags text[] not null default '{}',
  business_types text[] not null default '{}',
  areas text[] not null default '{}',
  search_text text not null default '',
  favorite boolean not null default false,
  created_by text not null default 'system',
  updated_at timestamptz not null default now()
);

-- 5. 口コミ分析
create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid references stores(id) on delete set null,
  store_name text not null default '',
  area text not null default '',
  business_type text not null default '',
  rating numeric(3,2),
  review_count int not null default 0,
  summary text not null default '',
  raw_text text not null default '',
  dimensions_json jsonb not null default '{}',
  delivery_fit text not null default '要確認',
  delivery_fit_note text not null default '',
  keywords text[] not null default '{}',
  search_text text not null default '',
  analyzed_at timestamptz not null default now()
);

-- 6. 生成済み分析レポート
create table if not exists reports (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid references stores(id) on delete set null,
  store_name text not null,
  area text not null,
  business_type text not null,
  overall_score int not null default 0,
  adoption_potential text not null default '中',
  input_json jsonb not null default '{}',
  result_json jsonb not null default '{}',
  rag_evidence_json jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_benchmarks_area_type on benchmarks(area, business_type);
create index if not exists idx_sales_logs_store on sales_logs(store_id);
create index if not exists idx_sales_logs_area on sales_logs(area);
create index if not exists idx_objections_search on objections using gin(to_tsvector('simple', search_text));
create index if not exists idx_knowledge_search on knowledge using gin(to_tsvector('simple', search_text));
create index if not exists idx_reviews_store on reviews(store_id);
create index if not exists idx_reports_store on reports(store_id);

alter table benchmarks enable row level security;
alter table sales_logs enable row level security;
alter table objections enable row level security;
alter table knowledge enable row level security;
alter table reviews enable row level security;
alter table reports enable row level security;

create policy "dev_all_benchmarks" on benchmarks for all using (true) with check (true);
create policy "dev_all_sales_logs" on sales_logs for all using (true) with check (true);
create policy "dev_all_objections" on objections for all using (true) with check (true);
create policy "dev_all_knowledge" on knowledge for all using (true) with check (true);
create policy "dev_all_reviews" on reviews for all using (true) with check (true);
create policy "dev_all_reports" on reports for all using (true) with check (true);

-- Realtime（任意）
-- alter publication supabase_realtime add table knowledge;
-- alter publication supabase_realtime add table reports;
