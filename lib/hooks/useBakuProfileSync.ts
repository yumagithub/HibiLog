"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useBakuStore } from "@/lib/store";

export function useBakuProfileSync(user: User | null) {
  const supabase = createClient();

  const updateHunger = useBakuStore((state) => state.updateHunger);
  const setHunger = useBakuStore((state) => state.setHunger);
  const setLastFed = useBakuStore((state) => state.setLastFed);

  // --- 1. Supabaseからバクの状態を読み込む/作成するロジック ---
  useEffect(() => {
    if (!user) return;

    const loadBakuProfile = async () => {
      try {
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from("baku_profiles")
          .select("hunger_level, last_fed_at")
          .eq("user_id", user.id)
          .single();

        // エラー処理ブロック
        if (error) {
          if (error.code === "PGRST116") {
            // PGRST116 = 行が見つからない → 初回ログインなので作成
            console.log("バクプロフィールが見つかりません。新規作成します...");

            // 初回 INSERT 処理
            const { error: insertError } = await supabase
              .from("baku_profiles")
              .insert({
                user_id: user.id,
                baku_color: "default",
                size: 1.0,
                weight: 1.0,
                hunger_level: 100,
                last_fed_at: now,
                notification_interval: "1-hour",
              });

            if (insertError) {
              if (insertError.code === "23505") {
                console.log("✅ バクプロフィールは既に存在します");
              } else {
                console.error("バクプロフィール作成エラー:", insertError);
              }
            } else {
              console.log("✅ バクプロフィールを作成しました");
            }

            //ストア更新はエラーブロック内で完結させる
            setHunger?.(100);
            setLastFed?.(now);
            updateHunger();
          } else {
            // その他の Supabase エラー
            console.error("バクのプロフィール読み込みエラー:", error);
          }
          return; // エラー処理後はここで終了
        }

        //正常データ処理ブロック (error が null の場合)
        if (data) {
          // Supabaseのデータでストアを更新
          if (data.hunger_level !== null && data.last_fed_at) {
            setHunger?.(data.hunger_level);
            setLastFed?.(data.last_fed_at);
            updateHunger();
          }
        }
      } catch (error) {
        console.error("バクのプロフィール読み込みエラー (Try-Catch):", error);
      }
    };

    loadBakuProfile();
  }, [user, supabase, setHunger, setLastFed, updateHunger]);

  // 空腹度の自動更新（1分ごと）
  useEffect(() => {
    // このロジックはuserに依存しないため、updateHunngerの変更時のみ実行
    updateHunger();

    // 1分ごとに更新
    const interval = setInterval(() => {
      updateHunger();
    }, 60000); // 60秒 = 1分

    return () => clearInterval(interval);
  }, [updateHunger]);

  // 空腹度に応じた通知
  useEffect(() => {
    // このロジックは、userや通知設定に依存して実行
    const { hunger, notificationsEnabled, status } = useBakuStore.getState();

    if (!notificationsEnabled || !user) return;

    // 空腹度が25%以下（criticalまたはhungry）の場合に通知
    if (hunger <= 25 && status === "critical") {
      // ブラウザ通知の許可を確認
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("バクがお腹を空かせています！", {
          body: "思い出を投稿してバクに食べさせてあげましょう。",
          icon: "/baku.png",
          badge: "/baku.png",
        });
      } else if (Notification.permission !== "denied") {
        // 許可をリクエスト
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification("バクがお腹を空かせています！", {
              body: "思い出を投稿してバクに食べさせてあげましょう。",
              icon: "/baku.png",
              badge: "/baku.png",
            });
          }
        });
      }
    }
  }, [user]);

  return;
}
