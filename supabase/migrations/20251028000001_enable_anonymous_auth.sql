-- 匿名認証対応のRLSポリシー更新

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Enable read access for users" ON public.users;
DROP POLICY IF EXISTS "Enable insert access for users" ON public.users;
DROP POLICY IF EXISTS "Enable update access for users" ON public.users;

DROP POLICY IF EXISTS "Enable read access for memories" ON public.memories;
DROP POLICY IF EXISTS "Enable insert access for memories" ON public.memories;
DROP POLICY IF EXISTS "Enable update access for memories" ON public.memories;
DROP POLICY IF EXISTS "Enable delete access for memories" ON public.memories;

DROP POLICY IF EXISTS "Enable read access for baku_profiles" ON public.baku_profiles;
DROP POLICY IF EXISTS "Enable insert access for baku_profiles" ON public.baku_profiles;
DROP POLICY IF EXISTS "Enable update access for baku_profiles" ON public.baku_profiles;

-- users テーブルのポリシー（認証済みユーザー＋匿名ユーザー対応）
CREATE POLICY "Users can read own data"
ON public.users
FOR SELECT
USING (auth.uid() = id OR true); -- 開発用に全て許可

CREATE POLICY "Users can insert own data"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id OR true); -- 開発用に全て許可

CREATE POLICY "Users can update own data"
ON public.users
FOR UPDATE
USING (auth.uid() = id OR true)
WITH CHECK (auth.uid() = id OR true);

-- memories テーブルのポリシー（認証済みユーザー＋匿名ユーザー対応）
CREATE POLICY "Users can read own memories"
ON public.memories
FOR SELECT
USING (
  auth.uid() = user_id 
  OR true -- 開発用: 他のユーザーの投稿も見られる
);

CREATE POLICY "Authenticated users can insert memories"
ON public.memories
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL -- 認証済み（通常ユーザー or 匿名ユーザー）
  AND auth.uid() = user_id
);

CREATE POLICY "Users can update own memories"
ON public.memories
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own memories"
ON public.memories
FOR DELETE
USING (auth.uid() = user_id);

-- baku_profiles テーブルのポリシー（認証済みユーザー＋匿名ユーザー対応）
CREATE POLICY "Users can read own baku profile"
ON public.baku_profiles
FOR SELECT
USING (
  auth.uid() = user_id
  OR true -- 開発用: 他のユーザーのバクも見られる
);

CREATE POLICY "Authenticated users can insert baku profile"
ON public.baku_profiles
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL -- 認証済み（通常ユーザー or 匿名ユーザー）
  AND auth.uid() = user_id
);

CREATE POLICY "Users can update own baku profile"
ON public.baku_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- コメント追加
COMMENT ON POLICY "Authenticated users can insert memories" ON public.memories 
IS '認証済みユーザー（匿名含む）が自分の思い出を投稿できる';

COMMENT ON POLICY "Authenticated users can insert baku profile" ON public.baku_profiles 
IS '認証済みユーザー（匿名含む）が自分のバクプロフィールを作成できる';
