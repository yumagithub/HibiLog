// app/camera/preview/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Camera, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { useBakuStore } from "@/lib/store";
import { MOOD_OPTIONS, type MoodOption } from "@/lib/mood-emojis";
import { motion, AnimatePresence } from "framer-motion";
import type { GeolocationData } from "@/lib/types";




export default function CameraPreviewPage() {
  const supabase = createClient();
  const router = useRouter();
  const feedBaku = useBakuStore((state) => state.feedBaku);
  const addMemory = useBakuStore((state) => state.addMemory);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [memoryDate, setMemoryDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [textContent, setTextContent] = useState("");
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);
  const [location, setLocation] = useState<GeolocationData>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    // 認証チェック（ゲストモードも許可）
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };
    checkUser();

    // 撮影した画像を取得
    try {
      const stored = sessionStorage.getItem("camera:lastShot");
      setImageUrl(stored);
    } catch {
      setImageUrl(null);
    }
    //sessionStorageから位置情報を取得しStateに設定
    const storedLocation = sessionStorage.getItem("camera:location");
    if (storedLocation) {
      try {
        setLocation(JSON.parse(storedLocation));
      } catch (e) {
        console.error("Failed to parse location data:", e);
        setLocation(null);
      }
    }
  }, [supabase]);

  const handleRetake = () => {
    sessionStorage.removeItem("camera:lastShot");
    //撮り直し時に位置情報もクリア
    sessionStorage.removeItem("camera:location");
    router.push("/camera");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return;

    // 絵文字が選択されているか確認
    if (!selectedMood) {
      setMessage({
        type: "error",
        text: "感情を選択してください",
      });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    // 【追加】位置情報変数を準備
    const lat = location?.latitude || null;
    const lng = location?.longitude || null;

    try {
      // ゲストモード: LocalStorageのみに保存
      if (!user) {
        // LocalStorageに保存
        addMemory({
          id: `guest-${Date.now()}`,
          imageUrl,
          timestamp: new Date().toISOString(),
          moodEmoji: selectedMood.emoji,
          moodCategory: selectedMood.category,
          textContent: textContent || undefined,
          // 【修正開始】位置情報を addMemory に渡す
          latitude: lat, 
          longitude: lng,
        });

        // バクに食べさせる
        feedBaku(selectedMood.category, !!textContent);

        // ストリーク再計算をトリガー
        window.dispatchEvent(new Event("memoryAdded"));

        setMessage({
          type: "success",
          text: "思い出をバクに与えました！ バクが喜んでいます。",
        });

        // sessionStorageをクリア
        sessionStorage.removeItem("camera:lastShot");

        // 少し待ってからホームに戻る
        setTimeout(() => {
          router.push("/");
        }, 1500);

        setIsUploading(false);
        return;
      }

      // ログインユーザー: Supabaseに保存
      // Data URLをBlobに変換
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `photo-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      // 1. ファイルをSupabase Storageにアップロード
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("memories_media")
        .upload(filePath, file);

      if (uploadError) {
        console.error("ストレージアップロードエラー:", uploadError);
        throw new Error(
          `ストレージへのアップロードに失敗しました: ${uploadError.message}`
        );
      }

      // 2. アップロードしたファイルの公開URLを取得
      const { data: publicUrlData } = supabase.storage
        .from("memories_media")
        .getPublicUrl(filePath);

      if (!publicUrlData) {
        throw new Error("ファイルの公開URLの取得に失敗しました。");
      }
      const mediaUrl = publicUrlData.publicUrl;

      // 3. データベースのmemoriesテーブルにレコードを挿入（絵文字を含む）
      const { error: insertError } = await supabase.from("memories").insert({
        user_id: user.id,
        memory_date: memoryDate,
        text_content: textContent || null,
        media_url: mediaUrl,
        media_type: "photo",
        mood_emoji: selectedMood.emoji,
        mood_category: selectedMood.category,
        latitude: lat,
        longitude: lng,
      });

      if (insertError) {
        console.error("データベース挿入エラー:", insertError);
        console.error("ユーザーID:", user.id);
        throw new Error(
          `データベースへの保存に失敗しました: ${insertError.message}`
        );
      }

      // 4. バクの空腹度を回復させる
      try {
        const { data: profile, error: profileError } = await supabase
          .from("baku_profiles")
          .select("hunger_level")
          .eq("user_id", user.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          throw profileError;
        }

        if (profile) {
          const currentHunger = profile.hunger_level;
          const newHungerLevel = Math.min(100, currentHunger + 20);
          const { error: updateError } = await supabase
            .from("baku_profiles")
            .update({
              hunger_level: newHungerLevel,
              last_fed_at: new Date().toISOString(),
            })
            .eq("user_id", user.id);
          if (updateError) throw updateError;
        }
      } catch (error) {
        console.error(
          "バクの空腹度の更新に失敗しました:",
          (error as Error).message
        );
      }

      // Zustandストアも更新してUIに反映（ムードカテゴリーとテキストの有無を渡す）
      feedBaku(selectedMood.category, !!textContent);

      // ストリーク再計算をトリガー
      window.dispatchEvent(new Event("memoryAdded"));

      // 成功！
      setMessage({
        type: "success",
        text: "思い出をバクに与えました！ バクが喜んでいます。",
      });

      // sessionStorageをクリア
      sessionStorage.removeItem("camera:lastShot");
      sessionStorage.removeItem("camera:location"); // 位置情報もクリア
      
      // 少し待ってからホームに戻る
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error) {
      const err = error as Error;
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container max-w-md mx-auto px-4 py-6">
        <header className="flex items-center gap-3 mb-4">
          <Button variant="outline" size="icon" onClick={handleRetake}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">思い出を記録</h1>
        </header>

        {!imageUrl ? (
          <Card className="p-6">
            <div className="text-sm text-muted-foreground space-y-3">
              <p>表示できる画像がありません。</p>
              <Button onClick={handleRetake}>カメラに戻る</Button>
            </div>
          </Card>
        ) : (
          <form onSubmit={handleSubmit}>
            <Card className="p-6 space-y-6">
              {/* プレビュー画像 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>撮影した写真</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRetake}
                    disabled={isUploading}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    撮り直し
                  </Button>
                </div>
                <div className="relative rounded-xl overflow-hidden bg-muted aspect-3/4">
                  <img
                    src={imageUrl}
                    alt="撮影した写真"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* 日付入力 */}
              <div className="space-y-2">
                <Label htmlFor="memory-date">思い出の日付</Label>
                <Input
                  id="memory-date"
                  type="date"
                  value={memoryDate}
                  onChange={(e) => setMemoryDate(e.target.value)}
                  required
                  disabled={isUploading}
                />
              </div>

              {/* 位置情報入力フィールド */}
              {location && (
              <div className="text-sm text-gray-600">
                📍 {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </div>
              )}

              {/* 感情選択 */}
              <div className="space-y-2">
                <Label>
                  今日の気分<span className="text-destructive ml-1">*</span>
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {MOOD_OPTIONS.map((mood, index) => {
                    const isSelected = selectedMood?.emoji === mood.emoji;
                    return (
                      <motion.div
                        key={mood.emoji}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: index * 0.05,
                          type: "spring",
                          stiffness: 200,
                          damping: 15,
                        }}
                      >
                        <Button
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          className={`h-auto py-4 flex flex-col items-center gap-1 w-full relative overflow-hidden ${
                            isSelected ? "shadow-lg" : ""
                          }`}
                          onClick={() => setSelectedMood(mood)}
                          disabled={isUploading}
                          asChild
                        >
                          <motion.button
                            whileHover={{
                              scale: 1.05,
                              transition: { type: "spring", stiffness: 400 },
                            }}
                            whileTap={{ scale: 0.95 }}
                            animate={
                              isSelected
                                ? {
                                    scale: [1, 1.1, 1],
                                    rotate: [0, 5, -5, 0],
                                  }
                                : {}
                            }
                            transition={{
                              duration: 0.5,
                              ease: "easeInOut",
                            }}
                          >
                            <motion.span
                              className="text-3xl flex items-center justify-center"
                              animate={
                                isSelected
                                  ? {
                                      scale: [1, 1.3, 1],
                                      rotate: [0, 360],
                                    }
                                  : {}
                              }
                              transition={{
                                duration: 0.6,
                                ease: "easeOut",
                              }}
                            >
                              <Image
                                src={mood.emoji}
                                alt={mood.label}
                                width={48}
                                height={48}
                                className="w-12 h-12"
                              />
                            </motion.span>
                            <span className="text-xs">{mood.label}</span>
                            {isSelected && (
                              <motion.div
                                className="absolute inset-0 bg-primary/20 rounded-md"
                                layoutId="selectedMoodBg"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 300,
                                  damping: 30,
                                }}
                              />
                            )}
                          </motion.button>
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
                {!selectedMood && (
                  <p className="text-xs text-muted-foreground">
                    気分を選択してください
                  </p>
                )}
              </div>

              {/* メッセージ入力 */}
              <div className="space-y-2">
                <Label htmlFor="text-content">思い出のメッセージ</Label>
                <Textarea
                  id="text-content"
                  placeholder="楽しかったこと、感じたことなどを記録しよう"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  disabled={isUploading}
                  rows={4}
                />
              </div>

              {/* エラー・成功メッセージ */}
              {message && (
                <Alert
                  variant={message.type === "error" ? "destructive" : "default"}
                >
                  {message.type === "success" ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {message.type === "success" ? "成功" : "エラー"}
                  </AlertTitle>
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}

              {/* 保存ボタン */}
              <Button
                type="submit"
                className="w-full"
                disabled={isUploading}
                size="lg"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    この思い出をバクに与える
                  </>
                )}
              </Button>
            </Card>
          </form>
        )}
      </div>
    </div>
  );
}
