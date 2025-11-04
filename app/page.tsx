"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

import { useBakuStore } from "@/lib/store";
import { calculateStreaks } from "@/lib/streak-calculator";
import { BakuDisplay } from "@/components/baku-display";
import { UploadTab } from "@/components/upload-tab";
import { MemoriesTab } from "@/components/memories-tab";
import { SettingsTab } from "@/components/settings-tab";
import { BottomNav } from "@/components/bottom-nav";
import { SidebarNav } from "@/components/sidebar-nav";
import { HungerDebugPanel } from "@/components/hunger-debug-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut } from "lucide-react";

const CurrentView = ({ user }: { user: User }) => {
  const activeView = useBakuStore((state) => state.activeView);

  switch (activeView) {
    case "upload":
      // 投稿タブは/cameraページに遷移するため、ここには来ないはず
      return <MemoriesTab user={user} />;
    case "memories":
      return <MemoriesTab user={user} />;
    case "settings":
      return <SettingsTab user={user} />;
    default:
      return <MemoriesTab user={user} />;
  }
};

export default function HibiLogApp() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const updateHunger = useBakuStore((state) => state.updateHunger);
  const feedBaku = useBakuStore((state) => state.feedBaku);
  const setHunger = useBakuStore((state) => state.setHunger);
  const setLastFed = useBakuStore((state) => state.setLastFed);

  // 満腹度の自動更新
  useEffect(() => {
    // 初回ロード時に更新
    updateHunger();

    // 1分ごとに更新
    const interval = setInterval(() => {
      updateHunger();
    }, 60 * 1000); // 60秒 = 1分

    return () => clearInterval(interval);
  }, [updateHunger]);

  // 認証チェック
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);

        // public.usersテーブルにユーザーが存在するか確認、なければ作成
        const { data: existingUser, error: checkError } = await supabase
          .from("users")
          .select("id")
          .eq("id", session.user.id)
          .single();

        if (checkError && checkError.code === "PGRST116") {
          // ユーザーが存在しない場合、作成
          const { error: insertError } = await supabase.from("users").insert({
            id: session.user.id,
            email: session.user.email,
            is_anonymous: session.user.is_anonymous || false,
            created_at: session.user.created_at,
          });

          if (insertError) {
            console.error("ユーザー作成エラー:", insertError);
          } else {
            console.log("ユーザーレコードを作成しました");
          }
        }

        setLoading(false);
      }
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        router.push("/login");
      } else if (session) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  // ストリークを計算
  useEffect(() => {
    if (!user) return;

    const loadStreaks = async () => {
      try {
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
          const memoryDates = data.map((m) => m.memory_date);
          const streaks = calculateStreaks(memoryDates);
          setCurrentStreak(streaks.currentStreak);
          setLongestStreak(streaks.longestStreak);
        }
      } catch (error) {
        console.error("ストリーク計算エラー:", error);
      }
    };

    loadStreaks();

    // 投稿後にストリークを再計算するためのイベントリスナー
    const handleMemoryAdded = () => {
      loadStreaks();
    };
    window.addEventListener("memoryAdded", handleMemoryAdded);

    return () => {
      window.removeEventListener("memoryAdded", handleMemoryAdded);
    };
  }, [user, supabase]);

  // Supabaseからバクの状態を読み込む
  useEffect(() => {
    if (!user) return;

    const loadBakuProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("baku_profiles")
          .select("hunger_level, last_fed_at")
          .eq("user_id", user.id)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            // PGRST116 = 行が見つからない → 初回ログインなので作成
            console.log("バクプロフィールが見つかりません。新規作成します...");

            const now = new Date().toISOString();
            const { data: insertData, error: insertError } = await supabase
              .from("baku_profiles")
              .insert({
                user_id: user.id,
                baku_color: "default", // デフォルトカラー
                size: 1.0, // 初期サイズ
                weight: 1.0, // 初期体重
                hunger_level: 100,
                last_fed_at: now,
                notification_interval: "1-hour",
              });

            if (insertError) {
              if (insertError.code === "23505") {
                // 23505 = unique violation (既に存在する - 問題なし)
                console.log("✅ バクプロフィールは既に存在します");
              } else {
                // 予期しないエラー
                console.error("バクプロフィール作成エラー:", {
                  code: insertError.code,
                  message: insertError.message,
                  details: insertError.details,
                  hint: insertError.hint,
                });
              }
            } else {
              console.log("✅ バクプロフィールを作成しました:", insertData);
            }

            // どちらの場合も初期値でストアを更新
            setHunger?.(100);
            setLastFed?.(now);
            updateHunger();
          } else {
            console.error("バクのプロフィール読み込みエラー:", error);
          }
          return;
        }

        if (data) {
          // Supabaseのデータでストアを更新
          if (data.hunger_level !== null && data.last_fed_at) {
            setHunger?.(data.hunger_level);
            setLastFed?.(data.last_fed_at);
            // 現在時刻に基づいて空腹度を再計算
            updateHunger();
          }
        }
      } catch (error) {
        console.error("バクのプロフィール読み込みエラー:", error);
      }
    };

    loadBakuProfile();
  }, [user, supabase, setHunger, setLastFed, updateHunger]);

  // 空腹度の自動更新（1分ごと）
  useEffect(() => {
    // 初回実行
    updateHunger();

    // 1分ごとに更新
    const interval = setInterval(() => {
      updateHunger();
    }, 60000); // 60秒 = 1分

    return () => clearInterval(interval);
  }, [updateHunger]);

  // 空腹度に応じた通知
  useEffect(() => {
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        読み込み中...
      </div>
    );
  }

  if (!user) {
    return null; // リダイレクトが実行されるまでの間、何も表示しない
  }

  return (
    <>
      <div className="md:grid md:grid-cols-[240px_1fr]">
        {/* PC用サイドバー */}
        <SidebarNav />

        {/* メインコンテンツ */}
        <main className="min-h-screen gradient-bg pb-24 md:pb-6">
          <div className="container max-w-md md:max-w-full mx-auto px-4 md:px-6 py-6">
            {/* Header */}
            <header className="text-center mb-8 relative">
              <h1 className="text-4xl font-bold text-foreground mb-2">
                HibiLog
              </h1>
              <p className="text-sm text-muted-foreground">
                {"思い出を食べるバクを育てよう"}
              </p>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="absolute top-0 right-0"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </header>

            {/* Baku Character Display */}
            <BakuDisplay />

            {/* ストリーク表示 */}
            <Card className="mt-6 p-4">
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="text-2xl">🔥</span>
                    <span className="text-3xl font-bold text-orange-500">
                      {currentStreak}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">連続投稿</p>
                </div>

                <div className="h-12 w-px bg-border" />

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="text-2xl">🏆</span>
                    <span className="text-3xl font-bold text-yellow-600">
                      {longestStreak}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">最長記録</p>
                </div>
              </div>
            </Card>

            {/* Content Area */}
            <div className="mt-8">
              <CurrentView user={user} />
            </div>
          </div>
        </main>
      </div>

      {/* スマホ用ボトムナビゲーション */}
      <BottomNav />

      {/* 開発用デバッグパネル（開発環境でのみ表示） */}
      {process.env.NODE_ENV === "development" && <HungerDebugPanel />}
    </>
  );
}
