-- Google Maps 情報（将来 Supabase 移行用）
-- 現状は localStorage（sales-app:google-maps:{storeId}）を使用

create table if not exists google_maps_info (
  store_id uuid primary key references stores(id) on delete cascade,
  maps_url text not null default '',
  place_name text not null default '',
  address text not null default '',
  genre text not null default '',
  rating numeric(3,2),
  review_count int,
  hours text not null default '',
  photo_count int,
  latest_reviews text not null default '',
  positive_trend text not null default '',
  negative_trend text not null default '',
  data_status text not null default 'unconfirmed',
  updated_at timestamptz not null default now()
);

alter table google_maps_info enable row level security;
create policy "dev_all_google_maps" on google_maps_info for all using (true) with check (true);
