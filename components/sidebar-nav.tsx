"use client";

import { useRouter, usePathname } from "next/navigation";
import { useBakuStore, type ActiveView } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Upload, BookHeart, Settings, Atom } from "lucide-react";

const navItems: { view: ActiveView; label: string; icon: React.ElementType }[] =
  [
    { view: "upload", label: "投稿する", icon: Upload },
    { view: "memories", label: "思い出を見る", icon: BookHeart },
    { view: "settings", label: "設定", icon: Settings },
  ];

export function SidebarNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { activeView, setActiveView } = useBakuStore();

  const handleNavClick = (view: ActiveView) => {
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
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
