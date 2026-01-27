"use client";

import { useEffect, useState } from "react";
import { useBakuStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion"; // 追加

type Memory = {
  id: string;
  media_url: string;
  text_content: string | null;
  mood_emoji:string | null;
  memory_date: string;
  // 位置情報関連のプロパティを追加
  latitude?: number | null;
  longitude?: number | null;
};

// 【追加】配列からランダムに要素を選ぶヘルパー関数
function selectRandomMemories(arr: Memory[], count: number): Memory[] {
    // データが少ない場合はそのまま返す
    if (arr.length <= count) {
        return arr;
    }

    // Fisher-Yates (Knuth) シャッフルアルゴリズムを使用してランダムにソート
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // 最初の 'count' 個の要素を返す
    return shuffled.slice(0, count);
}

export function MonthlyHighlight({ userId }: { userId: string | null }) {
  const supabase = createClient();
  const [memories, setMemories] = useState<Memory[]>([]);

  const localMemories = useBakuStore((state) => state.memories);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 先月の年月
  const now = new Date();
  // 基準日を「今月の1日」に設定し、そこから1ヶ月引く
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  // 先月の開始日 
  const monthStart = lastMonth.toISOString().split('T')[0]; // 日付のみをSupabase向けに取得
  // 先月の終了日 
  const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]; // 0日目は前月の末日
  
  // 📦 Supabaseから今月の思い出を取得
  useEffect(() => {
    const fetchMemories = async () => {
      let fetchedMemories: Memory[] = [];

      if (!userId) {
        console.log("🟡 ゲストモード：ローカルの memories を使用");

        const guestMems: Memory[] = localMemories
          .filter((m) => {
            const date = m.timestamp.split("T")[0];
            return date >= monthStart && date <= monthEnd;
          })
          .map((m) => ({
            id: m.id,
            media_url: m.imageUrl,
            text_content: m.textContent ?? null,
            mood_emoji: m.moodEmoji ?? null, 
            memory_date: m.timestamp.split("T")[0],
            latitude: (m as any).latitude,
            longitude: (m as any).longitude,
          }));

        fetchedMemories = guestMems;
      } else {
        const { data, error } = await supabase
          .from("memories")
          .select("id, media_url, text_content, memory_date, mood_emoji, latitude, longitude")        
          .eq("user_id", userId)
          .gte("memory_date", monthStart)
          .lte("memory_date", monthEnd)
          .order("memory_date", { ascending: true });

        if (error) {
          console.error("🚨 ハイライト取得エラー:", error.message, error.details);
          fetchedMemories = [];
        } else {
          console.log("✅ 取得成功:", data);
          fetchedMemories = data || [];
        }
      }

      // 【修正開始】ランダムに最大3枚選択するロジック
      const selected = selectRandomMemories(fetchedMemories, 3);
      setMemories(selected);
      // 【修正終了】
      
      // データが新しくセットされるため、インデックスをリセット
      setCurrentIndex(0);

    };

    fetchMemories();
  }, [userId, localMemories]);

  // 【追加】クリックハンドラ
  const handleSlideClick = () => {
      setCurrentIndex((prev) => (prev + 1) % memories.length);
  };

  // ⏰ 自動スライド（4秒ごとに切り替え）
  useEffect(() => {
    if (memories.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % memories.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [memories]); // memoriesが更新されるたびにインターバルもリセット

  if (memories.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground mt-6">
        先月の思い出はまだありません。
      </div>
    );
  }

  const current = memories[currentIndex];
  // text_contentがnullの場合は空文字列として扱う
  const textContent = current.text_content ?? '';
  
  return (
    <div 
        className="relative w-full max-w-md mx-auto mt-6 rounded-2xl overflow-hidden shadow-lg bg-black/30 backdrop-blur cursor-pointer" // 【修正】カーソルをポインターに変更
        onClick={handleSlideClick} // 【修正】クリックイベントハンドラを追加
    >  
    {/* 修正ポイント: AnimatePresence で画像を囲む */}
      <div className="relative h-64 w-full bg-black flex items-center justify-center overflow-hidden">
        <AnimatePresence initial={false}>
          <motion.img
            key={current.id} // IDをキーにすることで、切り替えをアニメーション化
            src={current.media_url}
            alt="思い出"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, position: "absolute" }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence> 
      </div>     
      <div className="absolute bottom-0 w-full bg-black/60 text-white p-3 text-sm">
        
        {/* テキストと日付のコンテナ (中央揃え) */}
        <div className="text-center"> 
          <p className="font-medium truncate">{current.text_content}</p>
          <p className="text-xs mt-1 opacity-70">{current.memory_date}</p>
        </div>

        {/* 感情絵文字 (絶対配置で右端) */}
        {current.mood_emoji && (
      <div className="absolute top-1/2 right-3 transform -translate-y-1/2 text-3xl flex items-center justify-center"> 
        {/* 【修正開始】Imageコンポーネントを使用 */}
        <Image
            src={current.mood_emoji}
            alt="Mood Emoji"
            width={32} // 適切なサイズに調整
            height={32}
            className="w-8 h-8" // Tailwindのサイズも適用
        />
        {/* 【修正終了】 */}
    </div>
)}
    </div>

      {/* 🔘 スライドインジケーター */}
      <div className="absolute bottom-2 w-full flex justify-center gap-1">
        {memories.map((_, i) => (
          <span
            key={i}
            className={`h-1 w-4 rounded-full transition-all ${
              i === currentIndex ? "bg-white" : "bg-gray-400/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}