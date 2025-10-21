-- 1. media_enum 型を作成
CREATE TYPE media_enum AS ENUM ('photo', 'video');

-- 2. users テーブルを作成
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_anonymous BOOLEAN NOT NULL DEFAULT true,
    email TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_email_if_not_anonymous CHECK (is_anonymous = true OR email IS NOT NULL)
);
COMMENT ON TABLE public.users IS 'ユーザー情報を格納するテーブル';
COMMENT ON COLUMN public.users.id IS '主キー。各利用者を一意に識別します。初回アクセス時に生成されます。';
COMMENT ON COLUMN public.users.is_anonymous IS '利用者の状態を示すフラグ。trueなら匿名、falseなら正式登録済み。';
COMMENT ON COLUMN public.users.email IS '正式登録したユーザーのメールアドレス。匿名利用者の場合は NULL となります。';
COMMENT ON COLUMN public.users.created_at IS '利用者が最初にアプリを使い始めた日時。';


-- 3. memories テーブルを作成
CREATE TABLE public.memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    memory_date DATE NOT NULL,
    text_content TEXT,
    media_url TEXT,
    media_type media_enum,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_media_url_and_type CHECK (
        (media_url IS NULL AND media_type IS NULL) OR 
        (media_url IS NOT NULL AND media_type IS NOT NULL)
    )
);
COMMENT ON TABLE public.memories IS 'ユーザーの思い出を記録するテーブル';
COMMENT ON COLUMN public.memories.id IS '主キー。各思い出レコードを一意に識別します。';
COMMENT ON COLUMN public.memories.user_id IS '外部キー。users テーブルの id を参照します。';
COMMENT ON COLUMN public.memories.memory_date IS '思い出の対象日 (例: ''2025-10-21'')。';
COMMENT ON COLUMN public.memories.text_content IS 'ユーザーが入力したテキスト本文。';
COMMENT ON COLUMN public.memories.media_url IS 'Supabase Storageに保存した写真/動画のURL。';
COMMENT ON COLUMN public.memories.media_type IS 'メディアの種類 (''photo'' または ''video'')。';
COMMENT ON COLUMN public.memories.created_at IS 'この記録が最初に作成された日時。';
COMMENT ON COLUMN public.memories.updated_at IS 'この記録が最後に更新された日時。';

-- 4. baku_profiles テーブルを作成
CREATE TABLE public.baku_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    baku_color TEXT NOT NULL,
    size FLOAT8 NOT NULL DEFAULT 30.0 CHECK (size >= 0),
    weight FLOAT8 NOT NULL DEFAULT 5.0 CHECK (weight >= 0),
    hunger_level INTEGER NOT NULL DEFAULT 100 CHECK (hunger_level >= 0 AND hunger_level <= 100),
    last_fed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.baku_profiles IS '各ユーザーのバクのプロフィール情報を格納するテーブル';
COMMENT ON COLUMN public.baku_profiles.id IS '主キー。';
COMMENT ON COLUMN public.baku_profiles.user_id IS '外部キー (usersテーブルのidを参照)。ユニーク制約付き。';
COMMENT ON COLUMN public.baku_profiles.baku_color IS 'ユーザーが最初に選んだバクの色。';
COMMENT ON COLUMN public.baku_profiles.size IS 'バクの大きさ。投稿するたびに増加。';
COMMENT ON COLUMN public.baku_profiles.weight IS 'バクの重さ。投稿するたびに増加。';
COMMENT ON COLUMN public.baku_profiles.hunger_level IS '現在の空腹度ゲージ (0〜100)。';
COMMENT ON COLUMN public.baku_profiles.last_fed_at IS '最後に投稿した日時。';
COMMENT ON COLUMN public.baku_profiles.created_at IS 'このプロフィールが作成された日時。';
COMMENT ON COLUMN public.baku_profiles.updated_at IS 'このプロフィールが最後に更新された日時。';

-- 5. updated_at を自動更新するためのトリガー関数を作成
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. 各テーブルにトリガーを設定
CREATE TRIGGER update_memories_updated_at 
    BEFORE UPDATE ON public.memories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_baku_profiles_updated_at 
    BEFORE UPDATE ON public.baku_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Row Level Security (RLS) を有効化
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baku_profiles ENABLE ROW LEVEL SECURITY;

-- 8. 開発用のRLSポリシー（本番では修正が必要）
-- 注意: 以下のポリシーは開発用です。本番環境では認証状態に応じてアクセスを制限してください。

CREATE POLICY "Enable read access for users"
ON public.users
FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for users"
ON public.users
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for users"
ON public.users
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable read access for memories"
ON public.memories
FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for memories"
ON public.memories
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for memories"
ON public.memories
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete access for memories"
ON public.memories
FOR DELETE
USING (true);

CREATE POLICY "Enable read access for baku_profiles"
ON public.baku_profiles
FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for baku_profiles"
ON public.baku_profiles
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for baku_profiles"
ON public.baku_profiles
FOR UPDATE
USING (true)
WITH CHECK (true);