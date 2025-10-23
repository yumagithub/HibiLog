"use client";

import type React from "react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, Camera, Terminal, CheckCircle, XCircle } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function UploadTab({ user }: { user: User }) {
  const supabase = createClient();
  const [memoryDate, setMemoryDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [textContent, setTextContent] = useState("");
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
      });

      if (insertError) {
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

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
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

        <div className="space-y-2">
          <Label htmlFor="file-upload">思い出の写真</Label>
          <div className="flex items-center space-x-4">
            <Input
              id="file-upload"
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="flex-grow"
              required
              disabled={isUploading}
            />
          </div>
          {file && (
            <p className="text-sm text-muted-foreground mt-2">
              選択中のファイル: {file.name}
            </p>
          )}
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
