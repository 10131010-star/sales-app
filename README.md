# 営業ダッシュボード

飲食店向けフードデリバリー営業チーム（中田大翔・密山敦也）向けの営業支援 Web アプリです。

## セットアップ

### 起動（Supabase なしで OK）

```bash
npm install
npm run dev
```

**Supabase 未設定時**はブラウザの **localStorage** にデータが保存されます。スマホ単体・ローカル開発ですぐ使えます。

### チーム共有（任意）Supabase

1. [Supabase](https://supabase.com/) でプロジェクトを作成
2. SQL Editor で `supabase/schema.sql` を実行
3. `.env` に URL と anon key を設定（`.env.example` 参照）

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

設定がある場合のみ Supabase に自動切り替えします。未設定でもアプリは動作します。

### Vercel デプロイ

- Framework: Vite
- Build: `npm run build`
- Output: `dist`
- チーム共有時のみ環境変数に `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` を設定

## 機能

| タブ | 内容 |
|------|------|
| ホーム | 今日のKPI、目標進捗、ボトルネック、今日やること |
| 比較 | 中田・密山・チームの KPI 比較 |
| 店舗 | 店舗カルテ（追加・編集・削除） |
| 営業 | 日別・週別・月別の実績入力 |
| ナレッジ | 切り返し・成功事例などの共有 |

## データテーブル

- `stores` - 店舗カルテ
- `sales_targets` - 目標（今日/今週/今月）
- `sales_records` - 営業実績
- `knowledge_items` - ナレッジ

## KPI 転換率

- フロント突破率 = フロントOK ÷ 訪問数
- 担当者対面率 = 担当者対面 ÷ フロントOK
- フルトーク率 = フルトーク ÷ 担当者対面
- 見込み化率 = 見込み ÷ フルトーク
- アポ化率 = アポ ÷ 見込み
- 内諾率 = 内諾 ÷ アポ
- 最終獲得率 = 獲得 ÷ 訪問数

（FTR は使用しません）

## 将来拡張

- 営業録音の文字起こし（`transcription_text` 欄あり）
- AI 要約・切り返し提案（`ai_memo_raw` 欄あり）
