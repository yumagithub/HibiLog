-- マルチデバイス対応: push_subscriptionsテーブルを複数デバイス対応に変更

-- 1. unique(user_id)制約を削除
ALTER TABLE public.push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_key;

-- 2. endpoint列にユニーク制約を追加（同じendpointは1つだけ）
ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);

-- 3. user_id + endpointの複合インデックスを作成
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_endpoint_idx ON public.push_subscriptions(user_id, endpoint);

-- 4. デバイス名カラムを追加（オプション）
ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS device_name TEXT;

COMMENT ON TABLE public.push_subscriptions IS 'プッシュ通知購読情報。1ユーザーが複数デバイスで購読可能。';
COMMENT ON COLUMN public.push_subscriptions.endpoint IS 'プッシュ通知エンドポイント（デバイス固有）。';
COMMENT ON COLUMN public.push_subscriptions.device_name IS 'デバイス名（オプション）。ユーザーが識別しやすいように。';
