"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useBakuStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import BakuLoading from "./baku-loading";
import BakuDisplaySkeleton from "@/components/baku/baku-display-skeleton";

// 3Dモデルコンポーネントを動的インポート（SSR無効化）
const Baku3DWithModel = dynamic(
  () =>
    import("./baku-3d-with-model").then((mod) => ({
      default: mod.Baku3DWithModel,
    })),
  {
    ssr: false,
    loading: () => <BakuLoading />,
  }
);

type BakuStatus = "healthy" | "normal" | "hungry" | "critical";

const statusMessages: Record<BakuStatus, string> = {
  healthy: "バクは元気いっぱいです！",
  normal: "バクは普通の状態です",
  hungry: "バクがお腹を空かせています",
  critical: "危険！バクに思い出を食べさせてください！",
};

export function BakuDisplay() {
  const { hunger, status } = useBakuStore();

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
      <Suspense fallback={<BakuLoading />}>
        <Baku3DWithModel />
      </Suspense>
    </motion.div>
  );
}
