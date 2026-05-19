# 営業支援アプリ（デリバリー4社比較）

Uber Eats・出前館・menu・Rocket Now の比較と、店舗カルテ・訪問ログ・KPI・ナレッジをスマホファーストで管理する React アプリです。

## 技術スタック

- React 19 + TypeScript
- Vite 6
- Tailwind CSS 4
- localStorage（Repository パターンで Supabase 差し替え可能）

## セットアップ

```bash
cd sales-app
npm install
npm run dev
```

ブラウザで http://localhost:5173 を開いてください。

## 主な機能

| カテゴリ | 機能 |
|----------|------|
| 比較 | サービス・手数料・UI比較（4社） |
| 分析 | 強いエリア、業態別、人気店舗、未導入 |
| 店舗 | 店舗カルテ（全項目）、検索・絞り込み |
| 営業 | 訪問ログ、KPIワンタップ、商談メモ、今日やること |
| ナレッジ | トーク、断り文句、切り返し、成功/失注、勝ち負けパターン |
| KPI | 訪問〜獲得・転換率、チーム比較、日報、改善メモ |
| その他 | キャンペーン、重点エリア、明日アクション自動整理 |

## Supabase 連携（将来）

`.env` に以下を設定し、`VITE_USE_SUPABASE=true` にすると Supabase リポジトリに切り替わります（実装は `src/lib/storage/supabaseRepo.ts` にスタブあり）。

```
VITE_USE_SUPABASE=true
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-key
```

## データ

初回起動時に `src/data/seed.ts` のサンプルデータが localStorage に保存されます。

## ビルド

```bash
npm run build
npm run preview
```

## 公開（GitHub + Vercel + PWA）

詳細は [DEPLOY.md](./DEPLOY.md) を参照してください。

1. `git push` で GitHub にアップロード
2. [Vercel](https://vercel.com) でリポジトリを Import → 自動で HTTPS の公開 URL が発行されます
3. スマホで URL を開き、「ホーム画面に追加」で PWA として利用できます

`vercel.json` と `vite-plugin-pwa` により Vercel デプロイ・PWA 対応済みです。
