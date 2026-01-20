"use client";

import { SidebarNav } from "@/components/navigation/sidebar-nav";
import { BottomSheet } from "@/components/navigation/bottom-sheet";

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
  return (
    <div className="md:grid md:grid-cols-[240px_1fr]">
      {/* PC用サイドバー */}
      <SidebarNav />

      {/* メインコンテンツ */}
      <main className={className}>{children}</main>

      {/* モバイル用ボトムシート */}
      <BottomSheet />
    </div>
  );
}
