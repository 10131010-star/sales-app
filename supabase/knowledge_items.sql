-- knowledge_items テーブル（ナレッジ共同編集用）
-- Supabase SQL Editor にそのまま貼り付けて実行してください。
-- 既存の旧スキーマがある場合は、末尾のマイグレーション部も実行してください。

create extension if not exists "uuid-ossp";

-- 新規作成時
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

create index if not exists idx_knowledge_items_category on knowledge_items(category);
create index if not exists idx_knowledge_items_favorite on knowledge_items(favorite);
create index if not exists idx_knowledge_items_updated on knowledge_items(updated_at desc);

alter table knowledge_items enable row level security;

drop policy if exists "dev_all_knowledge" on knowledge_items;
create policy "dev_all_knowledge" on knowledge_items
  for all
  using (true)
  with check (true);

-- Realtime 有効化（SQL Editor で実行）:
alter publication supabase_realtime add table knowledge_items;
-- ※ 既に追加済みの場合はエラーになるので無視してOK
-- または Dashboard → Database → Publications → supabase_realtime で knowledge_items をON

-- 既存テーブルに use_count がある場合のリネーム:
-- alter table knowledge_items rename column use_count to used_count;

-- ---------- 既存テーブルからのマイグレーション（旧 uuid 版がある場合） ----------
-- 必要に応じてコメントを外して実行してください。
--
-- alter table knowledge_items rename to knowledge_items_legacy;
-- （上記 create table を実行後）
-- insert into knowledge_items (id, category, title, summary, talk_script, ...)
-- select gen_random_uuid()::text, category, title, ... from knowledge_items_legacy;
-- drop table knowledge_items_legacy;
