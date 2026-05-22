-- RAG強化マイグレーション（既存 rag_schema.sql 実行済みの環境向け）

-- sales_logs 拡張
alter table sales_logs add column if not exists outcome text not null default '保留';
alter table sales_logs add column if not exists hit_proposal text not null default '';
alter table sales_logs add column if not exists disliked_point text not null default '';
alter table sales_logs add column if not exists owner_reaction text not null default '';
alter table sales_logs add column if not exists next_action text not null default '';

-- benchmarks セグメント
alter table benchmarks add column if not exists segment text not null default 'standard';
alter table benchmarks add column if not exists segment_label text not null default '';
drop index if exists benchmarks_area_business_type_key;
alter table benchmarks drop constraint if exists benchmarks_area_business_type_key;
create unique index if not exists idx_benchmarks_area_type_seg on benchmarks(area, business_type, segment);

-- reviews 拡張
alter table reviews add column if not exists raw_text text not null default '';
alter table reviews add column if not exists dimensions_json jsonb not null default '{}';
alter table reviews add column if not exists delivery_fit text not null default '要確認';
alter table reviews add column if not exists delivery_fit_note text not null default '';

-- objections 成功提案
alter table objections add column if not exists suggestions text[] not null default '{}';
alter table objections add column if not exists success_case_title text not null default '';
