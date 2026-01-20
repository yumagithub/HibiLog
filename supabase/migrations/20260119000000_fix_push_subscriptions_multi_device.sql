-- 複数デバイス対応へのマイグレーション
-- 1. UNIQUE(user_id) を削除し、UNIQUE(endpoint) に変更
-- 2. device_name を追加して、端末を識別可能にする

ALTER TABLE push_subscriptions 
DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_key;

-- 既に存在する場合はスキップ
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'push_subscriptions_endpoint_key'
			AND conrelid = 'push_subscriptions'::regclass
	) THEN
		ALTER TABLE push_subscriptions
		ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);
	END IF;
END$$;

-- device_name 列を追加（端末識別用、保存時は updateViaCache を利用）
ALTER TABLE push_subscriptions 
ADD COLUMN IF NOT EXISTS device_name TEXT DEFAULT NULL;

-- device_registered_at を追加（どの順番で登録されたか追跡）
ALTER TABLE push_subscriptions 
ADD COLUMN IF NOT EXISTS device_registered_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- インデックスの再構築（既存の user_id インデックスは保持し、endpoint も追加）
DROP INDEX IF EXISTS push_subscriptions_user_id_idx;
CREATE INDEX push_subscriptions_user_id_idx ON push_subscriptions(user_id);
CREATE INDEX push_subscriptions_endpoint_idx ON push_subscriptions(endpoint);

-- コメント追加
COMMENT ON TABLE push_subscriptions IS 'Web Push 通知の購読情報。複数デバイス対応。';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'Web Push の endpoint（一意）。同一デバイスの再登録時は upsert で上書き。';
COMMENT ON COLUMN push_subscriptions.device_name IS 'デバイス識別用の名前（例：Chrome on MacBook）。';
