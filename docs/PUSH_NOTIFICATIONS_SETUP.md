# プッシュ通知機能のセットアップガイド

このドキュメントでは、HibiLog のバックグラウンド通知機能の実装とセットアップ方法を説明します。

## 概要

バクの空腹度が一定値以下になったときに、ユーザーにプッシュ通知を送信する機能です。
アプリが開いていない状態でも通知が届くよう、以下の仕組みで実装されています：

1. **Web Push API**: ブラウザのプッシュ通知機能
2. **Service Worker**: バックグラウンドで動作する通知受信ハンドラー
3. **Supabase Edge Functions**: サーバーサイドの定期実行処理（cron）
4. **VAPID 認証**: サーバーからブラウザへの安全な通知送信

## アーキテクチャ

```
[Supabase Cron (1時間ごと)]
        ↓
[hunger-check Edge Function]
        ↓ (空腹度を計算・通知が必要か判定)
[Web Push API] → [Service Worker] → [ユーザーに通知表示]
```

### 1. クライアント側 (ブラウザ)

**コンポーネント:**

- `components/settings-tab.tsx`: 通知のオン/オフ設定 UI
- `public/sw.js`: Service Worker（通知の受信と表示）

**フロー:**

1. ユーザーが設定画面で通知をオンにする
2. ブラウザの通知権限をリクエスト
3. Service Worker がプッシュ通知を購読
4. 購読情報（endpoint, keys）を Supabase に保存

### 2. サーバー側 (Supabase)

**コンポーネント:**

- `supabase/functions/hunger-check/index.ts`: Edge Function
- `supabase/functions/_cron.yml`: cron 設定ファイル
- `app/actions.ts`: Server Actions（購読管理、通知送信）

**フロー:**

1. cron が 1 時間ごとに`hunger-check`を実行
2. 全ユーザーのバクの空腹度を計算
3. 空腹度が閾値（25%）を下回ったユーザーを特定
4. Push 購読情報を取得し、Web Push API で通知を送信

## セットアップ手順

### 1. VAPID 鍵の生成

```bash
npx web-push generate-vapid-keys
```

出力例：

```
=======================================
Public Key:
BNp7... (長い文字列)

Private Key:
AbC123... (長い文字列)
=======================================
```

### 2. 環境変数の設定

#### ローカル開発 (`.env.local`)

```env
# Web Push用VAPID鍵
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BNp7...
VAPID_PRIVATE_KEY=AbC123...
ADMIN_EMAIL=admin@example.com
```

#### Vercel (本番環境)

Vercel ダッシュボード → Settings → Environment Variables で設定：

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (公開鍵)
- `VAPID_PRIVATE_KEY` (秘密鍵) - **Sensitive に設定**
- `ADMIN_EMAIL` (管理者メールアドレス)

#### Supabase Edge Functions

Supabase ダッシュボード → Project Settings → Edge Functions → Secrets で設定：

- `VAPID_PUBLIC_KEY` (公開鍵)
- `VAPID_PRIVATE_KEY` (秘密鍵)
- `ADMIN_EMAIL` (管理者メールアドレス)

### 3. Supabase Edge Function のデプロイ

```bash
# Supabase CLIでログイン
npx supabase login

# プロジェクトにリンク
npx supabase link --project-ref your-project-ref

# Edge Functionをデプロイ
npx supabase functions deploy hunger-check

# cronスケジュールも自動デプロイされる
```

### 4. データベースマイグレーション

`push_subscriptions`テーブルが必要です。マイグレーションファイル：

```sql
-- supabase/migrations/20241118000000_create_push_subscriptions_table.sql
CREATE TABLE push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLSポリシー
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own subscriptions"
  ON push_subscriptions
  FOR ALL
  USING (auth.uid() = user_id);
```

マイグレーション実行：

```bash
npx supabase db push
```

## 動作確認

### 1. 通知権限のテスト

1. アプリにログイン
2. 設定タブ → 「プッシュ通知」をオン
3. ブラウザの通知権限ダイアログで「許可」
4. 「テスト通知を送信」ボタンで動作確認

### 2. バックグラウンド通知のテスト

**方法 1: Edge Function を手動実行**

```bash
# ローカルで実行
npx supabase functions serve hunger-check

# 別ターミナルで実行
curl -X POST http://localhost:54321/functions/v1/hunger-check \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**方法 2: cron の動作確認**

- 本番環境では 1 時間ごとに自動実行される
- Supabase ダッシュボード → Edge Functions → Logs で実行ログを確認

### 3. 空腹度テスト

バクの空腹度を手動で 25%以下に設定して、次の cron 実行で通知が届くか確認：

```sql
-- Supabase SQL Editorで実行
UPDATE baku_profiles
SET hunger_level = 20, last_fed_at = now() - interval '24 hours'
WHERE user_id = 'your-user-id';
```

## トラブルシューティング

### 通知が届かない

**チェックリスト:**

1. ブラウザの通知権限が許可されているか
2. Service Worker が登録されているか（DevTools → Application → Service Workers）
3. 購読情報が DB に保存されているか（`push_subscriptions`テーブル）
4. VAPID 鍵が正しく設定されているか
5. Edge Function がデプロイされているか Supabase Dashboard → Edge Functions）
6. cron が実行されているか（Edge Function Logs 確認）

### デバッグ方法

**1. クライアント側（ブラウザ）**

```javascript
// DevTools Consoleで確認
navigator.serviceWorker.ready.then((reg) => {
  reg.pushManager.getSubscription().then((sub) => {
    console.log("Subscription:", sub);
  });
});
```

**2. サーバー側（Edge Function）**

```bash
# ローカルでログを確認
npx supabase functions serve hunger-check --debug

# 本番環境のログ
# Supabase Dashboard → Edge Functions → hunger-check → Logs
```

**3. データベース確認**

```sql
-- 購読情報の確認
SELECT * FROM push_subscriptions;

-- バクの空腹度確認
SELECT user_id, hunger_level, last_fed_at
FROM baku_profiles
WHERE hunger_level < 30;
```

### よくあるエラー

#### "VAPID keys are not set"

- 環境変数が正しく設定されていない
- Edge Functions の環境変数を確認（Supabase Dashboard）

#### "410 Gone" / "404 Not Found"

- プッシュ購読が期限切れまたは無効
- ユーザーに再購読を促す（自動的に DB から削除される）

#### "Notification permission denied"

- ユーザーがブラウザで通知を拒否
- ブラウザ設定から許可する必要がある

## 開発上の注意点

### ローカル開発での制限

1. **Service Worker は localhost/HTTPS のみ**

   - `http://localhost:3000`では動作
   - IP アドレス（例：`http://192.168.1.1:3000`）では動作しない

2. **cron は本番環境のみ**

   - ローカルでは cron が動作しない
   - 手動で Edge Function を実行してテスト

3. **ブラウザごとの違い**
   - Chrome と Firefox では通知の表示が異なる
   - Safari は独自の Push API 実装（本実装では未対応）

### セキュリティ考慮事項

1. **VAPID 秘密鍵の管理**

   - 絶対に Git にコミットしない
   - 環境変数で管理
   - Vercel では Sensitive 設定を有効化

2. **購読情報の保護**

   - RLS ポリシーで保護
   - ユーザーは自分の購読情報のみアクセス可能

3. **レート制限**
   - 通知の送信頻度に注意
   - 現在は 1 時間ごとのチェックのみ

## カスタマイズ

### 通知の頻度を変更

`supabase/functions/_cron.yml`を編集：

```yaml
# 30分ごとに実行
schedule: "*/30 * * * *"

# 6時間ごとに実行
schedule: "0 */6 * * *"
```

### 空腹度の閾値を変更

`supabase/functions/hunger-check/index.ts`を編集：

```typescript
// 30%で通知
const HUNGER_THRESHOLD = 30;
```

### 通知メッセージのカスタマイズ

`supabase/functions/hunger-check/index.ts`を編集：

```typescript
const payload = JSON.stringify({
  title: "カスタムタイトル",
  body: "カスタムメッセージ",
  icon: "/custom-icon.png",
});
```

## 参考リンク

- [Web Push API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [web-push library](https://github.com/web-push-libs/web-push)
