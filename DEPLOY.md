# デプロイ手順（GitHub + Vercel + PWA）

## 1. GitHub にアップロード

```bash
cd sales-app
git init
git add .
git commit -m "Initial commit: sales support PWA app"
```

[GitHub](https://github.com/new) でリポジトリ `sales-app` を作成（空の README で OK）し、次を実行:

```bash
git remote add origin https://github.com/<あなたのユーザー名>/sales-app.git
git branch -M main
git push -u origin main
```

### GitHub CLI を使う場合

```bash
gh auth login
gh repo create sales-app --public --source=. --remote=origin --push
```

## 2. Vercel でデプロイ（公開 URL）

1. [vercel.com](https://vercel.com) にログイン
2. **Add New Project** → GitHub の `sales-app` を Import
3. Framework Preset: **Vite**（自動検出）
4. **Deploy** をクリック

完了後、`https://sales-app-xxxx.vercel.app` のような URL が発行されます。

### Vercel CLI を使う場合

```bash
npm i -g vercel
vercel login
vercel --prod
```

`vercel.json` で SPA ルーティングとビルド設定済みです。

## 3. スマホで PWA として追加

1. 公開 URL をスマホのブラウザ（Safari / Chrome）で開く
2. **iPhone（Safari）**: 共有 → 「ホーム画面に追加」
3. **Android（Chrome）**: メニュー → 「アプリをインストール」または「ホーム画面に追加」

## 4. ナレッジ共同編集（Supabase + Realtime）

### 環境変数（Vercel / `.env.local`）

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

未設定時は **localStorage** のみ（リアルタイム共有なし）。

### Supabase 側の設定

1. SQL Editor で `supabase/knowledge_items.sql` を実行
2. 既存 DB に `use_count` がある場合:
   ```sql
   alter table knowledge_items rename column use_count to used_count;
   ```
3. Realtime を有効化:
   ```sql
   alter publication supabase_realtime add table knowledge_items;
   ```
   または Dashboard → **Database** → **Publications** → `supabase_realtime` で `knowledge_items` を ON

### 動作確認（リアルタイム）

1. PC とスマホ（またはシークレット窓×2）で同じ公開 URL を開く
2. 右上が **共有モード：Supabase** になっていることを確認
3. 片方でナレッジを追加 → もう片方に **「最新データに更新されました」** と一覧反映

## 注意

- Supabase **未設定**時: データは端末の **localStorage**（ブラウザごと）
- Supabase **設定時**: 店舗・KPI は引き続き Supabase、ナレッジは **Realtime 同期**
- HTTPS 必須（Vercel は自動で HTTPS）
