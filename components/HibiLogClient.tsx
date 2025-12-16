"use client";

import type { User } from "@supabase/supabase-js";
import { useBakuStore } from "@/lib/store";
import { BakuDisplay } from "@/components/baku-display";
import { MemoriesTab } from "@/components/memories-tab";
import { SettingsTab } from "@/components/settings-tab";
import { BottomNav } from "@/components/bottom-nav";
import { SidebarNav } from "@/components/sidebar-nav";
import { HungerDebugPanel } from "@/components/hunger-debug-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut } from "lucide-react";
import HighlightModal from "@/components/HighlightModal";
import { useAuthSession } from "@/lib/hooks/useAuthSession";
import { useStreaksCalculator } from "@/lib/hooks/useStreaksCalculator";
import { useBakuProfileSync } from "@/lib/hooks/useBakuProfileSync";

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
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        読み込み中...
      </div>
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
              <h1 className="text-4xl font-bold text-foreground mb-2">
                HibiLog
              </h1>
              <p className="text-sm text-muted-foreground">
                思い出を食べるバクを育てよう
              </p>
              {!user && (
                <p className="text-xs text-muted-foreground mt-1">
                  ゲストモード（データはこの端末のみ）
                </p>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="absolute top-0 right-0"
                title={user ? "ログアウト" : "ログイン"}
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

      {/* 月ハイライトモーダル */}
      {showHighlight && (
        <HighlightModal onClose={closeHighlight} userId={userId} />
      )}

      {/* 開発用デバッグパネル（開発環境でのみ表示） */}
      {process.env.NODE_ENV === "development" && <HungerDebugPanel />}
    </>
  );
}
