# ゲストログイン機能の設定手順

## Supabase で匿名認証を有効化

### 1. Supabase ダッシュボードにアクセス

https://app.supabase.com にアクセスし、プロジェクトを選択

### 2. Authentication 設定を開く

左サイドバーから **Authentication** → **Providers** を選択

### 3. Anonymous Sign-ins を有効化

1. **Anonymous Sign-ins** のセクションを探す
2. **Enable Anonymous sign-ins** のトグルを ON にする
3. **Save** をクリック

### 4. Email 認証も有効化（デモログイン用）

1. **Email** のセクションを探す
2. **Enable Email provider** が ON になっていることを確認
3. **Confirm email** を OFF（デモ用）
   - 本番環境では必要に応じて ON

### 5. 動作確認

1. アプリのログインページにアクセス
2. 「ゲストとして始める」ボタンをクリック
3. 自動的にログインしてメインページに遷移

## トラブルシューティング

### エラー: "Anonymous sign-ins are disabled"

**原因**: Supabase で匿名認証が有効化されていない

**解決方法**:

1. Supabase ダッシュボードで **Authentication** → **Providers**
2. **Anonymous Sign-ins** を ON にする
3. 保存して再試行

### ゲストデータが消える

**原因**: ブラウザのキャッシュ・Cookie 削除、または別のブラウザを使用

**対処法**:

- ゲストモードは一時的なもの
- データを保持したい場合は「アカウント登録」を促す
- 設定タブにアップグレード通知が表示される

### デモアカウントでログインできない

**原因**: Email 認証が有効化されていない、または確認メールが必要

**解決方法**:

1. Supabase ダッシュボードで **Authentication** → **Providers**
2. **Email** プロバイダーが ON になっていることを確認
3. **Authentication** → **Email Templates** → **Confirm email** を OFF（デモ用）

## セキュリティ注意事項

### 本番環境での推奨設定

1. **匿名ユーザーの制限**

   - RLS ポリシーで匿名ユーザーの権限を制限
   - 投稿数やストレージ使用量に上限を設定

2. **データ保持期間**

   - 匿名ユーザーのデータは一定期間後に削除
   - PostgreSQL の cron ジョブで自動削除

3. **レート制限**
   - 匿名ユーザーの API 呼び出しに制限を設ける
   - Supabase Edge で実装

### サンプル RLS ポリシー

```sql
-- 匿名ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Anonymous users can only access their own data"
ON public.memories
FOR ALL
USING (
  auth.uid() = user_id
);

-- 匿名ユーザーの投稿数制限
CREATE POLICY "Anonymous users limited posts"
ON public.memories
FOR INSERT
WITH CHECK (
  (
    SELECT is_anonymous
    FROM auth.users
    WHERE id = auth.uid()
  ) = false
  OR
  (
    SELECT COUNT(*)
    FROM public.memories
    WHERE user_id = auth.uid()
  ) < 10
);
```

## アカウントアップグレードフロー

### ゲストから正式ユーザーへ

1. **ゲストモードでアプリを使用**

   - データは Supabase に保存される（匿名ユーザーとして）

2. **設定タブでアップグレード通知を表示**

   - 「アカウント登録」ボタンが表示される

3. **アカウント登録**

   - ログインページで Google 認証またはメール登録
   - Supabase が自動的に匿名ユーザーを正式ユーザーに変換
   - データは保持される

4. **データ移行（必要に応じて）**
   ```typescript
   // 匿名ユーザーを正式ユーザーにリンク
   const { data, error } = await supabase.auth.updateUser({
     email: "user@example.com",
   });
   ```

## 機能一覧

### ゲストモード

- ✅ ログイン不要ですぐに始められる
- ✅ バクを育てられる
- ✅ 思い出を投稿できる
- ✅ データは Supabase に保存
- ⚠️ ブラウザのデータ削除でセッション消失
- 💡 後からアカウント登録可能

### デモログインモード

- ✅ 複数の固定アカウント
- ✅ デモ用に使いやすい
- ✅ パスワード不要（ワンクリック）
- ✅ 各アカウントは独立

### 通常ログインモード

- ✅ Google OAuth
- ✅ メール/パスワード認証
- ✅ データ永続化
- ✅ 複数デバイスで同期
