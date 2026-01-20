"use client";

import { useState, useEffect } from "react";
import { useBakuStore } from "@/lib/store";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  PanInfo,
} from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Home,
  BookHeart,
  Settings,
  BarChart3,
  MapPin,
  Camera,
} from "lucide-react";

const menuItems = [
  { path: "/", label: "ホーム", icon: Home },
  { path: "/memories", label: "思い出", icon: BookHeart },
  { path: "/map", label: "マップ", icon: MapPin },
  { path: "/stats", label: "統計", icon: BarChart3 },
  { path: "/settings", label: "設定", icon: Settings },
];

// シートの状態
type SheetState = "peek" | "half";

// 各状態での高さ（px単位）
const SHEET_HEIGHTS = {
  peek: 72, // ピーク: ノッチ部分だけ見える（iPhoneジェスチャー回避のため余裕を持たせる）
  half: 180, // ハーフ: メニューが見える高さ
};

// FABのサイズ
const FAB_SIZE = 64;
const FAB_OFFSET = 32; // FABがシート上端からはみ出す量（ボタンとシートの間隔）

export function BottomSheet() {
  const router = useRouter();
  const pathname = usePathname();
  const { isMenuOpen, setIsMenuOpen } = useBakuStore();
  const [sheetState, setSheetState] = useState<SheetState>("peek");
  const dragY = useMotionValue(0);

  // メニュー開閉と状態を同期
  useEffect(() => {
    if (isMenuOpen && sheetState === "peek") {
      setSheetState("half");
    } else if (!isMenuOpen && sheetState !== "peek") {
      setSheetState("peek");
    }
  }, [isMenuOpen, sheetState]);

  // シート状態に応じた高さを計算
  const getSheetHeight = () => {
    return SHEET_HEIGHTS[sheetState];
  };

  // ドラッグ終了時の処理
  const onDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const velocity = info.velocity.y;
    const offset = info.offset.y;

    if (velocity < -300 || offset < -40) {
      setSheetState("half");
      setIsMenuOpen(true);
    } else if (velocity > 300 || offset > 40) {
      setSheetState("peek");
      setIsMenuOpen(false);
    }
    dragY.set(0);
  };

  // FABクリック（ドラッグでない場合のみ）
  const handleFabClick = () => {
    router.push("/camera");
  };

  return (
    <>
      {/* オーバーレイ */}
      <AnimatePresence>
        {sheetState !== "peek" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 z-40 md:hidden"
            onClick={() => {
              setSheetState("peek");
              setIsMenuOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* ボトムシート本体 */}
      <motion.div
        className="fixed inset-x-0 bottom-0 z-50 md:hidden"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDrag={(_, info) => dragY.set(info.offset.y)}
        onDragEnd={onDragEnd}
        animate={{ height: getSheetHeight() + FAB_OFFSET }}
        transition={{
          type: "spring",
          damping: 30,
          stiffness: 300,
        }}
        style={{ touchAction: "none" }}
      >
        {/* FAB（カメラボタン）- シートと一緒に動く */}
        <motion.button
          onClick={handleFabClick}
          className={cn(
            "absolute left-1/2 -translate-x-1/2 z-10",
            "rounded-full",
            "bg-linear-to-br from-primary to-primary/80",
            "shadow-lg shadow-primary/30",
            "flex items-center justify-center",
            "border-4 border-white",
          )}
          style={{
            width: FAB_SIZE,
            height: FAB_SIZE,
            top: 0,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="思い出を投稿"
        >
          <Camera className="h-7 w-7 text-white" />
        </motion.button>

        {/* 
          ノッチ型の背景 - SVGで表現
          
          【カーブの調整方法】
          viewBox="0 0 400 64" の座標系で描画（横400、縦64）
          中央が x=200 の位置
          
          重要なパラメータ:
          - NOTCH_RADIUS: 凹みの半径（FAB_SIZE/2 + マージン）
          - NOTCH_DEPTH: 凹みの深さ（FABがどれだけ埋まるか）
          - 角丸の開始位置: L {200 - NOTCH_RADIUS - 8},0 の部分
          - 円弧: A コマンドで正円の弧を描画
        */}
        <svg
          className="absolute inset-x-0 w-full"
          style={{ top: FAB_OFFSET }}
          height={SHEET_HEIGHTS.peek + 8}
          viewBox="0 0 400 64"
          preserveAspectRatio="none"
        >
          <defs>
            <filter
              id="notchShadow"
              x="-20%"
              y="-50%"
              width="140%"
              height="200%"
            >
              <feDropShadow
                dx="0"
                dy="-2"
                stdDeviation="3"
                floodOpacity="0.12"
              />
            </filter>
          </defs>
          {/* 
            FABに合わせた正円形の凹み
            
            パスの解説:
            M 0,16 → 左端、少し下から開始
            Q 0,0 16,0 → 左上の角丸
            L 156,0 → 左側の直線（凹み開始点まで）★ここを変えると凹みの左端位置が変わる
            Q 160,0 160,4 → 凹みへの滑らかな入り口
            A 40,40 0 0 0 200,44 → 左半分の円弧 ★40,40が半径（FAB_SIZE/2 + マージン）、44が凹みの深さ
            A 40,40 0 0 0 240,4 → 右半分の円弧
            Q 240,0 244,0 → 凹みからの滑らかな出口
            L 384,0 → 右側の直線 ★ここを変えると凹みの右端位置が変わる
            Q 400,0 400,16 → 右上の角丸
            L 400,64 → 右端下へ
            L 0,64 → 左端下へ
            Z → パスを閉じる
          */}
          <path
            d={`
              M 0,16
              Q 0,0 16,0
              L 156,0
              Q 160,0 160,4
              A 40,40 0 0 0 200,44
              A 40,40 0 0 0 240,4
              Q 240,0 244,0
              L 384,0
              Q 400,0 400,16
              L 400,64
              L 0,64
              Z
            `}
            fill="white"
            filter="url(#notchShadow)"
          />
        </svg>

        {/* 下部の背景 */}
        <div
          className="absolute inset-x-0 bottom-0 bg-white"
          style={{ top: FAB_OFFSET + SHEET_HEIGHTS.peek }}
        />

        {/* メニューコンテンツ */}
        <motion.div
          className="absolute inset-x-0 px-4 overflow-hidden"
          style={{ top: FAB_OFFSET + SHEET_HEIGHTS.peek }}
          animate={{ opacity: sheetState === "peek" ? 0 : 1 }}
          transition={{ duration: 0.15 }}
        >
          <div className="grid grid-cols-5 gap-1 max-w-sm mx-auto py-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  prefetch={true}
                  onClick={() => {
                    setSheetState("peek");
                    setIsMenuOpen(false);
                  }}
                  className="flex flex-col items-center gap-1 py-1 group"
                >
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200",
                      isActive
                        ? "bg-primary text-white shadow-md"
                        : "bg-gray-100 text-gray-600 group-hover:bg-gray-200",
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                  </motion.div>
                  <span
                    className={cn(
                      "text-[10px] font-medium",
                      isActive ? "text-primary" : "text-gray-500",
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
    </>
  );
}
