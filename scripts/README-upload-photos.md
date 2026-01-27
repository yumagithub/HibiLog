# デモ写真アップロードスクリプトの使い方

## 前提条件

1. `.env.local` に以下の環境変数が設定されている

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. `tsx` がインストールされていること
   ```bash
   npm install -D tsx
   ```

## 実行手順

### 1. 写真フォルダのパスを確認

デスクトップにある写真フォルダのパスを確認してください。
例: `~/Desktop/demo-photos` や `/Users/username/Desktop/photos`

### 2. スクリプトを実行

```bash
# 相対パス指定の例
npx tsx scripts/upload-demo-photos.ts ~/Desktop/demo-photos

# 絶対パス指定の例
npx tsx scripts/upload-demo-photos.ts /Users/username/Desktop/photos
```

### 3. 実行内容

- 指定フォルダ内の画像ファイル（jpg, jpeg, png, webp, heic）を自動検出
- ファイル名順にソートして、古い日付から順に登録
- 各写真を Supabase Storage にアップロード
- memories テーブルにレコード作成
  - user_id: dbbfc711-e93e-4d1d-8bc9-ab7d9a3e5927
  - memory_date: 今日から過去に1日ずつ遡る
  - mood_category, mood_emoji, text_content: ランダム
  - emotion_score: 70-100のランダム値

### 注意事項

- アップロードには時間がかかります（118枚で約1-2分）
- レート制限対策で各アップロード間に0.5秒の待機時間あり
- エラーが出た場合はコンソールに表示されます

## トラブルシューティング

### エラー: フォルダが見つからない

→ パスが正しいか確認してください

### エラー: SUPABASE_SERVICE_ROLE_KEY が設定されていない

→ `.env.local` に Service Role Key を追加してください
Supabase Dashboard → Settings → API → service_role (secret)

### アップロードが途中で止まる

→ Ctrl+C で中断して、再実行してください（既にアップロード済みのものはスキップされません）
