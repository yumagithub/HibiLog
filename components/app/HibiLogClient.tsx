"use client";

import type { User } from "@supabase/supabase-js";
import { useBakuStore } from "@/lib/store";
import { BakuDisplay } from "@/components/baku/baku-display";
import { MemoriesTab } from "@/components/memory/memories-tab";
import { SettingsTab } from "@/components/memory/settings-tab";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { SidebarNav } from "@/components/navigation/sidebar-nav";
import { HungerDebugPanel } from "@/components/baku/hunger-debug-panel";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import HighlightModal from "@/components/highlight/HighlightModal";
import { useAuthSession } from "@/lib/hooks/useAuthSession";
import { useStreaksCalculator } from "@/lib/hooks/useStreaksCalculator";
import { useBakuProfileSync } from "@/lib/hooks/useBakuProfileSync";
import { Skeleton } from "../ui/skeleton";
import { StreakCard } from "../streak/streak-card";

const CurrentView = ({ user }: { user: User | null }) => {
  const activeView = useBakuStore((state) => state.activeView);

  switch (activeView) {
    case "upload":
      return <MemoriesTab user={user} />;
    case "memories":
      return <MemoriesTab user={user} />;
    case "settings":
      return <SettingsTab user={user} />;
    default:
      return <MemoriesTab user={user} />;
  }
};

export function HibiLogClient() {
  const { user, userId, loading, handleLogout, showHighlight, closeHighlight } =
    useAuthSession();
  const { currentStreak, longestStreak } = useStreaksCalculator(user);

  // バクプロフィールとハングリー状態を管理
  useBakuProfileSync(user);

  if (loading) {
    return (
      <>
        <div className="md:grid md:grid-cols-[240px_1fr]">
          {/* PC用サイドバー */}
          <SidebarNav />

          {/* メインコンテンツ */}
          <main className="min-h-screen gradient-bg pb-24 md:pb-6">
            <div className="container max-w-md md:max-w-full mx-auto px-4 md:px-6 py-6">
              {/* Header Skeleton */}
              <header className="text-center mb-8 relative">
                <Skeleton className="h-10 w-48 mx-auto mb-2" />
                <Skeleton className="h-4 w-64 mx-auto" />
              </header>

              {/* Baku Display Skeleton */}
              <div className="space-y-4">
                {/* Alert の場所確保 */}
                <div className="h-12" />

                {/* 3D表示エリアのスケルトン */}
                <div className="w-full h-80 rounded-xl bg-linear-to-b from-blue-50 to-purple-50 flex items-center justify-center">
                  <div className="animate-pulse space-y-3 text-center">
                    <div className="w-32 h-32 rounded-full bg-gray-300/50 mx-auto" />
                    <div className="h-4 w-24 bg-gray-300/50 mx-auto rounded" />
                  </div>
                </div>
              </div>

              {/* ストリーク表示スケルトン */}
              <div className="mt-6 clay-card p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center space-y-2">
                    <Skeleton className="h-8 w-16 mx-auto" />
                    <Skeleton className="h-4 w-20 mx-auto" />
                  </div>
                  <div className="text-center space-y-2">
                    <Skeleton className="h-8 w-16 mx-auto" />
                    <Skeleton className="h-4 w-20 mx-auto" />
                  </div>
                </div>
              </div>

              {/* Content Area Skeleton */}
              <div className="mt-8 space-y-4">
                <Skeleton className="h-64 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
              </div>
            </div>
          </main>
        </div>

        {/* スマホ用ボトムナビゲーション */}
        <BottomNav />
      </>
    );
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
              {loading ? (
                <>
                  <Skeleton className="h-10 w-48 mx-auto mb-2" />
                  <Skeleton className="h-4 w-64 mx-auto" />
                </>
              ) : (
                <>
                  <h1 className="text-4xl font-bold text-foreground mb-2">
                    HibiLog
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    思い出を食べるバクを育てよう
                  </p>
                </>
              )}

              {!loading && !user && (
                <p className="text-xs text-muted-foreground mt-1">
                  ゲストモード（データはこの端末のみ）
                </p>
              )}

              {!loading && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="absolute top-0 right-0"
                  title={user ? "ログアウト" : "ログイン"}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              )}
            </header>

            {/* Baku Character Display */}
            <BakuDisplay />

            {/* ストリーク表示 */}
            <StreakCard
              loading={loading}
              currentStreak={currentStreak}
              longestStreak={longestStreak}
            />

            {/* Content Area */}
            <div className="mt-8">
              <CurrentView user={user} />
            </div>
          </div>
        </main>
      </div>

      {/* スマホ用ボトムナビゲーション */}
      <BottomNav />

      {/* 月ハイライトモーダル */}
      {showHighlight && (
        <HighlightModal onClose={closeHighlight} userId={userId} />
      )}

      {/* 開発用デバッグパネル（開発環境でのみ表示） */}
      {process.env.NODE_ENV === "development" && <HungerDebugPanel />}
    </>
  );
}
