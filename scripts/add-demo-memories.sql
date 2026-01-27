-- デモアカウント a@example.com に過去のメモリーを追加するスクリプト
-- まず user_id を確認（実行前に a@example.com の user_id を取得して置き換える）

-- 使用方法：
-- 1. Supabase Dashboard → SQL Editor で実行
-- 2. 'USER_ID_HERE' を実際の user_id に置き換える

-- 30日分のメモリーを追加（今日から過去30日間）
DO $$
DECLARE
  target_user_id UUID := 'USER_ID_HERE'; -- ← ここを実際の user_id に置き換える
  days_back INTEGER := 30; -- 追加する日数
  current_day INTEGER;
  random_mood TEXT;
  random_emoji TEXT;
  random_text TEXT;
  mood_options TEXT[] := ARRAY['happy', 'sad', 'angry', 'surprised', 'neutral'];
  emoji_options TEXT[] := ARRAY['😊', '😢', '😠', '😲', '😐', '❤️', '🔥', '💪', '✨', '🌟'];
  text_options TEXT[] := ARRAY[
    '今日は良い一日だった',
    '美味しいご飯を食べた',
    '友達と楽しく過ごした',
    '新しいことに挑戦した',
    'リラックスできた',
    '頑張った一日',
    '嬉しい出来事があった',
    'いい天気だった',
    '家族と過ごした',
    '仕事が捗った'
  ];
  image_urls TEXT[] := ARRAY[
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
    'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400'
  ];
BEGIN
  FOR current_day IN 0..days_back-1 LOOP
    -- ランダムな感情・絵文字・テキストを選択
    random_mood := mood_options[1 + floor(random() * array_length(mood_options, 1))::int];
    random_emoji := emoji_options[1 + floor(random() * array_length(emoji_options, 1))::int];
    random_text := text_options[1 + floor(random() * array_length(text_options, 1))::int];
    
    INSERT INTO memories (
      user_id,
      media_url,
      memory_date,
      mood_category,
      mood_emoji,
      text_content,
      latitude,
      longitude,
      created_at
    ) VALUES (
      target_user_id,
      image_urls[1 + (current_day % array_length(image_urls, 1))],
      (NOW() - (current_day || ' days')::INTERVAL)::DATE,
      random_mood,
      random_emoji,
      random_text,
      NULL,
      NULL,
      NOW() - (current_day || ' days')::INTERVAL
    );
  END LOOP;
  
  RAISE NOTICE '% 件のメモリーを追加しました', days_back;
END $$;
