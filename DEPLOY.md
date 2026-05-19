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

## 注意

- データは端末の **localStorage** に保存されます（ブラウザごと・URLごと）
- HTTPS 必須（Vercel は自動で HTTPS）
- 手数料などマスタデータはアプリ内で編集してください
