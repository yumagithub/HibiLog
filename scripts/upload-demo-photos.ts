// デモアカウント用にデスクトップの写真を一括アップロードするスクリプト
// 実行方法: npx tsx scripts/upload-demo-photos.ts

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";

// .env.local を読み込む
config({ path: path.resolve(process.cwd(), ".env.local") });

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

// 環境変数から Supabase の設定を取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service Role Key が必要

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ エラー: 環境変数が設定されていません");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✅" : "❌");
  console.error("SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✅" : "❌");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const USER_ID = "d738b73e-5b1b-424c-a093-6ee7d4a0bdaf";

// 絵文字と対応するスコアのマッピング（lib/mood-emojis.ts に準拠）
const moodOptions = [
  {
    emoji: "/laugh.png",
    label: "嬉しい",
    category: "positive",
    defaultScore: 80,
  },
  {
    emoji: "/heart.png",
    label: "愛してる",
    category: "positive",
    defaultScore: 90,
  },
  { emoji: "/like.png", label: "いいね", category: "calm", defaultScore: 70 },
  {
    emoji: "/fire.png",
    label: "燃える",
    category: "positive",
    defaultScore: 70,
  },
  {
    emoji: "/sad.png",
    label: "悲しい",
    category: "negative",
    defaultScore: 30,
  },
  {
    emoji: "/sweat.png",
    label: "疲れた",
    category: "tired",
    defaultScore: 40,
  },
  {
    emoji: "/Angry_Flat_Icon.png",
    label: "怒り",
    category: "negative",
    defaultScore: 20,
  },
  {
    emoji: "/shocked.png",
    label: "驚き",
    category: "neutral",
    defaultScore: 55,
  },
];

// ランダムなテキストデータ
const textContents = [
  "今日は良い一日だった",
  "美味しいご飯を食べた",
  "友達と楽しく過ごした",
  "新しいことに挑戦した",
  "リラックスできた",
  "頑張った一日",
  "嬉しい出来事があった",
  "いい天気だった",
  "家族と過ごした",
  "仕事が捗った",
  "楽しいひととき",
  "充実した時間",
  "素敵な出会い",
  "心が温まった",
  "感謝の気持ち",
];

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

async function uploadPhoto(filePath: string, dayOffset: number) {
  try {
    console.log(
      `📤 アップロード中: ${path.basename(filePath)} (${dayOffset}日前)`,
    );

    // ファイルを読み込む
    const fileBuffer = await readFile(filePath);
    const fileName = path.basename(filePath);
    const fileExt = path.extname(fileName);

    // Supabase Storage にアップロード
    const timestamp = Date.now() - dayOffset * 24 * 60 * 60 * 1000;
    const storagePath = `public/${USER_ID}-${timestamp}${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("memories_media")
      .upload(storagePath, fileBuffer, {
        contentType: `image/${fileExt.replace(".", "")}`,
        upsert: false,
      });

    if (uploadError) {
      console.error(`❌ アップロードエラー: ${fileName}`, uploadError);
      return null;
    }

    // 公開URLを取得
    const { data: urlData } = supabase.storage
      .from("memories_media")
      .getPublicUrl(storagePath);

    const mediaUrl = urlData.publicUrl;

    // memories テーブルにレコード挿入
    const memoryDate = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000);
    const createdAt = memoryDate.toISOString();

    // 絵文字に応じた感情スコアを使用
    const selectedMood = getRandomItem(moodOptions);

    const { data: memoryData, error: memoryError } = await supabase
      .from("memories")
      .insert({
        user_id: USER_ID,
        memory_date: memoryDate.toISOString().split("T")[0],
        text_content: getRandomItem(textContents),
        media_url: mediaUrl,
        media_type: "photo",
        created_at: createdAt,
        mood_emoji: selectedMood.emoji,
        mood_category: selectedMood.category,
        latitude: null,
        longitude: null,
        location_name: null,
        address: null,
        emotion_score: selectedMood.defaultScore, // 絵文字に応じたスコア
        prefecture_code: null,
      });

    if (memoryError) {
      console.error(`❌ DB挿入エラー: ${fileName}`, memoryError);
      return null;
    }

    console.log(`✅ 完了: ${fileName}`);
    return mediaUrl;
  } catch (error) {
    console.error(`❌ エラー: ${path.basename(filePath)}`, error);
    return null;
  }
}

async function main() {
  // デスクトップのパスを取得
  const desktopPath = path.join(process.env.HOME || "", "Desktop");

  console.log("📁 デスクトップのパス:", desktopPath);
  console.log("🔍 写真フォルダを指定してください（相対パスまたは絶対パス）:");
  console.log("   例: Desktop/photos または /Users/username/Desktop/photos");

  // コマンドライン引数からフォルダパスを取得
  const folderPath = process.argv[2];

  if (!folderPath) {
    console.error("❌ エラー: フォルダパスを引数で指定してください");
    console.log(
      "使用例: npx tsx scripts/upload-demo-photos.ts ~/Desktop/photos",
    );
    process.exit(1);
  }

  const targetPath = path.resolve(folderPath);
  console.log(`📂 対象フォルダ: ${targetPath}`);

  // フォルダの存在確認
  try {
    const stats = await stat(targetPath);
    if (!stats.isDirectory()) {
      console.error("❌ エラー: 指定されたパスはフォルダではありません");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ エラー: フォルダが見つかりません", error);
    process.exit(1);
  }

  // 画像ファイルを取得（jpg, jpeg, png, webp, heic）
  const files = await readdir(targetPath);
  const imageFiles = files
    .filter((file) => /\.(jpg|jpeg|png|webp|heic)$/i.test(file))
    .sort(); // ファイル名でソート

  console.log(`\n📸 見つかった画像: ${imageFiles.length}枚`);

  if (imageFiles.length === 0) {
    console.error("❌ エラー: 画像ファイルが見つかりませんでした");
    process.exit(1);
  }

  console.log("\n🚀 アップロード開始...\n");

  let successCount = 0;
  let failCount = 0;

  // 1枚ずつアップロード（並列処理だとレート制限に引っかかる可能性があるため）
  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const filePath = path.join(targetPath, file);
    const dayOffset = imageFiles.length - 1 - i; // 古い順にするため逆順

    const result = await uploadPhoto(filePath, dayOffset);

    if (result) {
      successCount++;
    } else {
      failCount++;
    }

    // レート制限対策: 少し待つ
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log("\n" + "=".repeat(50));
  console.log(`✨ 完了！`);
  console.log(`   成功: ${successCount}枚`);
  console.log(`   失敗: ${failCount}枚`);
  console.log("=".repeat(50));
}

main().catch(console.error);
