"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string; // コンテナ(Link)側のクラス（位置指定など）
  buttonClassName?: string; // ボタン自体のサイズやスタイル
  iconClassName?: string; // アイコンサイズ
};

export function HeaderAccountButton({
  className,
  buttonClassName,
  iconClassName,
}: Props) {
  return (
    <Link href="/account" title="アカウント" className={cn(className)}>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          // デフォルトボタンサイズ（iconサイズの標準はh-10 w-10想定）
          "h-10 w-10 rounded-full bg-white/90 hover:bg-white text-gray-900",
          "border border-black/10 shadow-sm backdrop-blur",
          buttonClassName,
        )}
        aria-label="アカウント"
      >
        <User className={cn("h-5 w-5", iconClassName)} />
      </Button>
    </Link>
  );
}
