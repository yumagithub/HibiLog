"use client";

import { useRouter, usePathname } from "next/navigation";
import { useBakuStore, type ActiveView } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Upload, BookHeart, Settings } from "lucide-react";

const navItems: { view: ActiveView; label: string; icon: React.ElementType }[] =
  [
    { view: "upload", label: "投稿", icon: Upload },
    { view: "memories", label: "思い出", icon: BookHeart },
    { view: "settings", label: "設定", icon: Settings },
  ];

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { activeView, setActiveView } = useBakuStore();

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
    <nav className="fixed bottom-0 left-0 right-0 h-20 border-t clay-card bg-white/70 md:hidden">
      <div className="grid h-full grid-cols-3 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === "/" && activeView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => handleNavClick(item.view)}
              className="flex flex-col items-center justify-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-200 focus:outline-none"
            >
              <div
                className={cn(
                  "flex items-center justify-center w-16 h-8 rounded-full transition-all duration-200",
                  isActive && "clay-button -translate-y-1 scale-110"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
              </div>
              <span className={cn(isActive && "text-primary font-semibold")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
