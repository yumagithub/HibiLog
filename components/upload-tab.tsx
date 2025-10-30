"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Upload,
  Camera,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useBakuStore } from "@/lib/store";
import { MOOD_OPTIONS, type MoodOption } from "@/lib/mood-emojis";
import { motion, AnimatePresence } from "framer-motion";

import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function UploadTab({ user }: { user: User }) {
  const supabase = createClient();
  const feedBaku = useBakuStore((state) => state.feedBaku);
  const [memoryDate, setMemoryDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [textContent, setTextContent] = useState("");
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setFile(files[0]);
      setMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setMessage({
        type: "error",
        text: "ユーザー情報が取得できませんでした。",
      });
      return;
    }
    if (!file) {
      setMessage({ type: "error", text: "思い出の画像を選択してください。" });
      return;
    }
    if (!memoryDate) {
      setMessage({ type: "error", text: "思い出の日付を入力してください。" });
      return;
    }
    if (!selectedMood) {
      setMessage({ type: "error", text: "感情を選択してください。" });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
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

      // 3. データベースのmemoriesテーブルにレコードを挿入
      const mediaType = file.type.startsWith("image/")
        ? "photo"
        : file.type.startsWith("video/")
        ? "video"
        : null;
      if (mediaType === null) {
        throw new Error(
          "対応していないファイル形式です。画像または動画を選択してください。"
        );
      }

      const { error: insertError } = await supabase.from("memories").insert({
        user_id: user.id,
        memory_date: memoryDate,
        text_content: textContent || null,
        media_url: mediaUrl,
        media_type: mediaType,
        mood_emoji: selectedMood.emoji,
        mood_category: selectedMood.category,
      });

      if (insertError) {
        console.error("データベース挿入エラー:", insertError);
        console.error("ユーザーID:", user.id);
        console.error("認証状態:", await supabase.auth.getUser());
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

        // 予期せぬエラーはスローする (行がないエラーPGRST116は正常系として扱う)
        if (profileError && profileError.code !== "PGRST116") {
          throw profileError;
        }

        if (profile) {
          // --- プロフィールが存在する場合: UPDATE ---
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
        } else {
          // --- プロフィールが存在しない場合: INSERT ---
          const { error: insertError } = await supabase
            .from("baku_profiles")
            .insert({
              user_id: user.id,
              hunger_level: 70, // 初期値50 + 回復量20を想定
              baku_color: "blue", // 初期値
              // last_fed_at, size, weightなどはDBのデフォルト値が使われる
            });
          if (insertError) throw insertError;
        }
      } catch (error) {
        // 空腹度の更新に失敗しても、思い出の投稿は成功しているため、
        // エラーは投げずにコンソールに出力するに留める
        console.error(
          "バクの空腹度の更新に失敗しました:",
          (error as Error).message
        );
      }

      // Zustandストアも更新してUIに反映
      feedBaku();

      // 成功！
      setMessage({
        type: "success",
        text: "思い出をバクに与えました！ バクが喜んでいます。",
      });
      // フォームをリセット
      setMemoryDate(new Date().toISOString().split("T")[0]);
      setTextContent("");
      setFile(null);
      const fileInput = document.getElementById(
        "file-upload"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      const err = error as Error;
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  // ギャラリーから選択していない場合は選択画面を表示
  if (!file) {
    return (
      <Card className="p-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">思い出を記録</h2>
          <p className="text-sm text-muted-foreground">
            写真をアップロードしてバクに思い出を与えよう
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-auto py-6 flex-col gap-3"
          >
            <Link href="/camera">
              <Camera className="h-8 w-8" />
              <span>カメラで撮影</span>
            </Link>
          </Button>

          <Label
            htmlFor="file-upload"
            className="flex flex-col items-center gap-3 h-auto py-6 cursor-pointer border-2 border-dashed rounded-lg hover:bg-accent transition-colors"
          >
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm font-medium">ギャラリーから選択</span>
            <Input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </Label>
        </div>
      </Card>
    );
  }

  // ファイルが選択されている場合は編集・保存画面を表示
  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">思い出を記録</h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setFile(null)}
            disabled={isUploading}
          >
            キャンセル
          </Button>
        </div>

        {file && file.type.startsWith("image/") && (
          <div className="relative rounded-xl overflow-hidden bg-muted aspect-3/4">
            <img
              src={URL.createObjectURL(file)}
              alt="選択した画像"
              className="w-full h-full object-cover"
            />
          </div>
        )}

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

        <div className="space-y-2">
          <Label htmlFor="text-content">思い出の記録</Label>
          <Textarea
            id="text-content"
            placeholder="楽しかったこと、感じたことなどを記録しよう"
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            disabled={isUploading}
          />
        </div>

        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
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

        <Button type="submit" className="w-full" disabled={isUploading}>
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
              アップロード中...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              この思い出をバクに与える
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}
