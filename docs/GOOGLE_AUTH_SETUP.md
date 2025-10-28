# Google 認証の設定ガイド

## 問題：本番環境で Google 認証のコールバックが localhost にリダイレクトされる

### 原因

`window.location.origin`を使用していたため、本番環境でも誤った URL が設定されていました。

### 解決方法

## 1. 環境変数の設定

### ローカル開発環境

`.env.local`ファイルを作成：

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Vercel 本番環境

Vercel ダッシュボードで以下の環境変数を設定：

1. **Settings** → **Environment Variables** に移動
2. 以下の変数を追加：

```
NEXT_PUBLIC_SUPABASE_URL = your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key
NEXT_PUBLIC_SITE_URL = https://your-app.vercel.app
```

⚠️ **重要**: `NEXT_PUBLIC_SITE_URL`は**あなたの実際の Vercel ドメイン**に置き換えてください。

## 2. Supabase の設定

### Google OAuth 設定

1. Supabase ダッシュボードにログイン
2. **Authentication** → **Providers** → **Google** を開く
3. Google Cloud Console で取得した **Client ID** と **Client Secret** を入力

### リダイレクト URL の設定

1. **Authentication** → **URL Configuration** を開く
2. **Redirect URLs** に以下を追加：

```
http://localhost:3000/auth/callback
https://your-app.vercel.app/auth/callback
```

3. **Site URL** を設定：
   - 本番: `https://your-app.vercel.app`

## 3. Google Cloud Console の設定

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクトを選択（または新規作成）
3. **APIs & Services** → **Credentials** を開く
4. **OAuth 2.0 Client IDs** を作成/編集
5. **Authorized redirect URIs** に以下を追加：

```
https://your-project-url.supabase.co/auth/v1/callback
```

⚠️ `your-project-url`は Supabase プロジェクトの URL に置き換えてください。

## 4. デプロイ

```bash
git add .
git commit -m "fix: configure site URL for production OAuth redirects"
git push origin main
```

Vercel が自動的にデプロイします。

## 5. 動作確認

1. 本番環境の URL にアクセス
2. ログインページで Google ログインを試す
3. 認証後、正しく本番環境にリダイレクトされることを確認

## トラブルシューティング

### まだ localhost にリダイレクトされる場合

1. **Vercel の環境変数を確認**

   - ダッシュボードで`NEXT_PUBLIC_SITE_URL`が正しく設定されているか確認
   - 再デプロイが必要な場合があります

2. **ブラウザキャッシュをクリア**

   - 古いリダイレクト URL がキャッシュされている可能性があります

3. **Supabase のリダイレクト設定を確認**
   - 本番 URL が正しく追加されているか確認

### エラー: "Invalid Redirect URL"

- Supabase の Redirect URLs に本番ドメインが追加されているか確認
- URL の末尾に`/auth/callback`が含まれているか確認

### エラー: "redirect_uri_mismatch"

- Google Cloud Console の Authorized redirect URIs を確認
- Supabase のコールバック URL が正しく設定されているか確認
