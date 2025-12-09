"use client";

import { useEffect, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useBakuStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";

// 3Dモデルコンポーネントを動的インポート（SSR無効化）
const Baku3DWithModel = dynamic(
  () =>
    import("./baku-3d-with-model").then((mod) => ({
      default: mod.Baku3DWithModel,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-80 flex items-center justify-center bg-linear-to-b from-blue-50 to-purple-50 rounded-xl">
        <p className="text-sm text-gray-500">3Dモデルを読み込み中...</p>
      </div>
    ),
  }
);

type BakuStatus = "healthy" | "normal" | "hungry" | "critical";

const statusEmojis: Record<BakuStatus, string> = {
  healthy: "😊",
  normal: "😐",
  hungry: "😟",
  critical: "😵",
};

const statusMessages: Record<BakuStatus, string> = {
  healthy: "バクは元気いっぱいです！",
  normal: "バクは普通の状態です",
  hungry: "バクがお腹を空かせています",
  critical: "危険！バクに思い出を食べさせてください！",
};

export function BakuDisplay() {
  const { hunger, lastFed, status } = useBakuStore();
  const [mounted, setMounted] = useState(false);
  const [isJumping, setIsJumping] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 空腹度が変化したら(=餌をもらったら)ジャンプする
  useEffect(() => {
    if (mounted && hunger > 50) {
      setIsJumping(true);
      const timer = setTimeout(() => setIsJumping(false), 600);
      return () => clearTimeout(timer);
    }
  }, [hunger, mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Critical Alert */}
      <AnimatePresence>
        {status === "critical" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Alert variant="destructive">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
              >
                <AlertTriangle className="h-4 w-4" />
              </motion.div>
              <AlertDescription className="font-medium">
                {statusMessages.critical}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* バク表示エリア（3Dのみ） */}
      <Suspense
          fallback={
            <div className="h-80 flex items-center justify-center">
              3Dモデルを読み込み中...
            </div>
          }
        >
          <Baku3DWithModel />
        </Suspense>
    </motion.div>
  );
}
