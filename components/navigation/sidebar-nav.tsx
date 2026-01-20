"use client";

import { useRouter, usePathname } from "next/navigation";
import { useBakuStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Home,
  BookHeart,
  Settings,
  Atom,
  BarChart3,
  MapPin,
} from "lucide-react";
import Link from "next/link";

const navItems = [
  { path: "/", label: "ホーム", icon: Home },
  { path: "/memories", label: "思い出を見る", icon: BookHeart },
  { path: "/map", label: "マップ", icon: MapPin },
  { path: "/stats", label: "統計", icon: BarChart3 },
  { path: "/settings", label: "設定", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { hunger } = useBakuStore();

  return (
    // md(768px)以上の画面でのみ表示
    <aside className="hidden md:flex flex-col gap-4 border-r p-4 bg-white/50 backdrop-blur-sm">
      <div className="flex items-center gap-2 px-2 py-4">
        <Atom className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">HibiLog</h1>
      </div>

      {/* 空腹度表示 */}
      <div className="px-2 mb-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>満腹度</span>
            <span className="font-medium">{Math.round(hunger)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-linear-to-r from-green-400 to-blue-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${hunger}%` }}
            />
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                isActive && "clay-button text-primary font-semibold",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
