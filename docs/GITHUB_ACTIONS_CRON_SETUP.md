# GitHub Actions で Cron ジョブを実行

Vercel の Hobby アカウントでは Cron Jobs が1日1回に制限されているため、GitHub Actions で複数回の Cron 実行を管理しています。

## セットアップ手順（重要！）

### 1. GitHub リポジトリシークレットを設定 ⚠️

**これをしないとワークフローが実行されません**

1. GitHub リポジトリを開く
2. `Settings` → `Secrets and variables` → `Actions` を選択
3. `New repository secret` をクリック
4. 以下のシークレットを追加:

#### `CRON_SECRET`

- **Name**: `CRON_SECRET`
- **Value**: `.env.local` の `CRON_SECRET` の値（または安全なランダム文字列）
- **例**: `your_secure_random_string_12345`

### 2. Vercel デプロイメント URL を確認

ワークフローは以下の URL にリクエストを送ります:

```
https://hibi-log.vercel.app/api/cron/hunger-check
```

- ドメインが `hibi-log.vercel.app` でない場合、`.github/workflows/cron-jobs.yml` の URL を更新してください
- 本番環境にデプロイ済みか確認してください

### 3. ワークフロー確認

`.github/workflows/cron-jobs.yml` で以下のジョブが自動実行されます:

| ジョブ             | スケジュール | 動作                                       |
| ------------------ | ------------ | ------------------------------------------ |
| **Hunger Check**   | 毎時         | `POST /api/cron/hunger-check` を呼び出し   |
| **Daily Reminder** | 毎時         | `POST /api/cron/daily-reminder` を呼び出し |
| **Random Prompt**  | 11:30 JST    | `POST /api/cron/random-prompt` を呼び出し  |

### 3. 手動実行（テスト用）

GitHub の Actions タブから「Scheduled Cron Jobs」ワークフローを選択し、「Run workflow」で手動実行できます。

## API Routes との連携

### リクエストヘッダー

`.github/workflows/cron-jobs.yml` で以下が毎時 0分に自動実行されます:

| ステップ           | 動作                                                                 |
| ------------------ | -------------------------------------------------------------------- |
| **Hunger Check**   | `POST /api/cron/hunger-check` を呼び出し                             |
| **Daily Reminder** | `POST /api/cron/daily-reminder` を呼び出し                           |
| **Random Prompt**  | 11:30-11:59 JST の場合のみ `POST /api/cron/random-prompt` を呼び出し |

### 4. テスト実行

1. GitHub リポジトリの `Actions` タブを開く
2. 左側から「Scheduled Cron Jobs」を選択
3. `Run workflow` → `Run workflow` をクリック
4. ワークフローが実行されるのを確認

## トラブルシューティング

### ワークフローが実行されない・実行ジョブが表示されない

**原因**: GitHub Actions ワークフローが有効になっていない可能性

**解決方法**:

1. リポジトリの `Settings` → `Actions` → `General` を確認
2. `Actions permissions` が「Allow all actions and reusable workflows」になっているか確認
3. ワークフローファイル（`.github/workflows/cron-jobs.yml`）が main ブランチにあるか確認

### API が 401 エラーを返す

**原因**: `CRON_SECRET` が設定されていない、または一致していない

**確認項目**:

1. GitHub `Settings` → `Secrets and variables` → `Actions` で `CRON_SECRET` が存在するか確認
2. `.env.local` の `CRON_SECRET` と GitHub シークレットの値が一致しているか確認
3. ワークフローログで `Authorization` ヘッダーが付与されているか確認（ログは値は表示されません）

### API が 404 エラーを返す

**原因**: Vercel デプロイメント URL が間違っているか、デプロイされていない

**確認項目**:

1. `https://hibi-log.vercel.app/api/cron/hunger-check` が正しい URL か確認
2. Vercel にデプロイが成功しているか確認
3. ブラウザで直接 URL にアクセスしてみる

### ワークフロー実行ログの確認方法

1. GitHub リポジトリの `Actions` タブを開く
2. 「Scheduled Cron Jobs」をクリック
3. 実行履歴から対象のジョブをクリック
4. 各ステップを展開してログを確認

## タイムゾーン

GitHub Actions は **UTC** で動作しています:

- **Hunger Check / Daily Reminder**: 毎時 0分 UTC（= 毎時 9分 JST）
  - API 内で JST 時刻に変換して、ユーザー設定に従って通知
- **Random Prompt**: 毎時 0分 UTC で実行、11:30-11:59 JST のみ動作

## Pro プランへのアップグレード

将来的に以下の場合は、Vercel Pro プランを検討:

- GitHub Actions の無料分数（2,000分/月）では足りなくなった
- Vercel ダッシュボードから Cron Jobs を管理したい
- より詳細なモニタリングが必要

## 参考リンク

- [GitHub Actions: Workflow syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [GitHub Actions: Schedule triggers](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
- [Vercel: Cron Jobs (Pro only)](https://vercel.com/docs/cron-jobs)
- [GitHub Actions: Scheduling workflows](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
- [Vercel: Cron Jobs (Pro only)](https://vercel.com/docs/cron-jobs)
