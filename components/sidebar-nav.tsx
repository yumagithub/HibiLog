"use client";

import { useRouter, usePathname } from "next/navigation";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useBakuStore, type ActiveView } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Upload,
  BookHeart,
  Settings,
  Atom,
  BarChart3,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// 3Dバクを動的インポート（モデル版）
const Baku3DMiniWithModel = dynamic(
  () =>
    import("./baku-3d-mini-with-model").then((mod) => ({
      default: mod.Baku3DMiniWithModel,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-32 flex items-center justify-center bg-linear-to-b from-blue-50 to-purple-50 rounded-lg">
        <p className="text-xs text-gray-400">読み込み中...</p>
      </div>
    ),
  }
);

const navItems: Array<{ view: ActiveView; label: string; icon: LucideIcon }> = [
  { view: "upload", label: "投稿する", icon: Upload },
  { view: "memories", label: "思い出を見る", icon: BookHeart },
  { view: "settings", label: "設定", icon: Settings },
];

const externalNavItems = [
  { path: "/stats", label: "統計", icon: BarChart3 },
  { path: "/account", label: "アカウント", icon: User },
];

export function SidebarNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { activeView, setActiveView, hunger } = useBakuStore();

  const handleNavClick = (view: ActiveView) => {
    // 投稿タブの場合は、カメラページに遷移
    if (view === "upload") {
      router.push("/camera");
      return;
    }

    // アカウントページなど、メインページ以外にいる場合はメインページに遷移
    if (pathname !== "/") {
      router.push("/");
    }
    // ビューを設定
    setActiveView(view);
  };

  return (
    // md(768px)以上の画面でのみ表示
    <aside className="hidden md:flex flex-col gap-4 border-r p-4 bg-white/50 backdrop-blur-sm">
      <div className="flex items-center gap-2 px-2 py-4">
        <Atom className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">HibiLog</h1>
      </div>

      {/* 3Dバク表示 */}
      <div className="px-2 mb-2">
        <Suspense
          fallback={
            <div className="w-full h-32 flex items-center justify-center bg-gradient-to-b from-blue-50 to-purple-50 rounded-lg">
              <p className="text-xs text-gray-400">読み込み中...</p>
            </div>
          }
        >
          <Baku3DMiniWithModel />
        </Suspense>

        {/* 空腹度表示 */}
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>満腹度</span>
            <span className="font-medium">{Math.round(hunger)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-green-400 to-blue-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${hunger}%` }}
            />
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = pathname === "/" && activeView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => handleNavClick(item.view)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                isActive && "clay-button text-primary font-semibold"
              )}
            >
              {<item.icon className="h-5 w-5" />}
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* 外部ページへのナビゲーション */}
        {externalNavItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                isActive && "clay-button text-primary font-semibold"
              )}
            >
              {<item.icon className="h-5 w-5" />}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
