"use client";

import { useBakuStore, type ActiveView } from "@/lib/store";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  BookHeart,
  Settings,
  BarChart3,
  User,
  MapPin,
  ChevronUp,
} from "lucide-react";

// FABで投稿ボタンを表示するため、メニューからは除外
const externalNavItems = [
  { path: "/memories", label: "思い出", icon: BookHeart },
  { path: "/map", label: "マップ", icon: MapPin },
  { path: "/stats", label: "統計", icon: BarChart3 },
  { path: "/settings", label: "設定", icon: Settings },
  { path: "/account", label: "アカウント", icon: User },
];

export function SlidingMenu() {
  const pathname = usePathname();
  const { isMenuOpen, setIsMenuOpen } = useBakuStore();
  // const { activeView, setActiveView, isMenuOpen, setIsMenuOpen } = useBakuStore();
  const dragY = useMotionValue(0);

  // ドラッグ量に合わせて「メニューの中身」の透明度を変える
  const contentOpacity = useTransform(dragY, [0, -80], [0, 1]);
  const onDragEnd = (event: any, info: any) => {
    if (info.offset.y < -50) setIsMenuOpen(true);
    else if (info.offset.y > 50) setIsMenuOpen(false);
    dragY.set(0);
  };

  // ダブルタップ（ダブルクリック）時の処理
  const handleDoubleTap = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <AnimatePresence>
      <motion.div
        style={{
          // ドラッグ量（contentOpacity）に合わせて 0 → 1 に変化させる
          // 閉じている時は pointer-events-none で下のバクを触れるようにする
          opacity: isMenuOpen ? 1 : contentOpacity,
          pointerEvents: isMenuOpen ? "auto" : "none",
        }}
        // transition を設定して、カチッと開く時も滑らかに
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-md z-999 transform-gpu translate-z-0"
      />

      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.5}
        onDrag={(e, info) => dragY.set(info.offset.y)}
        onDragEnd={onDragEnd}
        initial={{ y: "100%" }}
        animate={{
          // 閉じてる時は矢印の高さ(約48px)だけ見えるように調整
          y: isMenuOpen ? "0%" : "calc(100% - 48px)",
        }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        // コンテナ自体は透明にする
        className="fixed inset-x-0 bottom-0 z-1000 flex flex-col items-center pointer-events-none"
        style={{ height: "40vh" }}
      >
        {/* --- 矢印の山（ハンドル） --- */}
        <div
          className="pointer-events-auto cursor-grab active:cursor-grabbing px-10 py-2"
          // ★ ダブルクリックイベントを追加
          onDoubleClick={handleDoubleTap}
        >
          <motion.div
            animate={
              isMenuOpen
                ? { rotate: 180, y: 0 } // 開いた時：180度回転、位置は固定
                : { rotate: 0, y: [0, -4, 0] } // 閉じた時：回転なし、上下にふわふわ
            }
            transition={
              isMenuOpen
                ? { duration: 0.3 } // 回転する時のスピード
                : {
                    y: { repeat: Infinity, duration: 2 },
                    rotate: { duration: 0.3 },
                  }
            }
            className="flex flex-col items-center"
          >
            <ChevronUp className="w-8 h-8 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
          </motion.div>
        </div>

        {/* --- メニュー本体：背景あり --- */}
        <motion.div
          style={{
            opacity: isMenuOpen ? 1 : contentOpacity,
            pointerEvents: isMenuOpen ? "auto" : "none",
          }}
          onDoubleClick={handleDoubleTap}
          className="w-full h-full bg-white  rounded-t-32px shadow-[0_-10px_40px_rgba(0,0,0,0.2)] px-6 pt-10"
        >
          <div className="grid grid-cols-3 gap-y-8 max-w-md mx-auto">
            {externalNavItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  prefetch={true}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <motion.div
                    whileTap={{ scale: 0.9, rotate: -5 }} // 押した瞬間に少し小さく、傾く
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300",
                      isActive
                        ? "bg-primary text-white shadow-lg"
                        : "bg-muted/50 text-muted-foreground group-hover:bg-muted",
                    )}
                  >
                    <item.icon className="w-6 h-6" />
                  </motion.div>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
