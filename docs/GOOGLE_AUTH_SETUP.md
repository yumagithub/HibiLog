# Google認証の設定ガイド

## 問題：本番環境でGoogle認証のコールバックがlocalhostにリダイレクトされる

### 原因
`window.location.origin`を使用していたため、本番環境でも誤ったURLが設定されていました。

### 解決方法

## 1. 環境変数の設定

### ローカル開発環境

`.env.local`ファイルを作成：

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Vercel本番環境

Vercelダッシュボードで以下の環境変数を設定：

1. **Settings** → **Environment Variables** に移動
2. 以下の変数を追加：

```
NEXT_PUBLIC_SUPABASE_URL = your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key
NEXT_PUBLIC_SITE_URL = https://your-app.vercel.app
```

⚠️ **重要**: `NEXT_PUBLIC_SITE_URL`は**あなたの実際のVercelドメイン**に置き換えてください。

## 2. Supabaseの設定

### Google OAuth設定

1. Supabaseダッシュボードにログイン
2. **Authentication** → **Providers** → **Google** を開く
3. Google Cloud Consoleで取得した **Client ID** と **Client Secret** を入力

### リダイレクトURLの設定

1. **Authentication** → **URL Configuration** を開く
2. **Redirect URLs** に以下を追加：

```
http://localhost:3000/auth/callback
https://your-app.vercel.app/auth/callback
```

3. **Site URL** を設定：
   - 本番: `https://your-app.vercel.app`

## 3. Google Cloud Consoleの設定

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクトを選択（または新規作成）
3. **APIs & Services** → **Credentials** を開く
4. **OAuth 2.0 Client IDs** を作成/編集
5. **Authorized redirect URIs** に以下を追加：

```
https://your-project-url.supabase.co/auth/v1/callback
```

⚠️ `your-project-url`はSupabaseプロジェクトのURLに置き換えてください。

## 4. デプロイ

```bash
git add .
git commit -m "fix: configure site URL for production OAuth redirects"
git push origin main
```

Vercelが自動的にデプロイします。

## 5. 動作確認

1. 本番環境のURLにアクセス
2. ログインページでGoogleログインを試す
3. 認証後、正しく本番環境にリダイレクトされることを確認

## トラブルシューティング

### まだlocalhostにリダイレクトされる場合

1. **Vercelの環境変数を確認**
   - ダッシュボードで`NEXT_PUBLIC_SITE_URL`が正しく設定されているか確認
   - 再デプロイが必要な場合があります

2. **ブラウザキャッシュをクリア**
   - 古いリダイレクトURLがキャッシュされている可能性があります

3. **Supabaseのリダイレクト設定を確認**
   - 本番URLが正しく追加されているか確認

### エラー: "Invalid Redirect URL"

- SupabaseのRedirect URLsに本番ドメインが追加されているか確認
- URLの末尾に`/auth/callback`が含まれているか確認

### エラー: "redirect_uri_mismatch"

- Google Cloud ConsoleのAuthorized redirect URIsを確認
- SupabaseのコールバックURLが正しく設定されているか確認
