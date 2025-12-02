-- Update notification settings in baku_profiles table

-- 1. 一時的なカラムを追加
ALTER TABLE public.baku_profiles 
ADD COLUMN notification_interval_new INTEGER;

-- 2. 既存のTEXT値をINTEGERにマッピング
UPDATE public.baku_profiles 
SET notification_interval_new = CASE 
  WHEN notification_interval = '3-hours' THEN 3
  WHEN notification_interval = '6-hours' THEN 6
  WHEN notification_interval = '12-hours' THEN 12
  WHEN notification_interval = '24-hours' THEN 24
  WHEN notification_interval = '1-hour' THEN 6  -- デフォルトは6時間
  ELSE 6
END;

-- 3. 古いカラムを削除
ALTER TABLE public.baku_profiles DROP COLUMN notification_interval;

-- 4. 新しいカラムをリネーム
ALTER TABLE public.baku_profiles RENAME COLUMN notification_interval_new TO notification_interval;

-- 5. NOT NULL制約とCHECK制約を追加
ALTER TABLE public.baku_profiles 
ALTER COLUMN notification_interval SET NOT NULL,
ALTER COLUMN notification_interval SET DEFAULT 6,
ADD CONSTRAINT baku_profiles_notification_interval_check CHECK (notification_interval IN (3, 6, 12, 24));

-- 6. last_notification_sent_atカラムを追加
ALTER TABLE public.baku_profiles 
ADD COLUMN IF NOT EXISTS last_notification_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN public.baku_profiles.notification_interval IS 'ユーザーが設定した通知間隔（時間単位）。3, 6, 12, 24 のいずれか。';
COMMENT ON COLUMN public.baku_profiles.last_notification_sent_at IS '最後に通知を送信した日時。通知頻度の制御に使用。';
