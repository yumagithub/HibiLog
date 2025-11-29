import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useBakuStore } from "@/lib/store";
import { calculateStreaks } from "@/lib/streak-calculator";

export function useStreaksCalculator(user: User | null) {
  const supabase = createClient();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const localMemories = useBakuStore((state) => state.memories);

  useEffect(() => {
    const loadStreaks = async () => {
      try {
        let memoryDates: string[] = [];

        if (!user) {
          // ゲストモード: LocalStorageから取得
          memoryDates = localMemories.map((m) => m.timestamp.split("T")[0]);
        } else {
          // ログインユーザー: Supabaseから取得
          const { data, error } = await supabase
            .from("memories")
            .select("memory_date")
            .eq("user_id", user.id)
            .order("memory_date", { ascending: false });

          if (error) {
            console.error("メモリー取得エラー:", error);
            return;
          }

          if (data) {
            memoryDates = data.map((m) => m.memory_date);
          }
        }

        const streaks = calculateStreaks(memoryDates);
        setCurrentStreak(streaks.currentStreak);
        setLongestStreak(streaks.longestStreak);
      } catch (error) {
        console.error("ストリーク計算エラー:", error);
      }
    };

    loadStreaks();

    // メモリー追加時にストリークを再計算するリスナー
    const handleMemoryAdded = () => {
      loadStreaks();
    };

    return () => {
      window.removeEventListener("memoryAdded", handleMemoryAdded);
    };
  }, [user, supabase, localMemories]);

  return { currentStreak, longestStreak };
}
