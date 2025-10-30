"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useBakuStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";

type BakuStatus = "healthy" | "normal" | "hungry" | "critical";

const statusEmojis: Record<BakuStatus, string> = {
  healthy: "😊",
  normal: "😐",
  hungry: "😟",
  critical: "😵",
};

const statusColors: Record<BakuStatus, string> = {
  healthy: "bg-green-500",
  normal: "bg-blue-400",
  hungry: "bg-yellow-300",
  critical: "bg-red-200",
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

  // 空腹度に応じたアニメーション設定
  const getBakuAnimation = () => {
    if (isJumping) {
      return {
        y: [0, -40, -60, -40, 0],
        rotate: [0, -5, 5, -3, 0],
        scale: [1, 1.1, 1.15, 1.1, 1],
      };
    }
    if (status === "critical") {
      return {
        x: [-3, 3, -3, 3, 0],
        rotate: [-2, 2, -2, 2, 0],
      };
    }
    if (status === "hungry") {
      return {
        rotate: [-5, 5, -5, 5, 0],
        scale: [1, 1.05, 1, 1.05, 1],
      };
    }
    if (status === "healthy") {
      return {
        y: [0, -10, 0],
        scale: [1, 1.05, 1],
      };
    }
    return {
      scale: [1, 1.02, 1],
    };
  };

  const getAnimationTransition = () => {
    if (isJumping) return { duration: 0.6 };
    if (status === "critical")
      return { duration: 0.5, repeat: Infinity, repeatDelay: 0.3 };
    if (status === "hungry")
      return { duration: 1.5, repeat: Infinity, repeatDelay: 1 };
    if (status === "healthy")
      return { duration: 2, repeat: Infinity, repeatDelay: 3 };
    return { duration: 3, repeat: Infinity, repeatDelay: 2 };
  };

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

      {/* Baku Character Card */}
      <Card className="relative overflow-hidden border-2 baku-glow">
        {/* Baku Character Area */}
        <div className="aspect-square md:aspect-auto md:h-[40vh] relative flex items-center justify-center p-8 pb-60">
          {/* Baku Character Illustration */}
          <motion.div
            className="relative group cursor-pointer"
            animate={getBakuAnimation()}
            transition={getAnimationTransition()}
            whileHover={{
              scale: 1.05,
              transition: { duration: 0.3 },
            }}
            whileTap={{
              scale: 0.98,
            }}
          >
            <div className="w-32 h-32">
              <Image
                src="/baku.png"
                alt="Baku"
                width={256}
                height={256}
                priority
              />
            </div>

            {/* Status Emoji Badge */}
            <motion.div
              className="absolute -bottom-2 -right-2 bg-card rounded-full p-3 shadow-lg border-2 border-background"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.3,
                type: "spring",
                stiffness: 200,
                damping: 10,
              }}
              whileHover={{
                scale: 1.1,
                transition: { duration: 0.3 },
              }}
            >
              <span className="text-3xl">{statusEmojis[status]}</span>
            </motion.div>
          </motion.div>
        </div>

        {/* Status Info */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 p-4 space-y-3 bg-white/90 backdrop-blur-md rounded-b-[26px]"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        >
          <div className="text-center p-3">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              状態
            </p>
            <motion.p
              className="text-lg font-bold text-foreground"
              key={status}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              {statusMessages[status]}
            </motion.p>
          </div>

          {/* Hunger Bar */}
          <div className="space-y-2 p-3">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>満腹度</span>
              <motion.span
                key={hunger}
                initial={{ scale: 1.5 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {hunger}%
              </motion.span>
            </div>
            <Progress
              value={hunger}
              className={`h-3 ${statusColors[status]} transition-all duration-500`}
            />
          </div>

          {lastFed && (
            <motion.p
              className="text-xs text-center text-muted-foreground clay-input p-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              最後の食事: {new Date(lastFed).toLocaleString("ja-JP")}
            </motion.p>
          )}
        </motion.div>
      </Card>
    </motion.div>
  );
}
