-- 通知設定カラムを baku_profiles テーブルに追加
-- 複数の通知タイプに対応

-- 空腹通知の有効/無効
ALTER TABLE public.baku_profiles 
ADD COLUMN IF NOT EXISTS hunger_notifications_enabled BOOLEAN DEFAULT true;

-- 定期リマインダー通知
ALTER TABLE public.baku_profiles 
ADD COLUMN IF NOT EXISTS daily_reminder_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS daily_reminder_time TEXT DEFAULT '09:00';

-- ランダム投稿促進通知
ALTER TABLE public.baku_profiles 
ADD COLUMN IF NOT EXISTS random_prompt_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_random_prompt_sent_at TIMESTAMPTZ;

-- 達成通知
ALTER TABLE public.baku_profiles 
ADD COLUMN IF NOT EXISTS achievement_enabled BOOLEAN DEFAULT true;

-- 最後に送信した達成通知のタイプを記録（重複防止）
ALTER TABLE public.baku_profiles 
ADD COLUMN IF NOT EXISTS last_achievement_sent TEXT[];

-- コメント追加
COMMENT ON COLUMN public.baku_profiles.hunger_notifications_enabled IS '空腹通知の有効/無効';
COMMENT ON COLUMN public.baku_profiles.daily_reminder_enabled IS '定期リマインダー通知の有効/無効';
COMMENT ON COLUMN public.baku_profiles.daily_reminder_time IS '定期リマインダーの通知時刻 (HH:mm形式)';
COMMENT ON COLUMN public.baku_profiles.random_prompt_enabled IS 'ランダム投稿促進通知の有効/無効';
COMMENT ON COLUMN public.baku_profiles.last_random_prompt_sent_at IS '最後にランダム通知を送信した日時';
COMMENT ON COLUMN public.baku_profiles.achievement_enabled IS '達成通知の有効/無効';
COMMENT ON COLUMN public.baku_profiles.last_achievement_sent IS '送信済みの達成通知タイプのリスト';
