# GitHub Actions で Cron ジョブを実行

Vercel の Hobby アカウントでは Cron Jobs が1日1回に制限されているため、GitHub Actions で複数回の Cron 実行を管理しています。

## セットアップ手順

### 1. GitHub リポジトリシークレットの設定

GitHub リポジトリの `Settings > Secrets and variables > Actions` に以下を追加:

#### `CRON_SECRET`

- API Routes の認証に使用
- `.env.local` の `CRON_SECRET` と同じ値を設定
- **重要**: 安全な文字列を使用してください

#### `APP_URL`

- アプリケーションのベースURL
- 本番環境: `https://your-domain.com`
- ステージング: `https://staging.your-domain.com`

**例:**

```
CRON_SECRET=your_secure_random_string_here
APP_URL=https://hibilog.com
```

### 2. ワークフロー確認

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

すべてのリクエストに以下のヘッダーが付与されます:

```
Authorization: Bearer {CRON_SECRET}
Content-Type: application/json
```

### 認証チェック（API Route内）

```typescript
const authHeader = request.headers.get("authorization");
const cronSecret = process.env.CRON_SECRET;
if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

## タイムゾーン

GitHub Actions は **UTC** で動作します:

- **Hunger Check**: `0 * * * *` (UTC, 毎時)
- **Daily Reminder**: `0 * * * *` (UTC, 毎時)
  - API 内で JST 時刻に変換して、ユーザー設定時刻に通知
- **Random Prompt**: `30 2 * * *` (UTC, 02:30 = JST 11:30)

## トラブルシューティング

### ワークフローが実行されない

1. リポジトリの `Actions` タブで有効になっているか確認
2. シークレットが正しく設定されているか確認
3. `.github/workflows/cron-jobs.yml` が main ブランチにコミットされているか確認

### API が 401 エラーを返す

1. `CRON_SECRET` が正しく設定されているか確認
2. API Route内の `CRON_SECRET` が同じ値か確認
3. ワークフローログで `Authorization` ヘッダーが付与されているか確認

### ワークフロー実行ログを確認

1. GitHub リポジトリの `Actions` タブを開く
2. 左側から「Scheduled Cron Jobs」を選択
3. 実行履歴から該当するジョブを選択
4. ログを確認

## Pro プランへのアップグレード

将来的に以下のいずれかの場合は、Vercel Pro へのアップグレードを検討:

- Vercel ダッシュボードから Cron Jobs を管理したい
- より多くの Cron 実行が必要になった
- GitHub Actions の保有分数に制限がある

## 参考リンク

- [GitHub Actions: Workflow syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [GitHub Actions: Scheduling workflows](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
- [Vercel: Cron Jobs (Pro only)](https://vercel.com/docs/cron-jobs)
